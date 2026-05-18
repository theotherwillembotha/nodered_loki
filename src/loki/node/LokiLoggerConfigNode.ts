
import { Node } from "node-red";
import { AbstractLogger, Log, BaseLoggerConfig, LoggerService, LoggerTemplateConfig, NodeDescription, LoggerConfigNode, LoggerConfigNodeConfig, Level } from "@theotherwillembotha/node-red-plugincore"
import { SourceUtility } from "@theotherwillembotha/node-red-plugincore";
import { createLogger, format, Logger } from "winston";
import LokiTransport from "winston-loki";

interface LokiLoggerConfigNodeConfig extends LoggerConfigNodeConfig {
    level: Level;
    template: string;

    loki_host: string;
    loki_userid?: string;
    loki_authtoken?: string;
    loki_tenantid?: string;
}

@NodeDescription({
    id: "LokiLoggerConfigNode",
    name: "Loki Logger",
    group: "config",
    sourceFile: SourceUtility.getSourcePath("/build/", "/src/") + "LokiLoggerConfigNode.html",
    package: "@theotherwillembotha/node-red-loki",
    dependencies: [LoggerService],
    tags: ["LoggerType"]
})
export class LokiLoggerConfigNode extends LoggerConfigNode<LokiLoggerConfigNodeConfig, LokiLogger> {

    private _logger!: LokiLogger;

    constructor(node: Node, config: LokiLoggerConfigNodeConfig) {
        super(node, config);

        const loggerConfig: any = {
            id: this.id(),
            type: "LOKI",
            template: config.template,
            level: config.level,
            host: config.loki_host,
            userid: config.loki_userid,
            authtoken: config.loki_authtoken,
            tenantid: config.loki_tenantid,
        };

        this._logger = new LokiLogger(loggerConfig);
    }

    protected logger(): LokiLogger {
        return this._logger;
    }
}


export interface LokiLoggerConfig extends BaseLoggerConfig {
    host: string;
    userid?: string;
    authtoken?: string;
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
            basicAuth: (config.userid && config.authtoken)
                ? `${config.userid}:${config.authtoken}`
                : undefined
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