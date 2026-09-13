import { NodeGenerator, NodeTypeService } from "@theotherwillembotha/node-red-plugincore";
import { LokiService } from "./loki/service/LokiService";
import { LokiServiceConfigNode } from "./loki/node/LokiServiceConfigNode";
import { LokiLoggerConfigNode } from "./loki/node/LokiLoggerConfigNode";
import { LokiQueryNode } from "./loki/node/LokiQueryNode";

new NodeGenerator("./src/loki/")
    .registerService(NodeTypeService)
    .registerService(LokiService)
    .registerNode(LokiServiceConfigNode)
    .registerNode(LokiLoggerConfigNode)
    .registerNode(LokiQueryNode)
    .generate("./build/Nodes", "./build/Plugins", "@theotherwillembotha/node-red-loki");

process.exit(0);
