export type ConnectionMode = 'standalone' | 'sentinel' | 'cluster';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ConnectionProfile {
  id: string;
  name: string;
  mode: ConnectionMode;
  addresses: string[];
  sentinelMaster?: string;
  username?: string;
  password?: string;
  tls: boolean;
  timeoutSeconds: number;
  tags?: string[];
}

export interface RiskFinding {
  severity: Severity;
  category: string;
  title: string;
  evidence: string;
  recommendation: string;
  node?: string;
}

export interface NodeSample {
  address: string;
  role: string;
  info?: Record<string, string>;
  error?: string;
}

export interface ClusterSample {
  state: string;
  knownNodes: number;
  slotsAssigned: number;
  slotsOk: number;
  slotsFail: number;
  error?: string;
}

export interface CommandStat {
  name: string;
  calls: number;
  usec: number;
  usecPerCall: number;
}

export interface BigKey {
  name: string;
  type: string;
  size: number;
  length: number;
  ttl: number;
}

export interface SlowLogEntry {
  id: number;
  durationMicros: number;
  command: string;
  at: number;
}

export interface AnalysisReport {
  id: string;
  connectionId: string;
  connection: string;
  mode: ConnectionMode;
  score: number;
  severity: Severity;
  generatedAt: string;
  summary: string;
  breakdown: Record<string, number>;
  metrics: Record<string, string>;
  findings: RiskFinding[];
  snapshot: {
    nodes: Array<NodeSample & { commandStats?: CommandStat[]; bigKeys?: BigKey[]; memoryStats?: Record<string, string>; clients?: Array<{ id: string; addr: string; name?: string; age?: string; flags?: string; command?: string }>; slowlogs?: Array<{ id: number; durationMicros: number; command: string; at: number }> }>;
    cluster?: ClusterSample;
  };
}

export interface ReportSummary {
  id: string;
  connectionId: string;
  connection: string;
  mode: ConnectionMode;
  score: number;
  severity: Severity;
  generatedAt: string;
  findingCount: number;
}
