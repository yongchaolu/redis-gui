package analyzer

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"redis-gui/internal/model"
)

func Analyze(snapshot model.SampleSnapshot) model.AnalysisReport {
	findings := make([]model.RiskFinding, 0)
	breakdown := map[string]int{
		"连接":  100,
		"延迟":  100,
		"内存":  100,
		"客户端": 100,
		"复制":  100,
		"集群":  100,
	}
	metrics := map[string]string{
		"nodes": fmt.Sprintf("%d", len(snapshot.Nodes)),
	}
	totalCommands := int64(0)
	for _, node := range snapshot.Nodes {
		for _, stat := range node.CommandStats {
			totalCommands += stat.Calls
		}
	}

	for _, node := range snapshot.Nodes {
		if node.Error != "" {
			breakdown["连接"] -= 45
			findings = append(findings, finding(model.SeverityCritical, "connection", "节点采样失败", node.Error, "确认网络、认证、TLS 和 Redis 进程状态。", node.Address))
			continue
		}
		info := node.Info
		blocked := intValue(info["blocked_clients"])
		clients := intValue(info["connected_clients"])
		usedMemory := floatValue(info["used_memory"])
		maxMemory := floatValue(info["maxmemory"])
		fragmentation := floatValue(info["mem_fragmentation_ratio"])

		if len(node.Slowlogs) > 0 {
			maxSlow := maxSlowlogMicros(node.Slowlogs)
			severity := model.SeverityMedium
			penalty := 10
			if maxSlow >= 100_000 || len(node.Slowlogs) >= 10 {
				severity = model.SeverityHigh
				penalty = 18
			}
			breakdown["延迟"] -= penalty
			findings = append(findings, finding(severity, "slow_query", "发现慢查询", fmt.Sprintf("%s 慢查询 %d 条，最高耗时 %.1fms。", node.Address, len(node.Slowlogs), float64(maxSlow)/1000), "优先检查相同命令模式的大 key、Lua 脚本或无界集合操作。", node.Address))
		}
		for _, event := range node.LatencyEvents {
			if event.MaxMs >= 100 {
				breakdown["延迟"] -= 10
				findings = append(findings, finding(model.SeverityMedium, "latency_event", "Redis latency 事件偏高", fmt.Sprintf("%s 事件 %s 最高 %dms。", node.Address, event.Name, event.MaxMs), "结合 slowlog 和系统层指标确认 fork、AOF、网络或命令尖刺。", node.Address))
			}
		}
		if blocked > 0 {
			breakdown["客户端"] -= min(30, blocked*6)
			findings = append(findings, finding(model.SeverityHigh, "blocked_clients", "存在阻塞客户端", fmt.Sprintf("%s blocked_clients=%d。", node.Address, blocked), "检查 BLPOP、XREAD、Lua 脚本和长事务，避免连接池被阻塞请求耗尽。", node.Address))
		}
		if clients >= 3000 {
			breakdown["客户端"] -= 12
			findings = append(findings, finding(model.SeverityMedium, "client_growth", "客户端连接数偏高", fmt.Sprintf("%s connected_clients=%d。", node.Address, clients), "确认连接池上限、短连接释放和服务实例扩容是否符合预期。", node.Address))
		}
		if maxMemory > 0 {
			ratio := usedMemory / maxMemory
			metrics["memory_usage"] = fmt.Sprintf("%.0f%%", ratio*100)
			if ratio >= 0.9 {
				breakdown["内存"] -= 25
				findings = append(findings, finding(model.SeverityHigh, "memory_pressure", "内存接近上限", fmt.Sprintf("%s used_memory/maxmemory=%.1f%%。", node.Address, ratio*100), "清理大 key、确认淘汰策略，并评估扩容或分片迁移。", node.Address))
			}
		}
		if fragmentation >= 1.6 {
			breakdown["内存"] -= 12
			findings = append(findings, finding(model.SeverityMedium, "memory_fragmentation", "内存碎片率偏高", fmt.Sprintf("%s mem_fragmentation_ratio=%.2f。", node.Address, fragmentation), "观察 allocator 行为，必要时评估主动 defrag 或维护窗口重启。", node.Address))
		}
		if strings.EqualFold(info["rdb_last_bgsave_status"], "err") || strings.EqualFold(info["aof_last_write_status"], "err") {
			breakdown["连接"] -= 18
			findings = append(findings, finding(model.SeverityHigh, "persistence", "持久化状态异常", fmt.Sprintf("%s RDB=%s AOF=%s。", node.Address, info["rdb_last_bgsave_status"], info["aof_last_write_status"]), "检查磁盘空间、权限、AOF 重写状态和最近 Redis 日志。", node.Address))
		}
		if strings.EqualFold(node.Role, "replica") && strings.ToLower(info["master_link_status"]) != "" && strings.ToLower(info["master_link_status"]) != "up" {
			breakdown["复制"] -= 35
			findings = append(findings, finding(model.SeverityCritical, "replication_link", "副本复制链路断开", fmt.Sprintf("%s master_link_status=%s。", node.Address, info["master_link_status"]), "确认 master 可达性、复制认证和网络 ACL。", node.Address))
		}
	}

	if lag := estimateReplicationLag(snapshot.Nodes); lag > 10_000 {
		breakdown["复制"] -= 20
		findings = append(findings, finding(model.SeverityHigh, "replication_lag", "主从复制偏移延迟过高", fmt.Sprintf("master 与 replica offset 差距约 %d。", lag), "确认副本网络、磁盘压力和主节点写入尖刺，避免故障切换扩大数据丢失窗口。", ""))
	}

	if snapshot.Cluster != nil {
		if snapshot.Cluster.Error != "" {
			breakdown["集群"] -= 45
			findings = append(findings, finding(model.SeverityCritical, "cluster_sampling", "集群采样失败", snapshot.Cluster.Error, "确认集群节点网络连通性、认证和 TLS 配置。", "cluster"))
		}
		if strings.ToLower(snapshot.Cluster.State) != "" && strings.ToLower(snapshot.Cluster.State) != "ok" {
			breakdown["集群"] -= 30
			findings = append(findings, finding(model.SeverityCritical, "cluster_state", "集群状态异常", fmt.Sprintf("cluster_state=%s。", snapshot.Cluster.State), "优先处理 fail 节点、槽位迁移和节点握手问题。", "cluster"))
		}
		if snapshot.Cluster.SlotsAssigned > 0 && snapshot.Cluster.SlotsAssigned < 16384 {
			breakdown["集群"] -= 20
			findings = append(findings, finding(model.SeverityHigh, "cluster_slots", "槽位未完全覆盖", fmt.Sprintf("cluster_slots_assigned=%d/16384。", snapshot.Cluster.SlotsAssigned), "检查槽位分配，避免部分 key 无法访问。", "cluster"))
		}
		if snapshot.Cluster.SlotsFail > 0 {
			breakdown["集群"] -= 18
			findings = append(findings, finding(model.SeverityHigh, "cluster_slots_fail", "存在失败槽位", fmt.Sprintf("cluster_slots_fail=%d。", snapshot.Cluster.SlotsFail), "定位 fail 槽位所在 master，完成 failover 或 reshard。", "cluster"))
		}
	}

	for _, node := range snapshot.Nodes {
		if node.Error != "" {
			continue
		}
		info := node.Info

		if len(node.CommandStats) > 0 {
			nodeTotal := int64(0)
			for _, stat := range node.CommandStats {
				nodeTotal += stat.Calls
			}
			for _, stat := range node.CommandStats {
				if nodeTotal > 0 && float64(stat.Calls)/float64(nodeTotal) > 0.3 && stat.UsecPerCall > 1000 {
					breakdown["延迟"] -= 18
					findings = append(findings, finding(model.SeverityHigh, "hot_command", "热点命令耗时偏高", fmt.Sprintf("%s 命令 %s 占比 %.0f%%，平均耗时 %.2fms。", node.Address, stat.Name, float64(stat.Calls)/float64(nodeTotal)*100, float64(stat.UsecPerCall)/1000), "检查该命令是否涉及大 key、无界集合或缺少索引。", node.Address))
				}
				if stat.UsecPerCall > 10000 {
					breakdown["延迟"] -= 20
					findings = append(findings, finding(model.SeverityHigh, "expensive_command", "存在高耗时命令", fmt.Sprintf("%s 命令 %s 平均耗时 %.2fms。", node.Address, stat.Name, float64(stat.UsecPerCall)/1000), "优化该命令的数据结构或使用 Pipeline 批量执行。", node.Address))
				}
			}
		}

		for _, bk := range node.BigKeys {
			if bk.Size > 1024*1024 {
				breakdown["内存"] -= 22
				findings = append(findings, finding(model.SeverityHigh, "big_key", "存在超大 Key", fmt.Sprintf("%s key=%s 类型=%s 大小=%.2fMB。", node.Address, bk.Name, bk.Type, float64(bk.Size)/(1024*1024)), "拆分大 key、使用分片或评估是否需要完整数据。", node.Address))
			} else if bk.Size > 100*1024 {
				breakdown["内存"] -= 12
				findings = append(findings, finding(model.SeverityMedium, "big_key", "存在较大 Key", fmt.Sprintf("%s key=%s 类型=%s 大小=%.2fKB。", node.Address, bk.Name, bk.Type, float64(bk.Size)/1024), "关注该 key 的访问频率和增长趋势。", node.Address))
			}
			if (bk.Type == "hash" || bk.Type == "list" || bk.Type == "set" || bk.Type == "zset") && bk.Length > 10000 {
				breakdown["内存"] -= 18
				findings = append(findings, finding(model.SeverityHigh, "big_collection", "集合元素过多", fmt.Sprintf("%s key=%s 类型=%s 元素数=%d。", node.Address, bk.Name, bk.Type, bk.Length), "考虑分页、分片或清理过期数据。", node.Address))
			}
		}

		if len(node.MemoryStats) > 0 {
			totalAlloc := floatValue(node.MemoryStats["total.allocated"])
			overhead := floatValue(node.MemoryStats["overhead.total"])
			if totalAlloc > 0 && overhead/totalAlloc > 0.5 {
				breakdown["内存"] -= 18
				findings = append(findings, finding(model.SeverityHigh, "memory_overhead", "内存开销占比过高", fmt.Sprintf("%s overhead/total=%.1f%%。", node.Address, overhead/totalAlloc*100), "检查是否存在大量小 key、过期 key 未清理或数据结构选择不当。", node.Address))
			}
		}

		hits := floatValue(info["keyspace_hits"])
		misses := floatValue(info["keyspace_misses"])
		if hits+misses > 1000 {
			rate := hits / (hits + misses) * 100
			if rate < 50 {
				breakdown["内存"] -= 15
				findings = append(findings, finding(model.SeverityHigh, "low_hit_rate", "缓存命中率过低", fmt.Sprintf("%s 命中率 %.1f%%（hits=%.0f misses=%.0f）。", node.Address, rate, hits, misses), "检查 key 过期策略、应用层缓存逻辑或内存不足导致的驱逐。", node.Address))
			} else if rate < 80 {
				breakdown["内存"] -= 8
				findings = append(findings, finding(model.SeverityMedium, "low_hit_rate", "缓存命中率偏低", fmt.Sprintf("%s 命中率 %.1f%%。", node.Address, rate), "评估缓存 key 设计和数据预热策略。", node.Address))
			}
		}

		evicted := intValue(info["evicted_keys"])
		policy := info["maxmemory_policy"]
		if evicted > 1000 && (strings.Contains(policy, "volatile") || strings.Contains(policy, "random")) {
			breakdown["内存"] -= 18
			findings = append(findings, finding(model.SeverityHigh, "high_eviction", "淘汰策略可能导致数据丢失", fmt.Sprintf("%s evicted_keys=%d policy=%s。", node.Address, evicted, policy), "考虑扩容、优化 maxmemory_policy 或清理不必要的数据。", node.Address))
		}

		if len(node.Clients) > 0 {
			for _, client := range node.Clients {
				idle := intValue(client.Age)
				if idle > 3600 {
					breakdown["客户端"] -= 10
					findings = append(findings, finding(model.SeverityMedium, "idle_client", "存在长时间空闲连接", fmt.Sprintf("%s 客户端 %s idle=%ds。", node.Address, client.Addr, idle), "检查连接池配置，避免连接泄漏。", node.Address))
					break
				}
			}
		}

		aofBase := floatValue(info["aof_base_size"])
		aofCurrent := floatValue(info["aof_current_size"])
		if aofBase > 0 && aofCurrent/aofBase > 3 {
			breakdown["连接"] -= 15
			findings = append(findings, finding(model.SeverityHigh, "aof_rewrite_lag", "AOF 重写严重滞后", fmt.Sprintf("%s AOF 体积膨胀 %.1f 倍（base=%.1fMB current=%.1fMB）。", node.Address, aofCurrent/aofBase, aofBase/(1024*1024), aofCurrent/(1024*1024)), "手动触发 BGREWRITEAOF 或检查重写是否频繁失败。", node.Address))
		}
		aofRewriteSec := intValue(info["aof_last_rewrite_time_sec"])
		if aofRewriteSec > 60 {
			breakdown["连接"] -= 12
			findings = append(findings, finding(model.SeverityHigh, "aof_rewrite_lag", "AOF 重写耗时过长", fmt.Sprintf("%s 上次重写耗时 %ds。", node.Address, aofRewriteSec), "AOF 文件过大时重写会阻塞，考虑定期重写或减小 AOF 体积。", node.Address))
		}
		bgsaveSec := intValue(info["rdb_last_bgsave_time_sec"])
		if bgsaveSec > 60 {
			breakdown["连接"] -= 15
			findings = append(findings, finding(model.SeverityHigh, "bgsave_slow", "RDB 后台保存耗时过长", fmt.Sprintf("%s 上次 BGSAVE 耗时 %ds。", node.Address, bgsaveSec), "数据量过大时 fork 耗时增加，考虑分片或调整保存策略。", node.Address))
		}
	}

	bigKeyCount := 0
	opsPerSec := 0.0
	for _, node := range snapshot.Nodes {
		bigKeyCount += len(node.BigKeys)
		opsPerSec += floatValue(node.Info["instantaneous_ops_per_sec"])
	}
	metrics["big_keys"] = fmt.Sprintf("%d", bigKeyCount)
	metrics["ops_per_sec"] = fmt.Sprintf("%.0f", opsPerSec)
	if totalCommands > 0 {
		metrics["total_commands"] = fmt.Sprintf("%d", totalCommands)
	}
	if len(snapshot.Nodes) > 0 {
		if policy := snapshot.Nodes[0].Info["maxmemory_policy"]; policy != "" {
			metrics["maxmemory_policy"] = policy
		}
	}

	for key, value := range breakdown {
		breakdown[key] = clamp(value, 0, 100)
	}
	score := weightedScore(breakdown)
	sortFindings(findings)
	return model.AnalysisReport{
		ID:           fmt.Sprintf("report-%d", time.Now().UnixNano()),
		ConnectionID: snapshot.ConnectionID,
		Connection:   snapshot.Connection,
		Mode:         snapshot.Mode,
		Score:        score,
		Severity:     severityFor(score, findings),
		GeneratedAt:  time.Now().UnixNano(),
		Summary:      summaryFor(score, findings),
		Breakdown:    breakdown,
		Metrics:      metrics,
		Findings:     findings,
		Snapshot:     snapshot,
	}
}

func finding(severity model.Severity, category, title, evidence, recommendation, node string) model.RiskFinding {
	return model.RiskFinding{Severity: severity, Category: category, Title: title, Evidence: evidence, Recommendation: recommendation, Node: node}
}

func weightedScore(breakdown map[string]int) int {
	weights := map[string]float64{"连接": .18, "延迟": .2, "内存": .18, "客户端": .14, "复制": .15, "集群": .15}
	score := 0.0
	for key, weight := range weights {
		score += float64(breakdown[key]) * weight
	}
	return clamp(int(math.Round(score)), 0, 100)
}

func severityFor(score int, findings []model.RiskFinding) model.Severity {
	for _, item := range findings {
		if item.Severity == model.SeverityCritical {
			return model.SeverityCritical
		}
	}
	if score < 60 {
		return model.SeverityHigh
	}
	if score < 80 {
		return model.SeverityMedium
	}
	return model.SeverityLow
}

func summaryFor(score int, findings []model.RiskFinding) string {
	if len(findings) == 0 {
		return "Redis 实例状态健康，未发现需要立即处理的性能风险。"
	}
	return fmt.Sprintf("本次分析发现 %d 个风险项，综合评分 %d。请优先处理高危和严重项。", len(findings), score)
}

func sortFindings(findings []model.RiskFinding) {
	rank := map[model.Severity]int{model.SeverityCritical: 0, model.SeverityHigh: 1, model.SeverityMedium: 2, model.SeverityLow: 3}
	sort.SliceStable(findings, func(i, j int) bool {
		return rank[findings[i].Severity] < rank[findings[j].Severity]
	})
}

func estimateReplicationLag(nodes []model.NodeSample) int64 {
	var masterOffset int64
	var minReplicaOffset int64
	for _, node := range nodes {
		if strings.EqualFold(node.Role, "master") {
			masterOffset = max64(masterOffset, int64Value(node.Info["master_repl_offset"]))
		}
		if strings.EqualFold(node.Role, "replica") {
			offset := int64Value(node.Info["slave_repl_offset"])
			if offset > 0 && (minReplicaOffset == 0 || offset < minReplicaOffset) {
				minReplicaOffset = offset
			}
		}
	}
	if masterOffset == 0 || minReplicaOffset == 0 || masterOffset <= minReplicaOffset {
		return 0
	}
	return masterOffset - minReplicaOffset
}

func maxSlowlogMicros(entries []model.SlowLogEntry) int64 {
	var maxValue int64
	for _, entry := range entries {
		maxValue = max64(maxValue, entry.DurationMicros)
	}
	return maxValue
}

func intValue(value string) int {
	parsed, _ := strconv.Atoi(strings.TrimSpace(value))
	return parsed
}

func int64Value(value string) int64 {
	parsed, _ := strconv.ParseInt(strings.TrimSpace(value), 10, 64)
	return parsed
}

func floatValue(value string) float64 {
	parsed, _ := strconv.ParseFloat(strings.TrimSpace(value), 64)
	return parsed
}

func clamp(value, low, high int) int {
	if value < low {
		return low
	}
	if value > high {
		return high
	}
	return value
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
