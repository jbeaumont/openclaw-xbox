import { xblFetch, clearXblCache } from "../client.js";
import { FriendWriteParamSchema, SendMessageParamSchema } from "../types.js";
import { toolResult } from "../result.js";
const CONFIRM_HINT = "This is a state-changing action. Re-run with confirm=true once the user has explicitly approved it.";
/**
 * Register Xbox Live write/destructive tools. These are only registered when the
 * user opts in via `enableWriteTools`. Each tool is `ownerOnly` (only the
 * gateway owner may call it) and additionally requires an explicit `confirm`
 * flag so the agent cannot mutate state without a deliberate, confirmed step.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerWriteTools(api, apiKey) {
    api.registerTool({
        name: "xbox_add_friend",
        description: "Add a player to the authenticated user's Xbox friends list (by XUID). Requires confirm=true. Confirm with the user before calling.",
        parameters: FriendWriteParamSchema,
        ownerOnly: true,
        async execute(_id, { xuid, confirm }) {
            if (!confirm)
                return toolResult(`Not added — ${CONFIRM_HINT}`);
            await xblFetch(apiKey, `/friends/add/${encodeURIComponent(xuid)}`, { method: "POST" });
            clearXblCache();
            return toolResult(`Added player ${xuid} to your friends list.`);
        },
    });
    api.registerTool({
        name: "xbox_remove_friend",
        description: "Remove a player from the authenticated user's Xbox friends list (by XUID). Requires confirm=true. Confirm with the user before calling.",
        parameters: FriendWriteParamSchema,
        ownerOnly: true,
        async execute(_id, { xuid, confirm }) {
            if (!confirm)
                return toolResult(`Not removed — ${CONFIRM_HINT}`);
            await xblFetch(apiKey, `/friends/remove/${encodeURIComponent(xuid)}`, { method: "POST" });
            clearXblCache();
            return toolResult(`Removed player ${xuid} from your friends list.`);
        },
    });
    api.registerTool({
        name: "xbox_send_message",
        description: "Send an Xbox Live message to a player (by XUID). Requires confirm=true. Confirm the recipient and message content with the user before calling.",
        parameters: SendMessageParamSchema,
        ownerOnly: true,
        async execute(_id, { xuid, message, confirm }) {
            if (!confirm)
                return toolResult(`Not sent — ${CONFIRM_HINT}`);
            await xblFetch(apiKey, "/messages", {
                method: "POST",
                body: { xuids: [xuid], message },
            });
            return toolResult(`Message sent to ${xuid}.`);
        },
    });
}
