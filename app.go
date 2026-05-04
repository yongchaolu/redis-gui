package main

import (
	"context"
	"errors"
	"os"
	"path/filepath"

	"redis-gui/internal/analyzer"
	"redis-gui/internal/model"
	"redis-gui/internal/redisclient"
	"redis-gui/internal/report"
	"redis-gui/internal/store"
)

type App struct {
	ctx     context.Context
	store   *store.Store
	sampler *redisclient.Sampler
	initErr error
}

func NewApp() *App {
	return &App{sampler: redisclient.NewSampler()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	configDir, err := os.UserConfigDir()
	if err != nil {
		a.initErr = err
		return
	}
	db, err := store.Open(filepath.Join(configDir, "redis-gui", "redis-gui.db"))
	if err != nil {
		a.initErr = err
		return
	}
	a.store = db
}

func (a *App) shutdown(ctx context.Context) {
	if a.store != nil {
		_ = a.store.Close()
	}
}

func (a *App) ListConnections() ([]model.ConnectionProfile, error) {
	if err := a.ready(); err != nil {
		return nil, err
	}
	return a.store.ListConnections()
}

func (a *App) SaveConnection(profile model.ConnectionProfile) (model.ConnectionProfile, error) {
	if err := a.ready(); err != nil {
		return model.ConnectionProfile{}, err
	}
	return a.store.SaveConnection(profile)
}

func (a *App) TestConnection(profile model.ConnectionProfile) (model.ConnectionTestResult, error) {
	return a.sampler.TestConnection(a.context(), profile)
}

func (a *App) RunAnalysis(connectionID string) (model.AnalysisReport, error) {
	if err := a.ready(); err != nil {
		return model.AnalysisReport{}, err
	}
	profile, err := a.store.GetConnection(connectionID)
	if err != nil {
		return model.AnalysisReport{}, err
	}
	snapshot, err := a.sampler.Sample(a.context(), profile)
	if err != nil {
		return model.AnalysisReport{}, err
	}
	result := analyzer.Analyze(snapshot)
	if err := a.store.SaveReport(result); err != nil {
		return model.AnalysisReport{}, err
	}
	return result, nil
}

func (a *App) ListReports() ([]model.ReportSummary, error) {
	if err := a.ready(); err != nil {
		return nil, err
	}
	return a.store.ListReports()
}

func (a *App) GetReport(reportID string) (model.AnalysisReport, error) {
	if err := a.ready(); err != nil {
		return model.AnalysisReport{}, err
	}
	return a.store.GetReport(reportID)
}

func (a *App) DeleteConnection(connectionID string) error {
	if err := a.ready(); err != nil {
		return err
	}
	if err := a.store.DeleteReportsByConnection(connectionID); err != nil {
		return err
	}
	return a.store.DeleteConnection(connectionID)
}

func (a *App) GetConfig(connectionID string) (map[string]string, error) {
	if err := a.ready(); err != nil {
		return nil, err
	}
	profile, err := a.store.GetConnection(connectionID)
	if err != nil {
		return nil, err
	}
	return a.sampler.ReadConfig(a.context(), profile)
}

func (a *App) GetServerInfo(connectionID string) (map[string]string, error) {
	if err := a.ready(); err != nil {
		return nil, err
	}
	profile, err := a.store.GetConnection(connectionID)
	if err != nil {
		return nil, err
	}
	return a.sampler.ReadInfoSections(a.context(), profile)
}

func (a *App) GetSlowLog(connectionID string) ([]model.SlowLogEntry, error) {
	if err := a.ready(); err != nil {
		return nil, err
	}
	profile, err := a.store.GetConnection(connectionID)
	if err != nil {
		return nil, err
	}
	return a.sampler.ReadSlowLog(a.context(), profile)
}

func (a *App) GetRealtimeOPS(connectionID string) (int, error) {
	if err := a.ready(); err != nil {
		return 0, err
	}
	profile, err := a.store.GetConnection(connectionID)
	if err != nil {
		return 0, err
	}
	return a.sampler.ReadOPS(a.context(), profile)
}

func (a *App) ExportReport(reportID string) (string, error) {
	if err := a.ready(); err != nil {
		return "", err
	}
	result, err := a.store.GetReport(reportID)
	if err != nil {
		return "", err
	}
	return report.ToHTML(result), nil
}

func (a *App) ready() error {
	if a.initErr != nil {
		return a.initErr
	}
	if a.store == nil {
		return errors.New("store is not initialized")
	}
	return nil
}

func (a *App) context() context.Context {
	if a.ctx == nil {
		return context.Background()
	}
	return a.ctx
}
