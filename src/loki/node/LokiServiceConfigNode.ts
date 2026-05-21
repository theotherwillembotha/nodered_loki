
import { Node } from "node-red";
import { ConfigNode, ConfigNodeConfig, NodeDescription, SourceUtility } from "@theotherwillembotha/node-red-plugincore";

interface LokiServiceConfigNodeConfig extends ConfigNodeConfig {
    url: string;
    userid?: string;
    authtoken?: string;
    tenantid?: string;
}

@NodeDescription({
    id: "LokiServiceConfigNode",
    name: "Loki Service",
    group: "config",
    sourceFile: SourceUtility.getSourcePath("/build/", "/src/") + "LokiServiceConfigNode.html",
    package: "@theotherwillembotha/node-red-loki",
    tags: ["Loki"]
})
export class LokiServiceConfigNode extends ConfigNode<LokiServiceConfigNodeConfig> {

    constructor(node: Node, config: LokiServiceConfigNodeConfig) {
        super(node, config);
    }

    public url(): string {
        return this.config().url;
    }

    public basicAuth(): string | undefined {
        const { userid, authtoken } = this.config();
        return (userid && authtoken) ? `${userid}:${authtoken}` : undefined;
    }

    public tenantId(): string | undefined {
        return this.config().tenantid || undefined;
    }

    public headers(): Record<string, string> {
        const h: Record<string, string> = {};
        const auth = this.basicAuth();
        if (auth) {
            h['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64');
        }
        const tenant = this.tenantId();
        if (tenant) {
            h['X-Scope-OrgID'] = tenant;
        }
        return h;
    }
}
