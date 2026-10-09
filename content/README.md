# Content

Reference passages the Assistant retrieves (RAG) for each Destination Pack. Facts and sources come from [docs/research/rag-sources.md](../docs/research/rag-sources.md).

```
content/destinations/<destination-slug>/
  SOURCES.md            attributions required by each source's license
  passages/NN-slug.md   one retrieval chunk per file
```

Destinations: `mt-batulao` (20 passages, the demo Destination), `mt-pulag` (20), `mt-ulap` (16).

Which ones have a full Destination Pack (Trail, Waypoints, map and seed):

| Destination | Pack content | Seed |
|---|---|---|
| Mt. Batulao | [`content/batulao/`](batulao/README.md) | `supabase/seed/seed-batulao.sh`. It still seeds the older 14 passage pairs in `content/batulao/passages.json`; moving it to these 20 is part of #14. |
| Mt. Ulap | [`content/ulap/`](ulap/README.md) | `supabase/seed/seed-ulap.sh`, which reads `mt-ulap/passages/` directly |
| Mt. Pulag | [`content/pulag/`](pulag/README.md) | `supabase/seed/seed-pulag.sh`, which reads `mt-pulag/passages/` directly |

## Passage format

YAML frontmatter, then `## English` and `## Filipino` sections with the same facts (60–150 words each; Mt. Pulag's are 40–90, like the Batulao seed's).

| Field | Meaning |
|---|---|
| `id` | `<destination>-NN-slug`, matches the filename |
| `destination` | Destination slug |
| `title_en`, `title_fil` | Titles |
| `questions` | Example hiker questions in English and Taglish (embed these with the text to improve retrieval) |
| `sources` | Source IDs from `rag-sources.md` |
| `related_guides` | Guide slugs the passage tells the hiker to open (see below) |
| `verify`, `verify_note` | `true` when a fact is time-sensitive or unconfirmed, with what to confirm |
| `as_of` | When the passage's newest dated fact was reported (`YYYY`, `YYYY-MM` or `YYYY-MM-DD`). Mt. Pulag only so far; the seed falls back to `last_checked`. |
| `last_checked` | Date the facts were last checked |

Passages never contain first-aid or treatment steps ([ADR 0003](../docs/adr/0003-emergencies-route-to-guides.md)). They name the Guide to open instead. The only emergency number given is 911 unless an official local number is sourced.

## Guide slugs

The Guide Library must use exactly these slugs, or `related_guides` links break.

| Slug | Guide | Emergency Guide |
|---|---|---|
| `snakebite` | Snakebite | yes |
| `insect-and-bee-stings` | Insect and bee stings | no |
| `leech-bites` | Leech bites | no |
| `sprains-and-fractures` | Sprains and fractures | yes |
| `bleeding-wounds` | Bleeding wounds | yes |
| `blisters` | Blisters | no |
| `hypothermia` | Hypothermia | yes |
| `heat-exhaustion-and-heatstroke` | Heat exhaustion and heatstroke | yes |
| `dehydration` | Dehydration | yes |
| `lost-on-the-trail` | Lost on the trail | yes |
| `lightning` | Lightning | yes |
| `flash-floods-and-river-crossings` | Flash floods and river crossings | yes |
| `altitude-sickness` | Altitude sickness | yes |
| `pitching-a-tent` | Pitching a tent | no |
| `purifying-water` | Purifying water | no |

## Before shipping

- Filipino text was drafted by AI and needs review by a native speaker.
- Every passage with `verify: true` must be confirmed, or kept worded as "reported by hikers; confirm at registration". Batulao has 14, Pulag 14, Ulap 9.
