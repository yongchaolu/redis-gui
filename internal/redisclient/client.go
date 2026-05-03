package redisclient

import (
	"context"
	"crypto/tls"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"redis-gui/internal/model"
)

type Sampler struct{}

func NewSampler() *Sampler {
	return &Sampler{}
}

func (s *Sampler) TestConnection(ctx context.Context, profile model.ConnectionProfile) (model.ConnectionTestResult, error) {
	ctx, cancel := context.WithTimeout(ctx, timeout(profile))
	defer cancel()
	switch profile.Mode {
	case model.ConnectionModeCluster:
		client := redis.NewClusterClient(clusterOptions(profile))
		defer client.Close()
		if err := client.Ping(ctx).Err(); err != nil {
			return model.ConnectionTestResult{OK: false, Message: err.Error(), Mode: string(profile.Mode)}, nil
		}
	case model.ConnectionModeSentinel:
		master, err := s.discoverSentinelMaster(ctx, profile)
		if err != nil {
			return model.ConnectionTestResult{OK: false, Message: err.Error(), Mode: string(profile.Mode)}, nil
		}
		client := redis.NewClient(optionsFor(profile, master))
		defer client.Close()
		if err := client.Ping(ctx).Err(); err != nil {
			return model.ConnectionTestResult{OK: false, Message: err.Error(), Mode: string(profile.Mode)}, nil
		}
	default:
		client := redis.NewClient(optionsFor(profile, firstAddress(profile)))
		defer client.Close()
		if err := client.Ping(ctx).Err(); err != nil {
			return model.ConnectionTestResult{OK: false, Message: err.Error(), Mode: string(profile.Mode)}, nil
		}
	}
	return model.ConnectionTestResult{OK: true, Message: "连接成功，只读诊断可用。", Mode: string(profile.Mode)}, nil
}

func (s *Sampler) Sample(ctx context.Context, profile model.ConnectionProfile) (model.SampleSnapshot, error) {
	ctx, cancel := context.WithTimeout(ctx, timeout(profile)*3)
	defer cancel()
	snapshot := model.SampleSnapshot{
		ConnectionID: profile.ID,
		Connection:   profile.Name,
		Mode:         profile.Mode,
		SampledAt:    time.Now(),
	}
	switch profile.Mode {
	case model.ConnectionModeCluster:
		client := redis.NewClusterClient(clusterOptions(profile))
		defer client.Close()
		clusterInfo, err1 := client.ClusterInfo(ctx).Result()
		clusterNodes, err2 := client.ClusterNodes(ctx).Result()
		if err1 != nil || err2 != nil {
			errMsg := ""
			if err1 != nil {
				errMsg = "CLUSTER INFO: " + err1.Error()
			}
			if err2 != nil {
				if errMsg != "" {
					errMsg += "; "
				}
				errMsg += "CLUSTER NODES: " + err2.Error()
			}
			snapshot.Cluster = &model.ClusterSample{Error: errMsg}
		} else {
			snapshot.Cluster = parseCluster(clusterInfo, clusterNodes)
		}
		err := client.ForEachShard(ctx, func(ctx context.Context, shard *redis.Client) error {
			snapshot.Nodes = append(snapshot.Nodes, sampleNode(ctx, shard, shard.Options().Addr))
			return nil
		})
		if err != nil {
			return snapshot, err
		}
	case model.ConnectionModeSentinel:
		master, err := s.discoverSentinelMaster(ctx, profile)
		if err != nil {
			return snapshot, err
		}
		snapshot.Sentinel = &model.SentinelSample{MasterName: profile.SentinelMaster, MasterAddr: master}
		client := redis.NewClient(optionsFor(profile, master))
		defer client.Close()
		snapshot.Nodes = append(snapshot.Nodes, sampleNode(ctx, client, master))
	default:
		addr := firstAddress(profile)
		client := redis.NewClient(optionsFor(profile, addr))
		defer client.Close()
		snapshot.Nodes = append(snapshot.Nodes, sampleNode(ctx, client, addr))
	}
	return snapshot, nil
}

func sampleNode(ctx context.Context, client *redis.Client, address string) model.NodeSample {
	node := model.NodeSample{Address: address, Info: map[string]string{}}
	info, err := client.Info(ctx).Result()
	if err != nil {
		node.Error = err.Error()
		return node
	}
	node.Info = parseInfo(info)
	node.Role = roleFromInfo(node.Info)
	node.Slowlogs = readSlowlog(ctx, client)
	node.LatencyEvents = readLatency(ctx, client)
	node.Clients = readClients(ctx, client)
	node.CommandStats = readCommandStats(info)
	node.MemoryStats = readMemoryStats(ctx, client)
	node.BigKeys = scanBigKeys(ctx, client)
	return node
}

func readSlowlog(ctx context.Context, client *redis.Client) []model.SlowLogEntry {
	items, err := client.SlowLogGet(ctx, 128).Result()
	if err != nil {
		return nil
	}
	entries := make([]model.SlowLogEntry, 0, len(items))
	for _, item := range items {
		args := make([]string, 0, len(item.Args))
		for _, arg := range item.Args {
			args = append(args, fmt.Sprint(arg))
		}
		entries = append(entries, model.SlowLogEntry{
			ID:             item.ID,
			DurationMicros: item.Duration.Microseconds(),
			Command:        strings.Join(args, " "),
			At:             item.Time.Unix(),
		})
	}
	return entries
}

func readLatency(ctx context.Context, client *redis.Client) []model.LatencyEvent {
	result, err := client.Do(ctx, "LATENCY", "LATEST").Result()
	if err != nil {
		return nil
	}
	rows, ok := result.([]any)
	if !ok {
		return nil
	}
	events := make([]model.LatencyEvent, 0, len(rows))
	for _, row := range rows {
		cols, ok := row.([]any)
		if !ok || len(cols) < 4 {
			continue
		}
		events = append(events, model.LatencyEvent{
			Name:        fmt.Sprint(cols[0]),
			LastUnixSec: int64FromAny(cols[1]),
			LatestMs:    int64FromAny(cols[2]),
			MaxMs:       int64FromAny(cols[3]),
		})
	}
	return events
}

func readClients(ctx context.Context, client *redis.Client) []model.ClientInfo {
	raw, err := client.ClientList(ctx).Result()
	if err != nil {
		return nil
	}
	lines := strings.Split(strings.TrimSpace(raw), "\n")
	clients := make([]model.ClientInfo, 0, len(lines))
	for _, line := range lines {
		fields := parseKeyValueLine(line, " ")
		clients = append(clients, model.ClientInfo{ID: fields["id"], Addr: fields["addr"], Name: fields["name"], Age: fields["age"], Flags: fields["flags"], Command: fields["cmd"]})
	}
	return clients
}

func (s *Sampler) discoverSentinelMaster(ctx context.Context, profile model.ConnectionProfile) (string, error) {
	if profile.SentinelMaster == "" {
		return "", fmt.Errorf("sentinel master name is required")
	}
	var lastErr error
	for _, addr := range profile.Addresses {
		client := redis.NewSentinelClient(&redis.Options{Addr: addr, Password: profile.Password, Username: profile.Username, TLSConfig: tlsConfig(profile)})
		result, err := client.GetMasterAddrByName(ctx, profile.SentinelMaster).Result()
		client.Close()
		if err == nil && len(result) == 2 {
			return result[0] + ":" + result[1], nil
		}
		lastErr = err
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("sentinel master not found")
	}
	return "", lastErr
}

func parseInfo(raw string) map[string]string {
	info := make(map[string]string)
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			info[parts[0]] = parts[1]
		}
	}
	return info
}

func parseCluster(info, nodes string) *model.ClusterSample {
	fields := parseInfo(info)
	return &model.ClusterSample{
		State:         fields["cluster_state"],
		KnownNodes:    intValue(fields["cluster_known_nodes"]),
		SlotsAssigned: intValue(fields["cluster_slots_assigned"]),
		SlotsOK:       intValue(fields["cluster_slots_ok"]),
		SlotsFail:     intValue(fields["cluster_slots_fail"]),
		RawInfo:       info,
		RawNodes:      nodes,
	}
}

func parseKeyValueLine(line, sep string) map[string]string {
	values := make(map[string]string)
	for _, field := range strings.Split(line, sep) {
		parts := strings.SplitN(field, "=", 2)
		if len(parts) == 2 {
			values[parts[0]] = parts[1]
		}
	}
	return values
}

func roleFromInfo(info map[string]string) string {
	if role := info["role"]; role != "" {
		return role
	}
	return "unknown"
}

func optionsFor(profile model.ConnectionProfile, addr string) *redis.Options {
	return &redis.Options{
		Addr:         addr,
		Username:     profile.Username,
		Password:     profile.Password,
		DB:           0,
		DialTimeout:  timeout(profile),
		ReadTimeout:  timeout(profile),
		WriteTimeout: timeout(profile),
		TLSConfig:    tlsConfig(profile),
	}
}

func clusterOptions(profile model.ConnectionProfile) *redis.ClusterOptions {
	return &redis.ClusterOptions{
		Addrs:        profile.Addresses,
		Username:     profile.Username,
		Password:     profile.Password,
		DialTimeout:  timeout(profile),
		ReadTimeout:  timeout(profile),
		WriteTimeout: timeout(profile),
		TLSConfig:    tlsConfig(profile),
	}
}

func tlsConfig(profile model.ConnectionProfile) *tls.Config {
	if !profile.TLS {
		return nil
	}
	return &tls.Config{MinVersion: tls.VersionTLS12}
}

func firstAddress(profile model.ConnectionProfile) string {
	if len(profile.Addresses) == 0 {
		return "127.0.0.1:6379"
	}
	return profile.Addresses[0]
}

func timeout(profile model.ConnectionProfile) time.Duration {
	if profile.TimeoutSeconds <= 0 {
		return 3 * time.Second
	}
	return time.Duration(profile.TimeoutSeconds) * time.Second
}

func readCommandStats(info string) []model.CommandStat {
	var stats []model.CommandStat
	for _, line := range strings.Split(info, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "cmdstat_") {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}
		name := strings.TrimPrefix(parts[0], "cmdstat_")
		fields := parseKeyValueLine(parts[1], ",")
		stat := model.CommandStat{Name: name}
		stat.Calls = int64Value(fields["calls"])
		stat.Usec = int64Value(fields["usec"])
		stat.UsecPerCall = int64Value(fields["usec_per_call"])
		if stat.Calls > 0 {
			stats = append(stats, stat)
		}
	}
	return stats
}

func readMemoryStats(ctx context.Context, client *redis.Client) map[string]string {
	result, err := client.Do(ctx, "MEMORY", "STATS").Result()
	if err != nil {
		return nil
	}
	items, ok := result.([]any)
	if !ok || len(items)%2 != 0 {
		return nil
	}
	stats := make(map[string]string)
	for i := 0; i < len(items); i += 2 {
		key := fmt.Sprint(items[i])
		stats[key] = fmt.Sprint(items[i+1])
	}
	return stats
}

func scanBigKeys(ctx context.Context, client *redis.Client) []model.BigKey {
	const maxScan = 5000
	const bigKeyThreshold = 10 * 1024
	var bigKeys []model.BigKey
	var cursor uint64
	scanned := 0
	for scanned < maxScan {
		keys, nextCursor, err := client.Scan(ctx, cursor, "", 100).Result()
		if err != nil {
			break
		}
		for _, key := range keys {
			if scanned >= maxScan {
				break
			}
			scanned++
			size, err := client.MemoryUsage(ctx, key).Result()
			if err != nil {
				continue
			}
			if size >= bigKeyThreshold {
				keyType, _ := client.Type(ctx, key).Result()
				ttl, _ := client.TTL(ctx, key).Result()
				var length int64
				switch keyType {
				case "string":
					length, _ = client.StrLen(ctx, key).Result()
				case "list":
					length, _ = client.LLen(ctx, key).Result()
				case "set":
					length, _ = client.SCard(ctx, key).Result()
				case "zset":
					length, _ = client.ZCard(ctx, key).Result()
				case "hash":
					length, _ = client.HLen(ctx, key).Result()
				}
				bigKeys = append(bigKeys, model.BigKey{
					Name:   key,
					Type:   keyType,
					Size:   size,
					Length: length,
					TTL:    int64(ttl.Seconds()),
				})
			}
		}
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
	return bigKeys
}

func intValue(value string) int {
	parsed, _ := strconv.Atoi(strings.TrimSpace(value))
	return parsed
}

func int64Value(value string) int64 {
	parsed, _ := strconv.ParseInt(strings.TrimSpace(value), 10, 64)
	return parsed
}

func int64FromAny(value any) int64 {
	switch typed := value.(type) {
	case int64:
		return typed
	case int:
		return int64(typed)
	case string:
		parsed, _ := strconv.ParseInt(typed, 10, 64)
		return parsed
	default:
		parsed, _ := strconv.ParseInt(fmt.Sprint(value), 10, 64)
		return parsed
	}
}
