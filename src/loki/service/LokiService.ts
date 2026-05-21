
import axios from "axios";
import { NodeAPI, NodeAPISettingsWithData } from "node-red";
import { BaseService, FlowDeployment, ServiceDescriptor } from "@theotherwillembotha/node-red-plugincore";

export class LokiService extends BaseService {

    private red!: NodeAPI<NodeAPISettingsWithData>;

    constructor() {
        super("LokiService");
    }

    public init(red: NodeAPI<NodeAPISettingsWithData>): void {
        this.red = red;

        this.red.httpAdmin.post("/lokiservice/testconnection", this.red.auth.needsPermission("inject.write"), async (request, response) => {
            const { url, userid, authtoken, tenantid } = request.body;
            try {
                const headers: Record<string, string> = {};
                if (userid && authtoken) {
                    headers['Authorization'] = 'Basic ' + Buffer.from(`${userid}:${authtoken}`).toString('base64');
                }
                if (tenantid) {
                    headers['X-Scope-OrgID'] = tenantid;
                }
                await axios.get(url.replace(/\/$/, '') + '/loki/api/v1/labels', {
                    headers,
                    timeout: 5000,
                });
                response.json({ success: true });
            }
            catch(e: any) {
                const message = e.response?.data?.message ?? e.response?.data ?? e.message;
                response.json({ success: false, error: String(message) });
            }
        });
    }

    public deinit(_red: NodeAPI<NodeAPISettingsWithData>): void {}

    public async onDeploy(_flowDeployment: FlowDeployment): Promise<void> {}

    static override getServiceDescriptor(): ServiceDescriptor {
        return new ServiceDescriptor(
            "@theotherwillembotha/lokiservice",
            "LokiService",
            "services-plugin",
            "@theotherwillembotha/node-red-loki",
            LokiService,
            []
        );
    }
}
