import { NodeGenerator } from "@theotherwillembotha/node-red-plugincore";
import { LokiLoggerConfigNode } from "./loki/node/LokiLoggerConfigNode";

new NodeGenerator("./src/loki/")
    .registerNode(LokiLoggerConfigNode)
    .generate("./build/Nodes", "./build/Plugins");

process.exit(0);
