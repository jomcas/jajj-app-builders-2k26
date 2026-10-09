# Guide Library content

The 15 Guides that ship inside the app (CONTEXT.md: **Guide Library**). One JSON file per Guide, named `<id>.json`. This folder holds data only; the Guides module's code reads it.

These Guides are the source of truth for first aid. The Assistant never writes its own first-aid steps; it opens the matching Guide and may quote its `summary` ([ADR 0003](../../../../../../docs/adr/0003-emergencies-route-to-guides.md)).

## Review status

**No Guide has been checked by a human against Philippine Red Cross material yet.** Every file has `review.redCrossChecked: false`. ADR 0003 and docs/plan.md require that check before shipping, and issue #11 closes only after it.

The drafts were written by an AI agent from the sources listed in each file. Very little PRC first-aid material is published online:

- `redcross.org.ph` has news advisories (heat, the 143 hotline) but no first-aid pages.
- The PRC *Community-Based Health and First Aid* flipchart (Manila, June 2011) is online and covers bleeding, fractures, dehydration and boiling water.
- The PRC Standard First Aid manual is not published online. The only copies are unofficial uploads that couldn't be read.

So most steps follow the **IFRC International First Aid, Resuscitation, and Education Guidelines 2020**, which national Red Cross societies use to write their own materials. Where IFRC is silent, the steps follow WHO, CDC, the US National Weather Service, park services and similar bodies. Each file's `review.notes` says which PRC material was compared, where sources disagree and which one was followed, and what the reviewer should check in the PRC manual.

To record a check, the reviewer sets `redCrossChecked: true` and `checkedBy` to their name, and adds what they compared to `notes`.

## Format

```jsonc
{
  "id": "snakebite",              // kebab-case, same as the file name
  "kind": "emergency",            // "emergency" | "ordinary", per CONTEXT.md
  "category": "injury",           // "injury" | "hazard" | "camp", per docs/plan.md's grouping
  "order": 1,                     // display order in the library, 1-15, unique
  "title":       { "en": "…", "fil": "…" },
  "summary":     { "en": "…", "fil": "…" },   // 1-2 sentences; cards and the Assistant's short summary
  "callForHelp": { "en": "…", "fil": "…" },   // when and how to get help; Emergency Guides always give 911
  "steps":    { "en": ["…"], "fil": ["…"] },  // 5-10 numbered, imperative steps
  "doNot":    { "en": ["…"], "fil": ["…"] },
  "watchFor": { "en": ["…"], "fil": ["…"] },  // danger signs
  "keywords": { "en": ["…"], "fil": ["…"] },  // for emergency routing (#15); fil includes Taglish
  "sources": [ { "title": "…", "org": "…", "url": "https://…", "accessed": "YYYY-MM-DD" } ],
  "review": { "redCrossChecked": false, "checkedBy": null, "notes": "PRC basis: …" }
}
```

Rules:

- In `steps`, `doNot` and `watchFor`, the `en` and `fil` lists have the same length and pair one to one. `keywords` do not pair.
- `doNot` and `watchFor` may be empty only in ordinary Guides. Every other field is non-empty.
- `review.notes` starts with `PRC basis: full.`, `partial.`, `hotline only.` or `none.`:
  - **partial**: some steps were compared against PRC material.
  - **hotline only**: the only PRC source cited is the one that confirms the 143 hotline.
  - **none**: no PRC source is cited, and the notes must say why ("No Philippine Red Cross …").
- The PH emergency number is **911** (Emergency 911 National Office, <https://en.wikipedia.org/wiki/911_(Philippines)>). The PRC 24/7 hotline **143** is confirmed by PRC's own advisory at <https://redcross.org.ph/?p=7916>.
- The Flare is described as "tap SOS at the top of the screen", matching the shell's SOS control label. CONTEXT.md says to avoid the term "SOS button".

| id | kind | category |
|---|---|---|
| snakebite | emergency | injury |
| insect-stings | ordinary | injury |
| leech-bites | ordinary | injury |
| sprains-fractures | emergency | injury |
| bleeding-wounds | emergency | injury |
| blisters | ordinary | injury |
| hypothermia | emergency | injury |
| heat-illness | emergency | injury |
| dehydration | emergency | injury |
| lost-on-the-trail | emergency | hazard |
| lightning | emergency | hazard |
| flash-floods | emergency | hazard |
| altitude-sickness | emergency | hazard |
| pitching-a-tent | ordinary | camp |
| purifying-water | ordinary | camp |

## Validate

```sh
python3 -I apps/mobile/src/modules/guides/content/validate.py            # all 15 must be present
python3 -I apps/mobile/src/modules/guides/content/validate.py --partial  # only the files present
```

Standard library only. It checks that every id is present, that kinds and categories match CONTEXT.md and docs/plan.md, `en`/`fil` parity, non-empty fields, the step count, summaries of at most 2 sentences, 911 in Emergency Guides, the source fields, and that each Guide has a Philippine Red Cross source or a note saying why not. It also prints how many Guides a human has checked.
