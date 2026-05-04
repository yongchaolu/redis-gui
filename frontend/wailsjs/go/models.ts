export namespace model {
	
	export class SentinelSample {
	    masterName: string;
	    masterAddr: string;
	    replicas: string[];
	    sentinels: string[];
	
	    static createFrom(source: any = {}) {
	        return new SentinelSample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.masterName = source["masterName"];
	        this.masterAddr = source["masterAddr"];
	        this.replicas = source["replicas"];
	        this.sentinels = source["sentinels"];
	    }
	}
	export class ClusterSample {
	    state: string;
	    knownNodes: number;
	    slotsAssigned: number;
	    slotsOk: number;
	    slotsFail: number;
	    rawInfo?: string;
	    rawNodes?: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ClusterSample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.knownNodes = source["knownNodes"];
	        this.slotsAssigned = source["slotsAssigned"];
	        this.slotsOk = source["slotsOk"];
	        this.slotsFail = source["slotsFail"];
	        this.rawInfo = source["rawInfo"];
	        this.rawNodes = source["rawNodes"];
	        this.error = source["error"];
	    }
	}
	export class BigKey {
	    name: string;
	    type: string;
	    size: number;
	    length: number;
	    ttl: number;
	
	    static createFrom(source: any = {}) {
	        return new BigKey(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.size = source["size"];
	        this.length = source["length"];
	        this.ttl = source["ttl"];
	    }
	}
	export class CommandStat {
	    name: string;
	    calls: number;
	    usec: number;
	    usecPerCall: number;
	
	    static createFrom(source: any = {}) {
	        return new CommandStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.calls = source["calls"];
	        this.usec = source["usec"];
	        this.usecPerCall = source["usecPerCall"];
	    }
	}
	export class ClientInfo {
	    id: string;
	    addr: string;
	    name?: string;
	    age?: string;
	    flags?: string;
	    command?: string;
	
	    static createFrom(source: any = {}) {
	        return new ClientInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.addr = source["addr"];
	        this.name = source["name"];
	        this.age = source["age"];
	        this.flags = source["flags"];
	        this.command = source["command"];
	    }
	}
	export class LatencyEvent {
	    name: string;
	    latestMs: number;
	    maxMs: number;
	    lastUnixSec: number;
	
	    static createFrom(source: any = {}) {
	        return new LatencyEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.latestMs = source["latestMs"];
	        this.maxMs = source["maxMs"];
	        this.lastUnixSec = source["lastUnixSec"];
	    }
	}
	export class SlowLogEntry {
	    id: number;
	    durationMicros: number;
	    command: string;
	    at: number;
	
	    static createFrom(source: any = {}) {
	        return new SlowLogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.durationMicros = source["durationMicros"];
	        this.command = source["command"];
	        this.at = source["at"];
	    }
	}
	export class NodeSample {
	    address: string;
	    role: string;
	    info: Record<string, string>;
	    slowlogs: SlowLogEntry[];
	    latencyEvents: LatencyEvent[];
	    clients: ClientInfo[];
	    commandStats?: CommandStat[];
	    bigKeys?: BigKey[];
	    memoryStats?: Record<string, string>;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeSample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
	        this.role = source["role"];
	        this.info = source["info"];
	        this.slowlogs = this.convertValues(source["slowlogs"], SlowLogEntry);
	        this.latencyEvents = this.convertValues(source["latencyEvents"], LatencyEvent);
	        this.clients = this.convertValues(source["clients"], ClientInfo);
	        this.commandStats = this.convertValues(source["commandStats"], CommandStat);
	        this.bigKeys = this.convertValues(source["bigKeys"], BigKey);
	        this.memoryStats = source["memoryStats"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SampleSnapshot {
	    connectionId: string;
	    connection: string;
	    mode: string;
	    // Go type: time
	    sampledAt: any;
	    nodes: NodeSample[];
	    cluster?: ClusterSample;
	    sentinel?: SentinelSample;
	
	    static createFrom(source: any = {}) {
	        return new SampleSnapshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.connection = source["connection"];
	        this.mode = source["mode"];
	        this.sampledAt = this.convertValues(source["sampledAt"], null);
	        this.nodes = this.convertValues(source["nodes"], NodeSample);
	        this.cluster = this.convertValues(source["cluster"], ClusterSample);
	        this.sentinel = this.convertValues(source["sentinel"], SentinelSample);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RiskFinding {
	    severity: string;
	    category: string;
	    title: string;
	    evidence: string;
	    recommendation: string;
	    node?: string;
	
	    static createFrom(source: any = {}) {
	        return new RiskFinding(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.severity = source["severity"];
	        this.category = source["category"];
	        this.title = source["title"];
	        this.evidence = source["evidence"];
	        this.recommendation = source["recommendation"];
	        this.node = source["node"];
	    }
	}
	export class AnalysisReport {
	    id: string;
	    connectionId: string;
	    connection: string;
	    mode: string;
	    score: number;
	    severity: string;
	    // Go type: time
	    generatedAt: any;
	    summary: string;
	    breakdown: Record<string, number>;
	    metrics: Record<string, string>;
	    findings: RiskFinding[];
	    snapshot: SampleSnapshot;
	
	    static createFrom(source: any = {}) {
	        return new AnalysisReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.connectionId = source["connectionId"];
	        this.connection = source["connection"];
	        this.mode = source["mode"];
	        this.score = source["score"];
	        this.severity = source["severity"];
	        this.generatedAt = this.convertValues(source["generatedAt"], null);
	        this.summary = source["summary"];
	        this.breakdown = source["breakdown"];
	        this.metrics = source["metrics"];
	        this.findings = this.convertValues(source["findings"], RiskFinding);
	        this.snapshot = this.convertValues(source["snapshot"], SampleSnapshot);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class ConnectionProfile {
	    id: string;
	    name: string;
	    mode: string;
	    addresses: string[];
	    sentinelMaster?: string;
	    username?: string;
	    password?: string;
	    tls: boolean;
	    timeoutSeconds: number;
	    tags?: string[];
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.mode = source["mode"];
	        this.addresses = source["addresses"];
	        this.sentinelMaster = source["sentinelMaster"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.tls = source["tls"];
	        this.timeoutSeconds = source["timeoutSeconds"];
	        this.tags = source["tags"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ConnectionTestResult {
	    ok: boolean;
	    message: string;
	    mode: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionTestResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ok = source["ok"];
	        this.message = source["message"];
	        this.mode = source["mode"];
	    }
	}
	
	
	export class ReportSummary {
	    id: string;
	    connectionId: string;
	    connection: string;
	    mode: string;
	    score: number;
	    severity: string;
	    // Go type: time
	    generatedAt: any;
	    findingCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ReportSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.connectionId = source["connectionId"];
	        this.connection = source["connection"];
	        this.mode = source["mode"];
	        this.score = source["score"];
	        this.severity = source["severity"];
	        this.generatedAt = this.convertValues(source["generatedAt"], null);
	        this.findingCount = source["findingCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

