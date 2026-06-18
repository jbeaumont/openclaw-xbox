export interface NotificationsConfig {
  /** Master switch — off by default. No background activity unless true. */
  enabled?: boolean;
  /** Poll interval in minutes (default 15, floored to 5 to respect the 150 req/hr cap). */
  intervalMinutes?: number;
  /** Alert when a friend transitions offline -> online. */
  friendOnline?: boolean;
  /** Alert when a new game clip is captured. */
  newClips?: boolean;
  /** Max alerts surfaced per day (default 10). */
  maxPerDay?: number;
}

export interface XboxPluginConfig {
  apiKey?: string;
  enableWriteTools?: boolean;
  notifications?: NotificationsConfig;
}

/**
 * Resolve the plugin config from the most reliable source available:
 * 1. `api.pluginConfig` — the SDK-resolved config for this plugin
 * 2. the nested `config.plugins.entries["openclaw-xbox"].config` path (older runtimes)
 * 3. environment variables (`OPENCLAW_XBOX_API_KEY`, `OPENCLAW_XBOX_ENABLE_WRITE_TOOLS`)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveConfig(api: any): XboxPluginConfig {
  const fromPlugin = (api?.pluginConfig as XboxPluginConfig | undefined) ?? undefined;
  const fromNested = api?.config?.plugins?.entries?.["openclaw-xbox"]?.config as
    | XboxPluginConfig
    | undefined;

  const apiKey =
    fromPlugin?.apiKey ??
    fromNested?.apiKey ??
    process.env.OPENCLAW_XBOX_API_KEY ??
    undefined;

  const enableWriteTools =
    fromPlugin?.enableWriteTools ??
    fromNested?.enableWriteTools ??
    process.env.OPENCLAW_XBOX_ENABLE_WRITE_TOOLS === "true";

  const notifications = fromPlugin?.notifications ?? fromNested?.notifications ?? undefined;

  return { apiKey, enableWriteTools, notifications };
}
