package model

type ConnectionMode string

const (
	ConnectionModeStandalone ConnectionMode = "standalone"
	ConnectionModeSentinel   ConnectionMode = "sentinel"
	ConnectionModeCluster    ConnectionMode = "cluster"
)

type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

type ConnectionProfile struct {
	ID             string         `json:"id"`
	Name           string         `json:"name"`
	Mode           ConnectionMode `json:"mode"`
	Addresses      []string       `json:"addresses"`
	SentinelMaster   string         `json:"sentinelMaster,omitempty"`
	SentinelPassword string         `json:"sentinelPassword,omitempty"`
	Username         string         `json:"username,omitempty"`
	Password         string         `json:"password,omitempty"`
	DB               int            `json:"db"`
	TLS              bool           `json:"tls"`
	TLSCertFile      string         `json:"tlsCertFile,omitempty"`
	TLSKeyFile       string         `json:"tlsKeyFile,omitempty"`
	TLSCACertFile    string         `json:"tlsCACertFile,omitempty"`
	TLSSkipVerify    bool           `json:"tlsSkipVerify,omitempty"`
	TLSServerName    string         `json:"tlsServerName,omitempty"`
	TimeoutSeconds   int            `json:"timeoutSeconds"`
	Tags             []string       `json:"tags,omitempty"`
	CreatedAt      int64          `json:"createdAt"`
	UpdatedAt      int64          `json:"updatedAt"`
}

type ConnectionTestResult struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
	Mode    string `json:"mode"`
}

type SampleSnapshot struct {
	ConnectionID string          `json:"connectionId"`
	Connection   string          `json:"connection"`
	Mode         ConnectionMode  `json:"mode"`
	SampledAt    int64           `json:"sampledAt"`
	Nodes        []NodeSample    `json:"nodes"`
	Cluster      *ClusterSample  `json:"cluster,omitempty"`
	Sentinel     *SentinelSample `json:"sentinel,omitempty"`
}

type NodeSample struct {
	Address       string            `json:"address"`
	Role          string            `json:"role"`
	Info          map[string]string `json:"info"`
	Slowlogs      []SlowLogEntry    `json:"slowlogs"`
	LatencyEvents []LatencyEvent    `json:"latencyEvents"`
	Clients       []ClientInfo      `json:"clients"`
	CommandStats  []CommandStat     `json:"commandStats,omitempty"`
	BigKeys       []BigKey          `json:"bigKeys,omitempty"`
	MemoryStats   map[string]string `json:"memoryStats,omitempty"`
	Error         string            `json:"error,omitempty"`
}

type SlowLogEntry struct {
	ID             int64  `json:"id"`
	DurationMicros int64  `json:"durationMicros"`
	Command        string `json:"command"`
	At             int64  `json:"at"`
}

type LatencyEvent struct {
	Name        string `json:"name"`
	LatestMs    int64  `json:"latestMs"`
	MaxMs       int64  `json:"maxMs"`
	LastUnixSec int64  `json:"lastUnixSec"`
}

type ClientInfo struct {
	ID      string `json:"id"`
	Addr    string `json:"addr"`
	Name    string `json:"name,omitempty"`
	Age     string `json:"age,omitempty"`
	Flags   string `json:"flags,omitempty"`
	Command string `json:"command,omitempty"`
}

type CommandStat struct {
	Name        string `json:"name"`
	Calls       int64  `json:"calls"`
	Usec        int64  `json:"usec"`
	UsecPerCall int64  `json:"usecPerCall"`
}

type BigKey struct {
	Name   string `json:"name"`
	Type   string `json:"type"`
	Size   int64  `json:"size"`
	Length int64  `json:"length"`
	TTL    int64  `json:"ttl"`
}

type ClusterSample struct {
	State         string `json:"state"`
	KnownNodes    int    `json:"knownNodes"`
	SlotsAssigned int    `json:"slotsAssigned"`
	SlotsOK       int    `json:"slotsOk"`
	SlotsFail     int    `json:"slotsFail"`
	RawInfo       string `json:"rawInfo,omitempty"`
	RawNodes      string `json:"rawNodes,omitempty"`
	Error         string `json:"error,omitempty"`
}

type SentinelSample struct {
	MasterName string   `json:"masterName"`
	MasterAddr string   `json:"masterAddr"`
	Replicas   []string `json:"replicas"`
	Sentinels  []string `json:"sentinels"`
}

type AnalysisReport struct {
	ID           string            `json:"id"`
	ConnectionID string            `json:"connectionId"`
	Connection   string            `json:"connection"`
	Mode         ConnectionMode    `json:"mode"`
	Score        int               `json:"score"`
	Severity     Severity          `json:"severity"`
	GeneratedAt  int64             `json:"generatedAt"`
	Summary      string            `json:"summary"`
	Breakdown    map[string]int    `json:"breakdown"`
	Metrics      map[string]string `json:"metrics"`
	Findings     []RiskFinding     `json:"findings"`
	Snapshot     SampleSnapshot    `json:"snapshot"`
}

type RiskFinding struct {
	Severity       Severity `json:"severity"`
	Category       string   `json:"category"`
	Title          string   `json:"title"`
	Evidence       string   `json:"evidence"`
	Recommendation string   `json:"recommendation"`
	Node           string   `json:"node,omitempty"`
}

type ReportSummary struct {
	ID           string         `json:"id"`
	ConnectionID string         `json:"connectionId"`
	Connection   string         `json:"connection"`
	Mode         ConnectionMode `json:"mode"`
	Score        int            `json:"score"`
	Severity     Severity       `json:"severity"`
	GeneratedAt  int64          `json:"generatedAt"`
	FindingCount int            `json:"findingCount"`
}
