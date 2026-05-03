package store_test

import (
	"strings"
	"testing"
	"time"

	"redis-gui/internal/model"
	"redis-gui/internal/store"
)

func TestStoreEncryptsPasswordsAndRoundTripsReports(t *testing.T) {
	db, err := store.Open(t.TempDir() + "/redis-gui.db")
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	defer db.Close()

	profile := model.ConnectionProfile{
		Name:           "prod",
		Mode:           model.ConnectionModeStandalone,
		Addresses:      []string{"127.0.0.1:6379"},
		Username:       "default",
		Password:       "super-secret",
		TimeoutSeconds: 3,
	}
	saved, err := db.SaveConnection(profile)
	if err != nil {
		t.Fatalf("save connection: %v", err)
	}
	if saved.Password != "" {
		t.Fatalf("saved profile should not expose password, got %q", saved.Password)
	}

	raw, err := db.DebugRawConnectionRow(saved.ID)
	if err != nil {
		t.Fatalf("raw row: %v", err)
	}
	if strings.Contains(raw, "super-secret") {
		t.Fatalf("password was stored in plaintext: %s", raw)
	}

	loaded, err := db.GetConnection(saved.ID)
	if err != nil {
		t.Fatalf("get connection: %v", err)
	}
	if loaded.Password != "super-secret" {
		t.Fatalf("expected decrypted password for backend use, got %q", loaded.Password)
	}

	report := model.AnalysisReport{
		ID:           "report-1",
		ConnectionID: saved.ID,
		Connection:   saved.Name,
		Mode:         saved.Mode,
		Score:        88,
		Severity:     model.SeverityLow,
		GeneratedAt:  time.Date(2026, 5, 1, 11, 0, 0, 0, time.UTC),
		Findings:     []model.RiskFinding{{Category: "slow_query", Title: "慢查询"}},
	}
	if err := db.SaveReport(report); err != nil {
		t.Fatalf("save report: %v", err)
	}

	summaries, err := db.ListReports()
	if err != nil {
		t.Fatalf("list reports: %v", err)
	}
	if len(summaries) != 1 || summaries[0].ID != report.ID {
		t.Fatalf("unexpected summaries: %#v", summaries)
	}
	loadedReport, err := db.GetReport(report.ID)
	if err != nil {
		t.Fatalf("get report: %v", err)
	}
	if loadedReport.Findings[0].Category != "slow_query" {
		t.Fatalf("unexpected loaded report: %#v", loadedReport)
	}
}
