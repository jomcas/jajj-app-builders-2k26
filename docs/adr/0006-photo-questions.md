# Photo questions keep the emergency route and the gate, and the photo is read ahead

A hiker can attach a photo to a question in the Ask tab (Vision, #18). The checks from [ADR 0003](0003-emergencies-route-to-guides.md) and [ADR 0005](0005-assistant-stays-on-topic.md) still run, in the same order: the question text goes through emergency routing first, then the Feature Modules' tools, then the relevance gate. A photo question changes three things.

1. **The gate also lets through short questions about the photo.** Text that passes the gate is answered with its best passage, as usual. Text that fails the gate is still answered when it is a question about the photo itself: 12 words or fewer, with a word that points at it ("this", "it", "ito", "yan", "litrato" and so on), or no text at all. A photo taken on a hike counts as in scope. Other text that fails the gate gets the fixed off-topic reply, and the model doesn't run. The photo prompt is the second layer: it tells the model to reply NONE unless the photo shows something that matters on a hike (plants, animals, terrain, sky and weather, water, gear, the campsite). A NONE reply shows a fixed, translated reply.
2. **The model never gives first aid from a photo, and code checks its words.** The prompt forbids treatment steps and says to point to the Guides. It also forbids calling any wild plant, mushroom, berry or water safe to eat or drink. The emergency router also reads the model's answer as it streams, one finished sentence at a time, before showing it. If the answer turns to an emergency (bleeding, a bite, a fracture, lightning…), generation stops and the Emergency Guide card replaces the text.
3. **An emergency or a tool never waits for the model.** Those two stages need no model, so they run before the question joins the model's queue. They answer at once, even while a photo is still being read.

## How photos are made fast enough on the CPU

- The vision file is Qwen3.5-4B's mmproj in **Q8_0** (367 MB) instead of F16 (672 MB). Q8_0 reads a photo about 30% faster and uses about 300 MB less memory, with the same answers on the test photos.
- Each photo is capped at **256 image tokens** (`image_max_tokens`). llama.cpp scales a full-size camera photo down to fit, so a 12 MP photo costs about the same as a small one. At 128 tokens it was twice as fast, but answers lost detail.
- **The photo is read ahead.** When a photo is attached, the model reads it while the hiker types. llama.rn keeps a snapshot right after the photo, so after Send only the question's own text is evaluated. The first words come about 1–2 s after Send, instead of 15–25 s.
- The vision file is attached to the loaded chat model only when a photo is first picked (under 1 s, with no model reload). It is detached after 5 minutes without a photo question, which gives back about 360 MB.

## Consequences

- Do not let a photo skip the emergency route, and do not show model text about an emergency, even if the model gets better.
- Any change to the photo prompt, the token cap or the vision file must be re-run on the phone with the Vision bench (`tahak://assistant/vision-bench`). Keep a snake or wound photo with an emergency question (the card shows, `llm_ran=false`) and a non-outdoor photo (the fixed reply).
- The router reads only words. First-aid text that avoids every word in its lexicon could still reach the screen, so the prompt remains a real layer here.
