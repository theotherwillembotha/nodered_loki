import {
    NodeGenerator,
    BasicTemplate, SettingsTemplate,
    LoggerService, LoggerTemplate,
    DelegatedConfigReferenceNode, ConsoleLoggerConfigNode, RestLoggerConfigNode,
    SettingsService,
    NodeTypeService,
} from "@theotherwillembotha/node-red-plugincore";
import { LokiService } from "./loki/service/LokiService";
import { LokiServiceConfigNode } from "./loki/node/LokiServiceConfigNode";
import { LokiLoggerConfigNode } from "./loki/node/LokiLoggerConfigNode";
import { LokiQueryNode } from "./loki/node/LokiQueryNode";

new NodeGenerator("./src/loki/")
    // plugincore services bundled inline — deduplicated at runtime via RED.plugins.get()
    .registerService(LoggerService)
    .registerService(SettingsService)
    .registerService(NodeTypeService)
    // templates are build-time only — used by buildNode() during generate, not registered at runtime
    .registerTemplate(BasicTemplate)
    .registerTemplate(SettingsTemplate)
    .registerTemplate(LoggerTemplate)
    // plugincore logger infrastructure nodes — registered here so loki works standalone.
    // Server-side: global guard in NodeManagerRuntime prevents double-registration.
    // Client-side: registry:node-set-added deferred pattern in Plugins.html is idempotent.
    .registerNode(DelegatedConfigReferenceNode)
    .registerNode(ConsoleLoggerConfigNode)
    .registerNode(RestLoggerConfigNode)
    // loki-owned nodes
    .registerService(LokiService)
    .registerNode(LokiServiceConfigNode)
    .registerNode(LokiLoggerConfigNode)
    .registerNode(LokiQueryNode)
    .generate("./build/Nodes", "./build/Plugins");

process.exit(0);
