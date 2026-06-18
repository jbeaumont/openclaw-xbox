/**
 * Resolve the plugin config from the most reliable source available:
 * 1. `api.pluginConfig` — the SDK-resolved config for this plugin
 * 2. the nested `config.plugins.entries["openclaw-xbox"].config` path (older runtimes)
 * 3. environment variables (`OPENCLAW_XBOX_API_KEY`, `OPENCLAW_XBOX_ENABLE_WRITE_TOOLS`)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveConfig(api) {
    const fromPlugin = api?.pluginConfig ?? undefined;
    const fromNested = api?.config?.plugins?.entries?.["openclaw-xbox"]?.config;
    const apiKey = fromPlugin?.apiKey ??
        fromNested?.apiKey ??
        process.env.OPENCLAW_XBOX_API_KEY ??
        undefined;
    const enableWriteTools = fromPlugin?.enableWriteTools ??
        fromNested?.enableWriteTools ??
        process.env.OPENCLAW_XBOX_ENABLE_WRITE_TOOLS === "true";
    const notifications = fromPlugin?.notifications ?? fromNested?.notifications ?? undefined;
    return { apiKey, enableWriteTools, notifications };
}
