# The Assistant stays on topic, and code enforces it

The Assistant answers only questions about the outdoors and Tahak:
- hiking and camping;
- outdoor first aid;
- gear;
- weather on the trail;
- the active Destination, its Trails and Waypoints;
- food for the trail;
- getting to and from the jump-off;
- local culture around a Destination;
- how to use the app.

Everything else gets a fixed, translated reply saying what the Assistant can help with. In the Wave 0 spike, Qwen3.5-4B happily answered unrelated questions. A 4B model doesn't reliably obey "only talk about hiking" in a prompt, so the prompt alone can't hold that line.

The check runs in code before the model does, using the retrieval the Assistant already needs. If a question isn't an emergency (see [ADR 0003](0003-emergencies-route-to-guides.md)), its closest passages are found. These come from the Destination Pack, the Guide Library, and a small set of passages about app help and the in-scope topics. If even the best match falls below a tuned similarity threshold, the fixed reply is shown and the model doesn't run at all. Questions that pass are answered from the retrieved passages under a scope-restricted system prompt. The prompt is the second layer, not the only one.

## Consequences

- Order of checks: emergency routing first, then the relevance gate, then a grounded answer.
- The search corpus includes short app-help and topic passages, so in-scope questions about the app, trail food, transport or local culture can pass the gate even when no Destination Pack covers them.
- An answer that uses no retrieved passage, and so shows no source chips, counts as off-topic.
- Answer length is capped.
- A fixed set of in-scope and out-of-scope test questions in English, Filipino and Taglish runs through the adb benchmark hook. The threshold is tuned against it, and any change to the gate, prompt or model must keep it passing.
- An extra yes/no call to the model, asking whether the question is on topic, is rejected. On the CPU it would add seconds to every question, and the embedding gate does the same job in milliseconds.
- Do not loosen the gate to let the model "just answer" general questions, even if a later model obeys the prompt better.
