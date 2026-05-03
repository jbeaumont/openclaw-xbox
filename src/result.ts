export function toolResult(text: string) {
  return { details: [] as unknown[], content: [{ type: "text" as const, text }] };
}
