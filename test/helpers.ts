import { clearXblCache } from "../src/client.js";

const BASE_URL = "https://xbl.io/api/v2";

export interface RecordedCall {
  method: string;
  path: string;
  body: unknown;
}

export interface RouteResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

type RouteValue = unknown | RouteResponse | ((call: RecordedCall) => unknown | RouteResponse);

function isRouteResponse(v: unknown): v is RouteResponse {
  return !!v && typeof v === "object" && ("body" in (v as object) || "status" in (v as object) || "headers" in (v as object));
}

function makeResponse(value: unknown) {
  const resp: RouteResponse = isRouteResponse(value) ? value : { body: value };
  const status = resp.status ?? 200;
  const headers = resp.headers ?? {};
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? null },
    async json() {
      return resp.body;
    },
  };
}

/**
 * Replace global fetch with a router keyed by xbl.io path (the part after
 * `/api/v2`). Returns the recorded calls and a restore function. Clears the
 * client cache so each install starts clean.
 */
export function installFetch(routes: Record<string, RouteValue>) {
  clearXblCache();
  const calls: RecordedCall[] = [];
  const original = globalThis.fetch;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.fetch = (async (url: any, options: any = {}) => {
    const full = String(url);
    const path = full.startsWith(BASE_URL) ? full.slice(BASE_URL.length) : full;
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    const call: RecordedCall = { method, path, body };
    calls.push(call);

    // Exact match first, then prefix match (ignoring query string).
    const pathNoQuery = path.split("?")[0];
    let route = routes[path] ?? routes[pathNoQuery];
    if (route === undefined) {
      const key = Object.keys(routes).find((k) => pathNoQuery === k || pathNoQuery.startsWith(k));
      if (key) route = routes[key];
    }
    if (route === undefined) {
      return makeResponse({ status: 404, body: { message: `no route for ${path}` } });
    }
    const resolved = typeof route === "function" ? (route as (c: RecordedCall) => unknown)(call) : route;
    return makeResponse(resolved);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

export interface CapturedTool {
  name: string;
  description: string;
  parameters: unknown;
  ownerOnly?: boolean;
  execute: (id: string, params?: unknown) => Promise<{ content: { type: string; text: string }[] }>;
}

export interface FakeApi {
  tools: CapturedTool[];
  commands: { name: string; [k: string]: unknown }[];
  logs: { level: string; msg: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pluginConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
  registerTool: (tool: CapturedTool) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCommand: (cmd: any) => void;
  logger: { warn: (m: string) => void; info: (m: string) => void; error: (m: string) => void };
}

/** Build a fake plugin api that records tool/command registrations. */
export function makeApi(opts: { pluginConfig?: unknown; config?: unknown } = {}): FakeApi {
  const api: FakeApi = {
    tools: [],
    commands: [],
    logs: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pluginConfig: opts.pluginConfig as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: opts.config as any,
    registerTool(tool) {
      api.tools.push(tool);
    },
    registerCommand(cmd) {
      api.commands.push(cmd);
    },
    logger: {
      warn: (msg) => api.logs.push({ level: "warn", msg }),
      info: (msg) => api.logs.push({ level: "info", msg }),
      error: (msg) => api.logs.push({ level: "error", msg }),
    },
  };
  return api;
}

export function findTool(api: FakeApi, name: string): CapturedTool {
  const tool = api.tools.find((t) => t.name === name);
  if (!tool) throw new Error(`tool not registered: ${name}`);
  return tool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function textOf(result: any): string {
  return result?.content?.[0]?.text ?? "";
}
