import { xblFetch, XblApiError } from "../client.js";
import { ClubSearchParamSchema, ClubIdParamSchema, ProductIdParamSchema, Club } from "../types.js";
import { normalizeList, formatClubs } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerClubTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_search_clubs",
      description: "Search Xbox Clubs by name or keyword. Returns matching clubs with member counts and club IDs.",
      parameters: ClubSearchParamSchema,
      async execute(_id: string, { query }: { query: string }) {
        const raw = await xblFetch<unknown>(apiKey, `/clubs/find?q=${encodeURIComponent(query)}`);
        return toolResult(formatClubs(normalizeList<Club>(raw, "clubs", "results")));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_club_details",
      description: "Get details for a specific Xbox Club by its club ID — name, description, and membership.",
      parameters: ClubIdParamSchema,
      async execute(_id: string, { clubId }: { clubId: string }) {
        const data = await xblFetch<unknown>(apiKey, `/clubs/${encodeURIComponent(clubId)}`);
        return toolResult(JSON.stringify(data, null, 2));
      },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCatalogTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_game_details",
      description: "Resolve a marketplace product ID (Store ID, e.g. from the Game Pass catalog) to its title, description, and store details. Note: depends on xbl.io marketplace endpoints, which may not be available on all plans.",
      parameters: ProductIdParamSchema,
      async execute(_id: string, { productId }: { productId: string }) {
        try {
          const data = await xblFetch<unknown>(apiKey, `/marketplace/details/${encodeURIComponent(productId)}`);
          return toolResult(JSON.stringify(data, null, 2));
        } catch (err) {
          if (err instanceof XblApiError && err.status === 404) {
            return toolResult(
              `No marketplace details found for product ID ${productId}. The xbl.io marketplace endpoint may not be available on your plan.`
            );
          }
          throw err;
        }
      },
    }
  );
}
