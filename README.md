# @theotherwillembotha/node-red-loki

Grafana Loki logger config node for Node-RED. Extends the logging infrastructure provided by [@theotherwillembotha/node-red-plugincore](https://github.com/theotherwillembotha/nodered_plugincore) with a Loki transport, so any node built with the `@Logger` decorator can ship structured log entries directly to a Loki instance.

---

## Usage in Node-RED

### Installation

Either use the **Manage Palette** option in the Node-RED editor, or run the following command in your Node-RED user directory (typically `~/.node-red`):

```bash
npm install @theotherwillembotha/node-red-loki
```

> [!IMPORTANT]
> **This plugin requires [`@theotherwillembotha/node-red-plugincore`](https://github.com/theotherwillembotha/nodered_plugincore) to be installed.**
>
> `node-red-plugincore` is declared as a dependency and npm will install it automatically alongside this package. However, due to a [known Node-RED limitation](https://github.com/node-red/node-red/issues/3529), packages that arrive as transitive npm dependencies are only discovered by the Node-RED runtime on the **next startup**.
>
> **You have two options:**
> - Install [`@theotherwillembotha/node-red-plugincore`](https://flows.nodered.org/node/@theotherwillembotha/node-red-plugincore) via the palette manager or `npm install` **first**, then install this plugin — both will be available immediately without a restart.
> - Install this plugin directly — `node-red-plugincore` will be installed automatically alongside it. **Restart Node-RED** once and both packages will be fully loaded.

### Config node

This package adds a single config node: **Loki Logger**.

The Loki Logger config node appears in the logger selector of any node that uses the `@Logger` decorator (e.g. the Logger Node from [node-red-telemetry](https://github.com/theotherwillembotha/nodered_telemetry), or any custom node built on this framework).

#### Configuration fields

| Field | Description |
|-------|-------------|
| **Name** | Optional label for this config node |
| **Host** | Hostname or IP address of your Loki instance (e.g. `loki` or `192.168.1.10`) |
| **Port** | Loki HTTP port (default: `3100`) |
| **Tenant ID** | Optional. Set the `X-Scope-OrgID` header for multi-tenant Loki deployments. Leave blank for single-tenant mode. |
| **Level** | Minimum log level to ship: Debug, Info, Warning, or Error |
| **Template** | Handlebars template that shapes each log entry. The default `message:{{msg}}` passes the raw message through. Customise to include only the fields you need (e.g. `{{msg.topic}}: {{msg.payload}}`). |

#### Example

A typical setup for a single-tenant Loki instance running on the same Docker network:

- **Host:** `loki`
- **Port:** `3100`
- **Tenant ID:** _(blank)_
- **Level:** `Info`
- **Template:** `message:{{msg}}`

For multi-tenant deployments, set the **Tenant ID** to match your Loki organisation ID. The value is sent as the `X-Scope-OrgID` HTTP header on every push request.

---

## Prerequisites

- Node.js 18+
- Node-RED 3+
- A running [Grafana Loki](https://grafana.com/oss/loki/) instance reachable from your Node-RED host

---

## Repository

- Source: [github.com/theotherwillembotha/nodered_loki](https://github.com/theotherwillembotha/nodered_loki)
- Issues: [github.com/theotherwillembotha/nodered_loki/issues](https://github.com/theotherwillembotha/nodered_loki/issues)

## License

[ISC](LICENSE)
