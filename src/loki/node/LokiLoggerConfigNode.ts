
import { Node } from "node-red";
import { AbstractLogger, Log, BaseLoggerConfig, LoggerService, LoggerTemplateConfig, NodeDescription, LoggerConfigNode, LoggerConfigNodeConfig, Level, NodeManager } from "@theotherwillembotha/node-red-plugincore"
import { SourceUtility } from "@theotherwillembotha/node-red-plugincore";
import { createLogger, format, Logger } from "winston";
import LokiTransport from "winston-loki";
import { LokiServiceConfigNode } from "./LokiServiceConfigNode";

interface LokiLoggerConfigNodeConfig extends LoggerConfigNodeConfig {
    level: Level;
    template: string;
    lokiservice: string;
}

@NodeDescription({
    id: "LokiLoggerConfigNode",
    name: "Loki Logger",
    group: "config",
    sourceFile: SourceUtility.getSourcePath("/build/", "/src/") + "LokiLoggerConfigNode.html",
    package: "@theotherwillembotha/node-red-loki",
    dependencies: [LoggerService, LokiServiceConfigNode],
    tags: ["LoggerType"]
})
export class LokiLoggerConfigNode extends LoggerConfigNode<LokiLoggerConfigNodeConfig, LokiLogger> {

    private _logger!: LokiLogger;

    constructor(node: Node, config: LokiLoggerConfigNodeConfig) {
        super(node, config);

        const serviceNode = (NodeManager.RED.nodes.getNode(config.lokiservice) as any).node() as LokiServiceConfigNode;

        const loggerConfig: any = {
            id: this.id(),
            type: "LOKI",
            template: config.template,
            level: config.level,
            host: serviceNode.url(),
            basicAuth: serviceNode.basicAuth(),
            tenantid: serviceNode.tenantId(),
        };

        this._logger = new LokiLogger(loggerConfig);
    }

    protected logger(): LokiLogger {
        return this._logger;
    }
}


export interface LokiLoggerConfig extends BaseLoggerConfig {
    host: string;
    basicAuth?: string;
    tenantid?: string;
}


function toWinstonLevel(level: string): string {
    const l = level.toLowerCase();
    return l === 'warning' ? 'warn' : l;
}

class LokiLogger extends AbstractLogger<LokiLoggerConfig> {

    private winston: Logger;
    private winstonLevel: string;

    constructor(config: LokiLoggerConfig) {
        super(config);

        this.winstonLevel = toWinstonLevel(config.level);

        const transportConfig = {
            headers:{},
            host: config.host,
            json: true,
            format: format.json(),
            replaceTimestamp: true,
            onConnectionError: (err: unknown) => console.error(`[LokiLogger] connection error (host: ${config.host}):`, err),
            basicAuth: config.basicAuth,
        };
        if(config.tenantid){
            (transportConfig.headers as any)["X-Scope-OrgID"] = config.tenantid;
        }

        this.winston = createLogger({
            level: this.winstonLevel,
            format: format.json(),
            defaultMeta: {},
            transports: [
                new LokiTransport(transportConfig),
            ],
        });
    }

    protected createLogger(config: LoggerTemplateConfig): Log {
        return new LokiAppender(config, this.winston, this.winstonLevel);
    }
}

class LokiAppender extends Log {

    private winston: Logger;
    private level: string;

    constructor(config: LoggerTemplateConfig, winston: Logger, level: string) {
        super(config);
        this.winston = winston;
        this.level = level;
    }

    protected writeToLog(_level: string, message: string, tags: { [key: string]: string | boolean | number; }): void {
        this.winston.log({
            level: this.level.toLowerCase(),
            message: message,
            labels: tags
        });
    }
}