package analyzer_test

import (
	"testing"
	"time"

	"redis-gui/internal/analyzer"
	"redis-gui/internal/model"
)

func TestAnalyzeFlagsSlowQueriesBlockedClientsAndReplicationLag(t *testing.T) {
	snapshot := model.SampleSnapshot{
		ConnectionID: "conn-prod",
		Mode:         model.ConnectionModeCluster,
		SampledAt:    time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC).UnixNano(),
		Nodes: []model.NodeSample{
			{
				Address: "127.0.0.1:7001",
				Role:    "master",
				Info: map[string]string{
					"connected_clients":       "4800",
					"blocked_clients":         "4",
					"used_memory":             "950000000",
					"maxmemory":               "1000000000",
					"mem_fragmentation_ratio": "1.86",
					"master_repl_offset":      "100000",
				},
				Slowlogs: []model.SlowLogEntry{
					{ID: 1, DurationMicros: 180000, Command: "EVALSHA heavy-script"},
					{ID: 2, DurationMicros: 90000, Command: "HGETALL huge-hash"},
				},
			},
			{
				Address: "127.0.0.1:7011",
				Role:    "replica",
				Info: map[string]string{
					"master_link_status": "up",
					"slave_repl_offset":  "70000",
				},
			},
		},
		Cluster: &model.ClusterSample{State: "fail", KnownNodes: 6, SlotsAssigned: 15000, SlotsOK: 15000, SlotsFail: 120},
	}

	report := analyzer.Analyze(snapshot)

	if report.Score >= 80 {
		t.Fatalf("expected score below 80 for risky snapshot, got %d", report.Score)
	}
	assertFinding(t, report.Findings, "slow_query")
	assertFinding(t, report.Findings, "blocked_clients")
	assertFinding(t, report.Findings, "memory_pressure")
	assertFinding(t, report.Findings, "cluster_state")
	assertFinding(t, report.Findings, "replication_lag")
}

func TestAnalyzeHealthySnapshotKeepsHighScore(t *testing.T) {
	snapshot := model.SampleSnapshot{
		ConnectionID: "conn-dev",
		Mode:         model.ConnectionModeStandalone,
		SampledAt:    time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC).UnixNano(),
		Nodes: []model.NodeSample{{
			Address: "127.0.0.1:6379",
			Role:    "master",
			Info: map[string]string{
				"connected_clients":       "18",
				"blocked_clients":         "0",
				"used_memory":             "120000000",
				"maxmemory":               "1000000000",
				"mem_fragmentation_ratio": "1.12",
				"rdb_last_bgsave_status":  "ok",
				"aof_last_write_status":   "ok",
			},
		}},
	}

	report := analyzer.Analyze(snapshot)

	if report.Score < 90 {
		t.Fatalf("expected healthy score >= 90, got %d with findings %#v", report.Score, report.Findings)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("expected no findings for healthy snapshot, got %#v", report.Findings)
	}
}

func assertFinding(t *testing.T, findings []model.RiskFinding, category string) {
	t.Helper()
	for _, finding := range findings {
		if finding.Category == category {
			return
		}
	}
	t.Fatalf("expected finding category %q in %#v", category, findings)
}
