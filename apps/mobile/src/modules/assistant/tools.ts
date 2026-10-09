// Assistant tools (ADR 0001): Feature Modules list them in their `tools`; the Assistant
// collects them from the registry and calls one when a question asks for it.
//
// How a tool gets picked: each tool's own `match`, a deterministic intent match in en, fil
// and Taglish, runs right after emergency routing and before the relevance gate. It takes
// well under a millisecond. llama.rn's tool calling (Qwen's chat template supports it) was
// not used: on the phone's CPU the 4B model would first have to read every tool's schema and
// then generate a call, adding seconds to every question, and could still invent arguments
// or a distance. Same reasoning as ADR 0005's rejected yes/no call. The answer is always the
// tool's own fixed, translated text, never model output.
//
// Pure (type-only imports), tested under plain Node.

import type { AssistantTool, FeatureModule } from '../types';

/** Every module's tools, in registry order. Tool ids must be unique. */
export function collectTools(modules: readonly Pick<FeatureModule, 'id' | 'tools'>[]): AssistantTool[] {
  const tools: AssistantTool[] = [];
  const ids = new Set<string>();
  for (const module of modules) {
    for (const tool of module.tools ?? []) {
      if (ids.has(tool.id)) throw new Error(`Two Assistant tools use the id "${tool.id}".`);
      ids.add(tool.id);
      tools.push(tool);
    }
  }
  return tools;
}

export type ToolCall = { tool: AssistantTool; args: Record<string, unknown> };

/** The first tool whose intent matches the question, with its arguments, or null. */
export function matchTool(tools: readonly AssistantTool[], question: string): ToolCall | null {
  for (const tool of tools) {
    const args = tool.match(question);
    if (args) return { tool, args };
  }
  return null;
}
