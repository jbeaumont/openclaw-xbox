import { xblFetch, XblApiError } from "../client.js";
import { ClubSearchParamSchema, ClubIdParamSchema, ProductIdParamSchema } from "../types.js";
import { normalizeList, formatClubs } from "../format.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerClubTools(api, apiKey) {
    api.registerTool({
        name: "xbox_search_clubs",
        description: "Search Xbox Clubs by name or keyword. Returns matching clubs with member counts and club IDs.",
        parameters: ClubSearchParamSchema,
        async execute(_id, { query }) {
            const raw = await xblFetch(apiKey, `/clubs/find?q=${encodeURIComponent(query)}`);
            return toolResult(formatClubs(normalizeList(raw, "clubs", "results")));
        },
    });
    api.registerTool({
        name: "xbox_club_details",
        description: "Get details for a specific Xbox Club by its club ID — name, description, and membership.",
        parameters: ClubIdParamSchema,
        async execute(_id, { clubId }) {
            const data = await xblFetch(apiKey, `/clubs/${encodeURIComponent(clubId)}`);
            return toolResult(JSON.stringify(data, null, 2));
        },
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCatalogTools(api, apiKey) {
    api.registerTool({
        name: "xbox_game_details",
        description: "Resolve a marketplace product ID (Store ID, e.g. from the Game Pass catalog) to its title, description, and store details. Note: depends on xbl.io marketplace endpoints, which may not be available on all plans.",
        parameters: ProductIdParamSchema,
        async execute(_id, { productId }) {
            try {
                const data = await xblFetch(apiKey, `/marketplace/details/${encodeURIComponent(productId)}`);
                return toolResult(JSON.stringify(data, null, 2));
            }
            catch (err) {
                // xbl.io returns 404, or a 500 with a NOT_FOUND body, when a product ID
                // does not resolve. Game Pass catalog IDs are not always Store product
                // IDs, so this is an expected, non-fatal outcome.
                if (err instanceof XblApiError && (err.status === 404 || /not_?found/i.test(err.message))) {
                    return toolResult(`No marketplace details found for product ID ${productId}. Note: Game Pass catalog IDs are not always Store product IDs — this lookup needs a marketplace/Store product ID.`);
                }
                throw err;
            }
        },
    });
}
