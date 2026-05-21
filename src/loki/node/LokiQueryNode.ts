
import axios from "axios";
import { Node } from "node-red";
import { BaseNode, BaseNodeConfig, NodeDescription, NodeManager, onInput, SourceUtility } from "@theotherwillembotha/node-red-plugincore";
import { Log, Logger, LoggerTemplate, LoggerTemplateConfig } from "@theotherwillembotha/node-red-plugincore";
import { LokiServiceConfigNode } from "./LokiServiceConfigNode";

const MAX_LOG_LINES    = 1000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Parses a time value into an RFC3339 string suitable for the Loki query_range API.
 *
 * Accepts:
 *  - Nanosecond epoch integer strings (e.g. "1700000000000000000")
 *  - Relative durations          (e.g. "1h", "30m", "7d", "2w")
 *  - RFC3339 / parseable dates   (e.g. "2024-01-01T00:00:00Z")
 */
function parseTime(value: string): string {
    if (/^\d{16,}$/.test(value)) {
        // Nanosecond epoch - convert to ms for Date
        return new Date(Number(BigInt(value) / 1000000n)).toISOString();
    }
    const durationMatch = value.match(/^(\d+)(ms|s|m|h|d|w)$/i);
    if (durationMatch) {
        const n = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        const msPerUnit: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
        return new Date(Date.now() - n * msPerUnit[unit]).toISOString();
    }
    return new Date(value).toISOString();
}

interface LokiQueryNodeConfig extends BaseNodeConfig, LoggerTemplateConfig {
    lokiservice: string;
    query: string;
    start: string;
    start_type: string;
    end: string;
    end_type: string;
    outputpath: string;
    batchMode: boolean;
}

@NodeDescription({
    id: "LokiQueryNode",
    name: "Loki Query",
    group: "loki",
    sourceFile: SourceUtility.getSourcePath("/build/", "/src/") + "LokiQueryNode.html",
    package: "@theotherwillembotha/node-red-loki",
    templates: [
        { template: LoggerTemplate, config: {} }
    ],
    dependencies: [LokiServiceConfigNode],
    tags: ["Loki"]
})
export class LokiQueryNode extends BaseNode<LokiQueryNodeConfig> {

    @Logger()
    private log!: Log;

    private _serviceNode!: LokiServiceConfigNode;

    constructor(node: Node, config: LokiQueryNodeConfig) {
        super(node, config);
        this._serviceNode = (NodeManager.RED.nodes.getNode(config.lokiservice) as any).node() as LokiServiceConfigNode;
    }

    @onInput()
    protected async onInput(message: any, _errorHandler: Function) {
        const query    = message.query ?? this.config().query;
        const startRaw = message.start ?? this.config().start;
        const endRaw   = message.end   ?? this.config().end;
        const endType  = message.end   ? undefined : this.config().end_type;

        const start = parseTime(startRaw);
        const end   = (endType === "now" || (!endRaw && !message.end)) ? new Date().toISOString() : parseTime(endRaw);
        const outputpath = this.config().outputpath || "payload";
        const batchMode  = this.config().batchMode === true;

        const url = this._serviceNode.url().replace(/\/$/, "") + "/loki/api/v1/query_range";

        try {
            const response = await axios.get(url, {
                headers: this._serviceNode.headers(),
                params: { query, start, end, limit: MAX_LOG_LINES },
                maxContentLength: MAX_RESPONSE_BYTES,
                maxBodyLength: MAX_RESPONSE_BYTES,
            });

            const streams: any[] = response.data?.data?.result ?? [];

            if (batchMode) {
                const results: any[] = [];
                for (const stream of streams) {
                    const labels = stream.stream ?? {};
                    for (const [ts_ns, line] of (stream.values ?? [])) {
                        results.push({
                            timestamp: new Date(Number(BigInt(ts_ns) / 1000000n)).toISOString(),
                            line,
                            labels,
                        });
                    }
                }
                const out = { ...message };
                out[outputpath] = results;
                this.node().send(out);
            } else {
                for (const stream of streams) {
                    const labels = stream.stream ?? {};
                    for (const [ts_ns, line] of (stream.values ?? [])) {
                        const out = { ...message };
                        out[outputpath] = {
                            timestamp: new Date(Number(BigInt(ts_ns) / 1000000n)).toISOString(),
                            line,
                            labels,
                        };
                        this.node().send(out);
                    }
                }
            }
        }
        catch(e) {
            _errorHandler(e);
        }
    }
}
