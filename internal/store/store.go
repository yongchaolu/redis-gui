package store

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"redis-gui/internal/model"

	_ "modernc.org/sqlite"
)

type Store struct {
	db  *sql.DB
	key []byte
}

func Open(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}
	key, err := loadOrCreateKey(path + ".key")
	if err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	store := &Store{db: db, key: key}
	if err := store.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS connections (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	mode TEXT NOT NULL,
	addresses_json TEXT NOT NULL,
	sentinel_master TEXT NOT NULL DEFAULT '',
	username TEXT NOT NULL DEFAULT '',
	password_cipher TEXT NOT NULL DEFAULT '',
	tls INTEGER NOT NULL DEFAULT 0,
	timeout_seconds INTEGER NOT NULL DEFAULT 3,
	tags_json TEXT NOT NULL DEFAULT '[]',
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
	id TEXT PRIMARY KEY,
	connection_id TEXT NOT NULL,
	connection_name TEXT NOT NULL,
	mode TEXT NOT NULL,
	score INTEGER NOT NULL,
	severity TEXT NOT NULL,
	finding_count INTEGER NOT NULL,
	generated_at TEXT NOT NULL,
	report_json TEXT NOT NULL
);`)
	return err
}

func (s *Store) SaveConnection(profile model.ConnectionProfile) (model.ConnectionProfile, error) {
	now := time.Now()
	if profile.ID == "" {
		profile.ID = fmt.Sprintf("conn-%d", now.UnixNano())
		profile.CreatedAt = now
	}
	if profile.UpdatedAt.IsZero() {
		profile.UpdatedAt = now
	}
	if profile.TimeoutSeconds <= 0 {
		profile.TimeoutSeconds = 3
	}
	if profile.Name == "" {
		return model.ConnectionProfile{}, errors.New("connection name is required")
	}
	if len(profile.Addresses) == 0 {
		return model.ConnectionProfile{}, errors.New("at least one address is required")
	}
	if profile.Mode == "" {
		profile.Mode = model.ConnectionModeStandalone
	}
	addresses, _ := json.Marshal(profile.Addresses)
	tags, _ := json.Marshal(profile.Tags)
	passwordCipher, err := s.encrypt(profile.Password)
	if err != nil {
		return model.ConnectionProfile{}, err
	}
	if profile.Password == "" && profile.ID != "" {
		existing, _ := s.passwordCipher(profile.ID)
		passwordCipher = existing
	}
	_, err = s.db.Exec(`
INSERT INTO connections (id, name, mode, addresses_json, sentinel_master, username, password_cipher, tls, timeout_seconds, tags_json, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
	name=excluded.name,
	mode=excluded.mode,
	addresses_json=excluded.addresses_json,
	sentinel_master=excluded.sentinel_master,
	username=excluded.username,
	password_cipher=excluded.password_cipher,
	tls=excluded.tls,
	timeout_seconds=excluded.timeout_seconds,
	tags_json=excluded.tags_json,
	updated_at=excluded.updated_at`,
		profile.ID, profile.Name, profile.Mode, string(addresses), profile.SentinelMaster, profile.Username, passwordCipher, boolInt(profile.TLS), profile.TimeoutSeconds, string(tags), profile.CreatedAt.Format(time.RFC3339Nano), profile.UpdatedAt.Format(time.RFC3339Nano))
	if err != nil {
		return model.ConnectionProfile{}, err
	}
	profile.Password = ""
	return profile, nil
}

func (s *Store) ListConnections() ([]model.ConnectionProfile, error) {
	rows, err := s.db.Query(`SELECT id, name, mode, addresses_json, sentinel_master, username, tls, timeout_seconds, tags_json, created_at, updated_at FROM connections ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var profiles []model.ConnectionProfile
	for rows.Next() {
		profile, err := scanPublicProfile(rows)
		if err != nil {
			return nil, err
		}
		profiles = append(profiles, profile)
	}
	return profiles, rows.Err()
}

func (s *Store) DeleteConnection(id string) error {
	_, err := s.db.Exec(`DELETE FROM connections WHERE id = ?`, id)
	return err
}

func (s *Store) DeleteReportsByConnection(connectionID string) error {
	_, err := s.db.Exec(`DELETE FROM reports WHERE connection_id = ?`, connectionID)
	return err
}

func (s *Store) GetConnection(id string) (model.ConnectionProfile, error) {
	row := s.db.QueryRow(`SELECT id, name, mode, addresses_json, sentinel_master, username, tls, timeout_seconds, tags_json, created_at, updated_at FROM connections WHERE id = ?`, id)
	profile, err := scanPublicProfile(row)
	if err != nil {
		return model.ConnectionProfile{}, err
	}
	cipherText, err := s.passwordCipher(id)
	if err != nil {
		return model.ConnectionProfile{}, err
	}
	password, err := s.decrypt(cipherText)
	if err != nil {
		return model.ConnectionProfile{}, err
	}
	profile.Password = password
	return profile, nil
}

func (s *Store) SaveReport(report model.AnalysisReport) error {
	if report.ID == "" {
		report.ID = fmt.Sprintf("report-%d", time.Now().UnixNano())
	}
	if report.GeneratedAt.IsZero() {
		report.GeneratedAt = time.Now()
	}
	body, err := json.Marshal(report)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`INSERT OR REPLACE INTO reports (id, connection_id, connection_name, mode, score, severity, finding_count, generated_at, report_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		report.ID, report.ConnectionID, report.Connection, report.Mode, report.Score, report.Severity, len(report.Findings), report.GeneratedAt.Format(time.RFC3339Nano), string(body))
	return err
}

func (s *Store) ListReports() ([]model.ReportSummary, error) {
	rows, err := s.db.Query(`SELECT id, connection_id, connection_name, mode, score, severity, finding_count, generated_at FROM reports ORDER BY generated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var summaries []model.ReportSummary
	for rows.Next() {
		var summary model.ReportSummary
		var generated string
		if err := rows.Scan(&summary.ID, &summary.ConnectionID, &summary.Connection, &summary.Mode, &summary.Score, &summary.Severity, &summary.FindingCount, &generated); err != nil {
			return nil, err
		}
		summary.GeneratedAt, _ = time.Parse(time.RFC3339Nano, generated)
		summaries = append(summaries, summary)
	}
	return summaries, rows.Err()
}

func (s *Store) GetReport(id string) (model.AnalysisReport, error) {
	var body string
	if err := s.db.QueryRow(`SELECT report_json FROM reports WHERE id = ?`, id).Scan(&body); err != nil {
		return model.AnalysisReport{}, err
	}
	var report model.AnalysisReport
	if err := json.Unmarshal([]byte(body), &report); err != nil {
		return model.AnalysisReport{}, err
	}
	return report, nil
}

func (s *Store) DebugRawConnectionRow(id string) (string, error) {
	var values []string
	row := s.db.QueryRow(`SELECT id, name, mode, addresses_json, username, password_cipher FROM connections WHERE id = ?`, id)
	var idValue, name, mode, addresses, username, password string
	if err := row.Scan(&idValue, &name, &mode, &addresses, &username, &password); err != nil {
		return "", err
	}
	values = append(values, idValue, name, mode, addresses, username, password)
	return strings.Join(values, "|"), nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanPublicProfile(row rowScanner) (model.ConnectionProfile, error) {
	var profile model.ConnectionProfile
	var addressesJSON, tagsJSON, created, updated string
	var tlsInt int
	if err := row.Scan(&profile.ID, &profile.Name, &profile.Mode, &addressesJSON, &profile.SentinelMaster, &profile.Username, &tlsInt, &profile.TimeoutSeconds, &tagsJSON, &created, &updated); err != nil {
		return model.ConnectionProfile{}, err
	}
	_ = json.Unmarshal([]byte(addressesJSON), &profile.Addresses)
	_ = json.Unmarshal([]byte(tagsJSON), &profile.Tags)
	profile.TLS = tlsInt == 1
	profile.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	profile.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
	return profile, nil
}

func (s *Store) passwordCipher(id string) (string, error) {
	var value string
	err := s.db.QueryRow(`SELECT password_cipher FROM connections WHERE id = ?`, id).Scan(&value)
	return value, err
}

func (s *Store) encrypt(plain string) (string, error) {
	if plain == "" {
		return "", nil
	}
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, []byte(plain), nil)
	return base64.StdEncoding.EncodeToString(sealed), nil
}

func (s *Store) decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(data) < gcm.NonceSize() {
		return "", errors.New("encrypted password is invalid")
	}
	nonce, cipherText := data[:gcm.NonceSize()], data[gcm.NonceSize():]
	plain, err := gcm.Open(nil, nonce, cipherText, nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func loadOrCreateKey(path string) ([]byte, error) {
	if data, err := os.ReadFile(path); err == nil && len(data) == 32 {
		return data, nil
	}
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, err
	}
	if err := os.WriteFile(path, key, 0o600); err != nil {
		return nil, err
	}
	return key, nil
}

func boolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
