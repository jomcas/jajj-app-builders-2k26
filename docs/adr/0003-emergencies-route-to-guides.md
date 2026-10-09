# The Assistant never improvises emergency or medical advice

When a question is about an emergency or a medical situation, the Assistant opens the matching Guide from the Guide Library and adds at most a short summary of it. It does not produce its own first-aid steps. A small on-device model can hallucinate treatment advice, and that is the most harmful failure this app can have. Reviewed, static Guides are the source of truth for anything safety-critical. Do not "improve" this by letting the model answer freely, even if the model gets better.
