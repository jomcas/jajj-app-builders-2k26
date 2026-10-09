# RAG source research: Mt. Batulao, Mt. Pulag, Mt. Ulap and safety Guides

Researched 2026-10-10 (web, read-only). Pulag and Ulap deepened the same day; their passage drafts live in `content/destinations/mt-pulag/` and `content/destinations/mt-ulap/`. Vocabulary follows [CONTEXT.md](../../CONTEXT.md): Destination, Trail, Waypoint, Destination Pack, Guide, Emergency Guide, Assistant.

**Rules for using this file**
- Nothing here may be copied verbatim into the app. Every RAG passage must be written fresh by the team, in their own words, citing the source IDs below. Most sources are "all rights reserved"; see [Section 7](#7-licensing-notes).
- **(verify)** / **verify before demo** marks fees, rules, closures and phone numbers. These change often and most were found only on secondary sources.
- "Primary" means the body that owns the fact (law, LGU, DENR, PAGASA, IFRC, CDC, OSM for map geometry). "Secondary" means a blog, news report or Wikipedia.
- Sites that blocked fetches (HTTP 403) during research: nasugbu.gov.ph, bmb.gov.ph, bghmc.doh.gov.ph, doh.gov.ph, ndrrmc.gov.ph, officialgazette.gov.ph, lnt.org (HTML pages), Senate LDR, UNESCO, SummitPost, fs.usda.gov. Facebook pages (Mt. Pulag PAMO, Mt. Ulap Eco-Trail, Ampucao barangay) could not be read. car.denr.gov.ph blocks the fetch tool but opens with a normal browser user agent; its Pulag news was read that way. kabayan.gov.ph, bokod.gov.ph, kayapa.gov.ph and benguet.gov.ph did not resolve. The team may be able to open the others in a normal browser.

## 1. Summary

**What was found**
- **Mt. Batulao:** OpenStreetMap is the strongest source. It has both Trails (Old Trail, New Trail), Camps 1–9 and Peaks 1–11 with elevations, the summit (811 m), the trailhead, parking, a hiking route relation, and nearby hospitals and police. Trail facts (durations, rope section, water, rules) are well covered by secondary sources (Pinoy Mountaineer 2007–2017, trip reports 2022–2026). **No official LGU, provincial or DENR page for Batulao was found or readable.** Batulao is not a legislated protected area, so no PAMB rules apply.
- **Mt. Pulag:** RA 11685 (2022) and DENR-CAR news releases from 2025 are primary sources for name, management, PAMO location (Ambangeg, Bokod), PASu and elevation (2,922 m). All four Trails (Ambangeg, Akiki, Tawangan, Ambaguio) are described from Pinoy Mountaineer, Lakwatsero and other trip reports, and OSM maps them with camps, springs, toilets, the ranger station and route relations. Current fees, caps and the weekend camping rule come only from a low-trust 2026 blog.
- **Mt. Ulap:** itogon.gov.ph is a readable primary source with official MDRRMO numbers and 2026 closure and reopening orders. The full 2026 status timeline is documented: the latest provincial suspension was lifted on 14 Sep 2026 and the Eco-Trail resumed on 16 Sep. The Ampucao–Sta. Fe traverse is described Waypoint by Waypoint from 2020–2026 trip reports; fees conflict. OSM maps the Eco Trail, peaks, both campsites and the barangay hall, plus nearby hospitals.
- **Guides:** The IFRC 2020 International First Aid Guidelines (the federation the Philippine Red Cross belongs to) cover 11 of the 15 Guides and allow non-commercial copying with credit. CDC Yellow Book, CDC lightning, WHO boil-water and US NWS flood pages fill the gaps and are public domain or reusable with credit. PAGASA pages give official Tropical Cyclone Wind Signals and the thunderstorm and rainfall warning terms. EO 56 (2018) confirms 911.

**Biggest gaps**
1. **No official Batulao rules.** Fees, guide requirement, curfew and closures exist only in blogs, and they conflict. The guide requirement has been disputed since 2015 (the LGU said "not required"; the trailhead enforced it anyway).
2. **No official Nasugbu emergency numbers** (MDRRMO, PNP, hospital). The only MDRRMO/PNP numbers found are on a low-trust 2026 blog. Call to confirm, or ship 911 only.
3. **No readable DOH page** on snakebite, venomous species or antivenom stock. The only antivenom facts are from UP Manila and news: RITM makes antivenom only for the Philippine cobra.
4. **No official current Pulag fees, visitor cap or camping rules.** The 2026 figures are from a low-trust blog. Campsites 1 and 2 were closed in Feb 2025 and no official reopening was found (a 2026 blog implies weekday camping again). The ranger station name (Babadak / Badabak / Babalak) is unresolved. No Kabayan or Bokod MDRRMO number was found.
5. **No official Ulap fee ordinance or rules page.** Ulap fees, guide rates, registration hours and caps conflict across 2020–2026 blogs.
6. **No primary source for leech bites or tent pitching.** The PRC website has course listings but no public first-aid text.

**Top 5 sources to use first**
1. **OpenStreetMap / Overpass** (ODbL): Batulao Trails, Camps, Peaks, trailhead, hospitals. Route relation 3350629. → Trails and Waypoints for the pack.
2. **Pinoy Mountaineer, Mt. Batulao (811+)**, https://www.pinoymountaineer.com/?p=1342: the most complete Batulao trail description (paraphrase only).
3. **IFRC International First Aid, Resuscitation and Education Guidelines 2020**, https://www.ifrc.org/sites/default/files/2022-02/EN_GFARC_GUIDELINES_2020.pdf: the base for the Emergency Guides.
4. **PAGASA** Tropical Cyclone Wind Signals and weather legend (thunderstorm and rainfall warnings) plus the climate page: weather passages for every Destination.
5. **CDC Yellow Book 2026** (heat and cold illness, altitude, water disinfection) and **CDC lightning safety**: public-domain backup for the Guides.

### Elevation conflicts at a glance

| Destination | Figures (source) | Suggested display |
|---|---|---|
| Mt. Batulao | 811 m (Wikipedia infobox citing PHIVOLCS; OSM; Pinoy Mountaineer) · 693 m (Wikipedia body) · 813 m (Mountain-Forecast) · ~1,050 m (waypoints.ph, hearsay) | "about 811 m" |
| Mt. Pulag | **2,922 m (DENR-CAR, Apr 2025 — the park's owner)**; Pinoy Mountaineer; Inquirer · 2,926 m (Wikipedia list; LakbayPinas) · 2,928 m (Wikipedia infobox citing PHIVOLCS; OSM) | "2,922 m" per DENR-CAR, noting others give up to 2,928 m |
| Mt. Ulap | 1,846 m (Pinoy Mountaineer, "official") · 1,856 m (same author's GPS) · 1,845 m and 1,843 m (two OSM nodes) | "about 1,846 m" |

### Other conflicts at a glance

| Topic | Conflicting values (source) | How passages handle it |
|---|---|---|
| Batulao guide requirement | Not required (Nasugbu Tourism OIC, 2015, B11) · enforced at trailhead (2015–2022 blogs) · mandatory (LakbayPinas 2026, B6) | Say guides are usually required at registration; confirm there |
| Batulao fees | ₱140 + ₱20–60 further up (2022–2026 blogs) · ₱20–30 per camp (2013–2017) | Give range, "verify" |
| Pulag ranger station name | Babadak (OSM, Gurupress, LakbayPinas) · Badabak (Pinoy Mountaineer) · Babalak (OSM trailhead; GMA place name) | "Ranger station in Bashoy, Kabayan"; mention spellings |
| Pulag visitor cap | 120 at a time (DENR RD 2013) · groups ≤20 (2016) · groups ≤10 (low-trust blog) · 500/day (low-trust blog 2026) | Say the PAMO sets a daily limit; confirm when booking |
| Pulag fees | ₱225 (≤2015) · ₱175 entrance (2016) · ₱250 weekday / ₱350 weekend env. fee (blog 2026) | Give 2026 blog range, "verify" |
| Pulag Ambangeg distance | ~8 km one way (PM) · ~7.1 km (OSM segments) · ~17.9 km round trip (blog) | "about 7–8 km one way" |
| Ulap distance | ~8 km (PM) · ~8.5 km (2022) · 9.4 km (2025–2026 blogs) | "about 8–9.5 km" |
| Ulap camping fee | ₱800/site + ₱100/person (2022) · ₱800/group + ₱200 (Jan 2025) · ₱200/group (2026) | "verify at registration" |
| Ulap registration hours | 5 AM–noon day hikes (2022) · from 4 AM weekends / 5 AM weekdays, no cut-off (2026) | "register early; confirm cut-off" |
| Rainy season | June–November (PAGASA) · June–October (blogs) | Use PAGASA |

## 2. Mt. Batulao (Destination 1, priority)

**Bottom line:** No official (LGU, DENR, provincial) web page for Mt. Batulao could be reached or found. Batulao is **not** a NIPAS protected area, so there is no PAMB or DENR visitor rule set; trail rules are set on the ground by Barangay Kaylaway/Calayway (Nasugbu) and the Nasugbu Municipal Tourism Office, and published (if at all) on Facebook, which was not readable from here. Every rule, fee and phone number below therefore comes from secondary sources and must be **verified before demo**. The strongest data source is **OpenStreetMap**, which has both named Trails, numbered camps and peaks with elevations, and a hiking route relation.

### 2.1 Facts table

| Fact | Value | Source |
|---|---|---|
| Name | Mount Batulao (Mt. Batulao) | Wikipedia [B1]; OSM node 332020556 [B2] |
| Location | Mostly in Nasugbu, Batangas, at the SW end of the Tagaytay Ridge near the Cavite border. Slopes also touch Tuy, Balayan, Calaca, Lemery (Batangas) and Alfonso (Cavite). Nasugbu barangays on the mountain: Aga and Calayway (Kaylaway). | Wikipedia [B1] |
| Barangay of the jump-off | Kaylaway (Calayway). OSM puts "Batulao Jumpoff" (trailhead) at 14.05548, 120.82057, near Kaylaway II Elementary School, and the village "Kaylaway" just north. **No official source names the jump-off barangay**; treat as inferred from OSM. | OSM [B2] |
| Summit coordinates | 14.0399 N, 120.8024 E (OSM peak node); 14.0408 N, 120.8011 E (Pinoy Mountaineer); 14.0450 N, 120.8044 E (Wikipedia infobox) | [B2], [B3], [B1] |
| **Elevation (conflict)** | **811 m**: Wikipedia infobox (cites PHIVOLCS), OSM `ele=811` (source GNS), Pinoy Mountaineer "811+ MASL". **693 m**: Wikipedia body text (unreconciled with its own infobox; likely a lower peak). **813 m**: Mountain-Forecast. **~1,050 m**: waypoints.ph (author says he was told this, unconfirmed). Use **811 m** and say "about 811 m". PHIVOLCS page cited by Wikipedia could not be reached to confirm. | [B1], [B2], [B3], [B9], [B8] |
| Altitude gain | Under 300 m from jump-off to summit (despite many ups and downs) | Pinoy Mountaineer [B3]; Hike To Mountains (quoting a local guide) [B7] |
| Geology | Inactive (dormant) andesitic stratovolcano on the NW rim of the Taal volcanic field; PHIVOLCS lists it among inactive volcanoes (per Wikipedia) | [B1] |
| Difficulty | **No official rating.** Pinoy Mountaineer: minor climb, difficulty 4/9, trail class 3 (60–70° assault). Widely repeated by other blogs. | [B3] |
| Trails | **Old Trail (East)** and **New Trail (West)**; they split at a fork about 35–40 min from the jump-off (Old on the left, New on the right). Common plan: traverse (up one, down the other). Blogs disagree on direction: Hike To Mountains and A Wanderful Sole went up Old/down New; LakbayPinas recommends up New/down Old. OSM also has a "Shortcut", a "Summit Trail", a "Batulao Tuy Trail" from a separate Tuy jump-off (trail_visibility=bad), and traverse paths "Batulao to Toong" and "Toong to Talamitam". | [B3], [B7], [B6], [B5], [B2] |
| Length | OSM hiking relation "Mt. Batulao New to Old Trail" measures about **7.2 km** (computed from OSM geometry, includes ~2.3 km of access road). Blogs claim "12 km" total. | [B2] (computed here), [B6], [B7] |
| Duration | 2–4 h up, 1–2 h down (Pinoy Mountaineer); 2–3 h up, 1–2 h down (Transit Pinas); 4–6 h total (LakbayPinas); up to 7 h round trip (Hike To Mountains, waypoints.ph). Fork to summit: Old Trail 1.5–2 h, New Trail 1–1.5 h (Pinoy Mountaineer). | [B3], [B4], [B6], [B7], [B8] |
| Waypoints: camps (Old Trail) | OSM camp_site nodes **Camp 1** (576 m) through **Camp 9** (786 m), clustered around 14.041–14.044 N, 120.803–120.807 E. Pinoy Mountaineer: campsites numbered 1–10 on the Old Trail, steep at 8–10. Wikipedia: at least ten designated campsites. | [B2], [B3], [B1] |
| Waypoints: peaks (New Trail) | OSM nodes **Peak 1** (645 m) to **Peak 11** (761 m), mapped as camp_site, along the New Trail ridge. Blogs speak of 12 peaks, Peak 12 being the summit. "Peak of Deception" is an optional side peak on the New Trail. | [B2], [B6], [B3], [B1] |
| Rope section | Fixed rope on the steep Old Trail section between **Camp 8 and the summit**; slippery when wet; about 20 min to pass. LakbayPinas also mentions rope assists near Peaks 7–8 on the New Trail (unverified). | [B3], [B7], [B6] |
| Water | **No natural water on the trail itself.** Water and buko are sold at campsites/huts when caretakers or vendors are present (Camp 1 has caretakers; a hut sells buko before the fork). Pinoy Mountaineer mentions a New Trail campsite with a water station supplied from a river ~30 min away. Vendors may be absent on weekdays. Carry 1.5–3 L per person. **No water point is mapped in OSM.** | [B3], [B6], [B7], [B8], [B2] |
| Registration | Register and pay at the jump-off registration area; logbooks at Camp 1 (Old Trail) and Camp 8 (New Trail). | [B4], [B3], [B6] |
| **Fees (conflict; verify before demo)** | Most recent claim (LakbayPinas, Sep 2026, trip May 2026): ₱140 at jump-off (barangay eco-fee + tourism tax), ₱20 at Camp 8, ₱40 at the Old Trail descent junction, ₱30/person/night camping, parking ₱100 car / ₱25 motorcycle. Transit Pinas (Jun 2022): ₱140 barangay + ecotourism fee, ₱25 shower, parking ₱100 car / ₱25 motorcycle. Hike To Mountains (Mar 2022): ₱200 traverse registration, plus separate tolls. 2013–2017 reports: ₱20–30 per camp, with 5–6 informal "toll" points (Pinoy Mountaineer opinion, May 2017). **No official fee schedule found.** | [B6], [B4], [B7], [B3], [B10] |
| **Guide requirement (conflict; verify before demo)** | Nov 2015: Nasugbu Tourism OIC told Pinoy Mountaineer guides were **not** required, but trailhead staff enforced them anyway. 2022 blogs: guide required (Hike To Mountains) or optional but hired (Transit Pinas). LakbayPinas (2026): mandatory for all hikers. Fees quoted: ₱500 per group of 5 (2022), ₱800 traverse per group of 5, ₱1,200 overnight. **No official ordinance found.** | [B11], [B7], [B4], [B6] |
| Curfew / cut-off | **No official curfew found.** Blogs advise starting before 5:30–6:00 AM to beat the heat; one observed no hikers on trail after 3 PM (observation, not a rule). LakbayPinas says the registration booth opens at 5:00 AM (unverified). | [B4], [B6], [B7] |
| Camping rules | No camping at the summit; camp only at designated campsites (Camp 1 area is the largest; best sites Camps 1–5). Building fires prohibited (Hike To Mountains). | [B4], [B7], [B3] |
| Closures | No current closure notice found. Past brushfires on Batulao in dry season (Mar 2013, Apr 2016) per blogs; no official fire-season closure policy found. | [B12], [B5] |
| Seasons | Blogs: rainy season June–October, trails muddy and slippery; dry season Nov–May best but hot. **PAGASA (national): rainy season June–November**; cool dry Dec–Feb, hot dry Mar–May. Use PAGASA for the passage. | [B3], [B6], [S-PAGASA-climate] |
| Hazards | Exposed grassland (most of the trail has no shade): heat, sun, dehydration; steep narrow ridges with drops on both sides; loose soil and rock, slippery when wet (esp. the descent); strong wind on upper ridge; sudden afternoon rain; insects at the summit. Fatal fall from Peak 8 (New Trail) in Feb 2012 (Inquirer, Mar 2012). Brushfires in dry season. No leeches reported. | [B3], [B4], [B6], [B7], [B13], [B5] |
| Signal | "Present in most parts" (Pinoy Mountaineer); "mostly present" (Hike To Mountains); mobile data available along the trail (Transit Pinas). **No official coverage map consulted.** Do not promise signal. | [B3], [B7], [B4] |
| Access | Jump-off is off the Tagaytay–Nasugbu Road near KC Hillcrest (formerly Evercrest) Golf Club, Km ~72; buses bound for Nasugbu from Buendia/PITX; tricycle from the highway to the jump-off. | [B3], [B4], [B6] |
| Emergency: national | **911** (national emergency hotline) | see Section 5 |
| Emergency: Nasugbu MDRRMO / PNP | Only found on LakbayPinas (secondary, uncited, possibly machine-written): MDRRMO and PNP mobile numbers. Pinoy Mountaineer (2013) lists a Nasugbu Police landline. **Not confirmed on any official page; do not ship these numbers without calling/confirming. Verify before demo.** | [B6], [B3] |
| Emergency: nearest hospitals (from OSM, verify) | **Metropolitan Medical Center – Nasugbu**, Tagaytay–Nasugbu Road, about 2.4 km straight-line from the jump-off (OSM way 687808036; existence corroborated only by an insurer's accredited-facility PDF). **De La Salle University Poblete Memorial Hospital**, Alfonso, Cavite, about 10 km. **Ospital ng Tagaytay** (city government, `emergency=yes`), about 14 km. **Apacible Memorial District Hospital** (government, Nasugbu; bed capacity set by RA 7234) about 19 km; **Ospital ng Nasugbu** about 21 km. Distances are straight-line, computed from OSM coordinates. Police outpost on the Tagaytay–Nasugbu Road ~3.7 km (OSM). | [B2], [B14] |
| Map data | OSM has: both Trails (`highway=path`, `sac_scale` mountain_hiking/demanding_mountain_hiking, mostly from a GPS trace by Ervin Malicdem / "Schadow1 Expeditions"), Camps 1–9, Peaks 1–11, summit node, trailhead nodes ("Batulao Jumpoff", "Batulao – Tuy Jump-off"), "Batulao Campers Parking", and route relations 3350629 "Mt. Batulao New to Old Trail" and 4483564 "Toong Trail". **Not in OSM:** water points, ranger station, rope section. License ODbL. Data checked via Overpass, OSM base timestamp 2026-10-09. | [B2] |

### 2.2 Batulao source list

| ID | URL | Owner / publisher | Type | Facts supported | Date | Reuse terms |
|---|---|---|---|---|---|---|
| B1 | https://en.wikipedia.org/wiki/Mount_Batulao | Wikipedia contributors | Secondary | Location, barangays, municipalities, elevation (811 infobox vs 693 body), geology, trail overview, campsites | Last edited 15 Aug 2026 | CC BY-SA 4.0 (attribution + share-alike) |
| B2 | https://www.openstreetmap.org/relation/3350629 (route), https://www.openstreetmap.org/node/332020556 (summit), queried via https://overpass-api.de/api/interpreter | OpenStreetMap contributors | Primary for map geometry (community data) | Trail geometry, camps, peaks, elevations per node, trailhead, nearby hospitals/police | Data as of 2026-10-09 | **ODbL 1.0**; attribution "© OpenStreetMap contributors" required; share-alike on derived databases |
| B3 | https://www.pinoymountaineer.com/?p=1342 | Pinoy Mountaineer (Gideon Lasco) | Secondary | Specs (4/9, trail class 3), durations, Old/New Trail, camps 1–10, rope section, water, signal, 2012 fatal fall, old fees, police landline | Posted 9 Aug 2007, body updated 16 Feb 2013 | All rights reserved |
| B4 | https://transitpinas.com/batulao-nasugbu-batangas/ | Transit Pinas (Rex Lim Lim) | Secondary (trip report) | 2022 fees, guide fee, no summit camping, rope/loose rock, signal, durations | 7 Jul 2022 (trip June 2022) | All rights reserved |
| B5 | https://awanderfulsole.com/mt-batulao-dayhike-guide-beginners/ | A Wanderful Sole (Keza Enriquez) | Secondary | Fee history 2016–2023, guide inconsistency, Apr 2016 bush fire, heat after 10 AM, steep section after Camp 7 | Byline 26 Sep 2024 (content 2016–2023) | Unknown (site Terms of Use) |
| B6 | https://lakbaypinas.com/mt-batulao-masl-difficulty-hike-height-location/ | LakbayPinas (Aiden Kenzy) | Secondary, **low trust** (uncited claims, placeholder link text suggests machine-written content) | 2026 fee breakdown, "mandatory guide" claim, water advice (3 L), hazards, MDRRMO/PNP numbers | 2 Sep 2026 | © 2026 LakbayPinas |
| B7 | https://hiketomountains.com/mt-batulao-traverse-nasugbu-batangas/ | Hike To Mountains (Jervis Ergino) | Secondary | 2022 fees, guide required, rope section Camp 8–summit (~20 min), <300 m gain, rules (no fires, no summit camping) | 27 Mar 2022 | © 2026 Hike To Mountains |
| B8 | https://waypoints.ph/detail_gen_wpt_btulao.html | WaypointsDotPH (narrative by Fernando Delos-Reyes) | Secondary | Summit coords, 10 camps, Camp 1 caretaker and logbook, ~1,050 m hearsay | Narrative 2007, site © 2013 | All rights reserved; personal use print only |
| B9 | https://www.mountain-forecast.com/peaks/Mount-Batulao | Mountain-Forecast | Secondary | 813 m elevation | Undated | All rights reserved |
| B10 | https://www.pinoymountaineer.com/?p=9239 | Pinoy Mountaineer (opinion) | Secondary | 5–6 informal toll points, overlapping Nasugbu/Balayan jurisdiction | 14 May 2017 | All rights reserved |
| B11 | https://www.pinoymountaineer.com/?p=7798 | Pinoy Mountaineer | Secondary (reports an LGU statement) | Nasugbu Tourism OIC said guides not required (Nov 2015) vs trailhead enforcement | 30 Nov 2015 | All rights reserved |
| B12 | https://www.pinoymountaineer.com/?p=282 | Pinoy Mountaineer | Secondary | 2013 brushfire, grass regrows, trails fine | 20 Mar 2013 (upd. 6 Sep 2015) | All rights reserved |
| B13 | https://newsinfo.inquirer.net/154351/hiker-dies-from-batulao-mountain-fall | Philippine Daily Inquirer | Secondary (news, citing police) | Fatal fall from Peak 8, reported 1 Mar 2012 | Mar 2012 | All rights reserved |
| B14 | https://lawphil.net/statutes/repacts/ra1992/ra_7234_1992.html | Republic Act 7234 (via LawPhil) | Primary (law) | Apacible Memorial Hospital, Nasugbu, is a government hospital (bed capacity raised to 75) | 19 Mar 1992 | Government work, no copyright (RA 8293 s.176) |
| S-PAGASA-climate | https://www.pagasa.dost.gov.ph/information/climate-philippines | PAGASA (DOST) | Primary | National seasons: rainy Jun–Nov, cool dry Dec–Feb, hot dry Mar–May | Undated | No terms stated; government work |

**Not reachable / not found (Batulao):** nasugbu.gov.ph returned HTTP 403; no Batangas provincial (PTCAO) page on Batulao found; PHIVOLCS volcano list (vmepd.phivolcs.dost.gov.ph) is a staff portal and the archived PHIVOLCS page could not be fetched; no Nasugbu Tourism or Barangay Kaylaway Facebook advisory could be read; no official fee ordinance, guide ordinance, curfew or closure notice found.

## 3. Mt. Pulag (Destination 2)

**Bottom line:** Pulag is a legislated protected area. RA 11685 (2022) makes the PAMB, chaired by DENR-CAR, and its PAMO (headed by a Protected Area Superintendent, PASu) the owners of all visitor rules. The DENR-CAR news site (car.denr.gov.ph, readable with a browser user agent) gives 2025 primary facts: PAMO location, PASu name, elevation 2,922 m, and clean-up and litter concerns. No 2025–2026 official fee schedule, visitor cap or reopening notice for Campsites 1 and 2 could be read. The PAMO publishes bookings and advisories on Facebook, which could not be read. Current rules come from a low-trust 2026 blog and must be **verified before demo**. OSM coverage is good: all four main Trails, camps, springs, toilets and the ranger station are mapped.

### 3.1 Identity and management

| Fact | Value | Source |
|---|---|---|
| Official name / status | **Mt. Pulag Protected Landscape (MPPL)**, RA 11685, approved 8 Apr 2022 (formerly Mt. Pulag National Park, Proclamation 75 of 1987, 11,550 ha) | P1, P2 |
| Area | 11,602 ha "more or less" | P1 |
| Municipalities | Kabayan, Bokod, Buguias (Benguet); Tinoc (Ifugao); Kayapa (Nueva Vizcaya) | P1 |
| Management | PAMB chaired by the DENR-CAR Regional Executive Director; PAMO headed by the PASu; PAMB sets fees; the PASu collects fees and issues permits; fees go to the MPPL Integrated Protected Area Fund | P1 |
| PAMO office | In **Ambangeg, Bokod, Benguet**, on a lot shared with Ambangeg National High School (DENR-CAR / DepEd MOA, 2 May 2025) | P17 |
| PASu | Emerita Albas (named in DENR-CAR release on the Tinoc rest area, and in Feb 2025 news) **(verify before demo)** | P18, P7 |
| **Elevation (conflict)** | **2,922 m**: DENR-CAR (Apr 2025 release), Pinoy Mountaineer, Inquirer. **2,926 m**: Wikipedia list, LakbayPinas. **2,928 m**: Wikipedia infobox (citing PHIVOLCS), OSM node 332020032. Primary owner of the park (DENR-CAR) uses **2,922 m**; use that. | P15, P3, P2, P11, P21 |
| Rank | Highest peak in Luzon (all sources) | P15, P2 |
| Summit | 16.5977 N, 120.8988 E (OSM node 332020032); "Sea of Clouds Viewpoint" node 3266680872 (2,925 m) beside it | P11 |
| Role | Watershed for surrounding provinces; endemic flora and fauna; culturally sacred | P15, P16 |

### 3.2 Trails

**Ambangeg Trail** (easiest; Bokod side; most used)

| Item | Value | Source |
|---|---|---|
| Registration / orientation | DENR Visitor Center / PAMO, Ambangeg, Bokod (mandatory orientation and registration for all Trails) | P3, P17, P21 |
| Jump-off / ranger station | Ranger station in **Bashoy, Kabayan**, about 25–30 min by vehicle above the Visitor Center (LakbayPinas). OSM: "Babadak Ranger Station" (way 712312667) and trailhead "Mt. Pulag Jumpoff – Babalak" (node 312984720) at 16.5722 N, 120.8803 E. | P3, P11, P20, P21 |
| **Ranger station name (unresolved)** | **Babadak**: OSM, Gurupress 2022, LakbayPinas 2026. **Badabak**: Pinoy Mountaineer. **Babalak**: OSM trailhead name; GMA (Dec 2024) uses "Babalak, Bashoy" as the place of a homestay, so Babalak may be the sitio. **No primary (DENR/PAMO) source read settles this.** Display "Ambangeg Trail ranger station (Bashoy, Kabayan)" until confirmed. | P11, P14, P21, P3, P20 |
| Distance | About 8 km ranger station to summit (Pinoy Mountaineer). OSM named segments: Ambangeg Trail 4.6 km + Camp 2–Camp 3 0.7 km + Camp 3–summit 1.8 km ≈ **7.1 km** (computed here). LakbayPinas: ~11.1 mi (~17.9 km) out-and-back with ~985 m (3,231 ft) gain. | P3, P11, P21 |
| Duration | 4–5 h to summit (PM: ~3 h to Camp 2, ~1 h to summit); Gurupress 2022: 3–4 h from the ranger station; LakbayPinas 2026: ~1 h to Camp 1, ~2 h to Camp 2, 1–2 h to summit | P3, P14, P21 |
| Difficulty | Pinoy Mountaineer 3/9, trail class 1–2 (no official rating) | P3 |
| Camps | **Camp 1**: in mossy forest, hut/shelter (OSM node 1914649477, 2,577 m; Camp 1 Shelter way 320168578). **Camp 2**: start of the grassland (OSM way 320168582, 2,709 m; Camp 2 Extension way 320168581, 2,739 m), latrines. **Camp 3 / Saddle**: closest to summit, no water (OSM "Pulag Saddle Camp (Todiakap Trail)" node 3238428674). | P3, P11 |
| Water | Near Camp 2, about 100 m away (PM). OSM springs: node 837190992 (2,650 m, near Camp 1–2) and node 3266680875 (2,700 m, by Camp 2). None at Camp 3. LakbayPinas: 2–3 sources; treat all water. Reliability not officially stated. | P3, P11, P21 |
| Toilets | OSM toilets near Camp 1 (6364223899) and Camp 2 (6364223898, 6697375022) | P11 |
| Segments | Mossy forest (Camp 1 area, slippery after rain), then open grassland to summit; one moderately steep stepped section; no ropes | P3, P21 |
| Start time | Typical 2:00 AM summit push for sunrise. Gurupress (2022) reported PAMO advised against midnight trekking and to follow allowed trekking times. **No written curfew found.** | P14, P21 |

**Akiki Trail** ("Killer Trail"; Kabayan side)

| Item | Value | Source |
|---|---|---|
| Jump-off | Akiki, Brgy. Doacan, Kabayan. OSM trailhead "Mt. Pulag Jumpoff – Akiki" node 312986457; "Mount Pulag National Park Welcome Center" node 4917828321 next to it | P4, P11 |
| Registration | Orientation at the Ambangeg Visitor Center first, then an extra registration and guide hire at the Akiki ranger station (~1 h from the jump-off) | P4, P12 |
| Duration | 10–11 h to summit; 2–4 days | P4 |
| Distance | OSM "Akiki Trail" named ways ≈ 8.6 km (computed here); relation 3625649 | P11 |
| Difficulty | Pinoy Mountaineer 7/9, trail class 3; steep pine slopes | P4 |
| Camps | **Eddet River** (first camp, ~2 h after ranger station; hanging bridge; OSM node 4917828222), **Marlboro Country** (OSM "Marlboro Campsite" node 4917828421; ~3–4 h after Eddet), grassland camp (~2,600 m), **Saddle camp** (~15 min below summit) | P4, P11 |
| Water | Eddet River; spring ~20 m up the trail from Marlboro Country (OSM spring 4176753895 / 6697375010); OSM `drinking_water=untreated` node 12634910342 near Eddet | P4, P11 |
| Shelters / toilets | OSM shelters near Eddet (4176765990) and Marlboro (way 712312664); toilets at Eddet (4176775689) and Marlboro (6697375016) | P11 |

**Tawangan Trail** (Kabayan side)

| Item | Value | Source |
|---|---|---|
| Jump-off | Sitio Labang, Brgy. Tawangan, Kabayan; OSM "Tawangan Jump-off" node 5234245922 | P12, P11 |
| Duration | 10–11 h to summit, 3 days (PM). Transit Pinas: a Tawangan–Ambangeg traverse took ~11 h over ~21.8 km, ~1,300 m gain (search snippet only) | P12, P24 |
| Difficulty | Pinoy Mountaineer 6/9, trail class 3 | P12 |
| Camps | Sitio Labang (night 1, water); saddle camp (night 2). OSM junction "Summit – Tawangan – Lusod Junction" node 3266680873 (2,741 m) | P12, P11 |
| Water | Stream in the grassland is the last source before the saddle; PM advises 4 L per person | P12 |
| Segments / hazards | Long mossy forest (about half a day) with leeches; near-freezing nights; PM (2015) says DENR then discouraged this route over security concerns **(verify; may be outdated)** | P12 |
| Distance | OSM "Tawangan Trail" named ways ≈ 7.7 km (computed here, partial) | P11 |

**Ambaguio Trail** (Nueva Vizcaya side; longest)

| Item | Value | Source |
|---|---|---|
| Jump-off / registration | Ambaguio Municipal Hall, Nueva Vizcaya (register there), reached by jeep from Bayombong | P13 |
| Route | Sitio Dagadag, Upper and Lower Napo, Sitio Balete (bunkhouse), Lusod junction, to the upper grassland where the main Trails meet | P13 |
| Distance / gain | ~24 km, ~2,300 m gain (Lakwatsero) | P13 |
| Duration | Usually 3 days; the Lakwatsero group did Ambaguio–Akiki in 2 days | P13 |
| Camps / water | Balete bunkhouse (donation per group in 2019); water sources not described for the Ambaguio section | P13 |
| Permit | joanathx (low trust) says it needs a special permit **(unverified)** | P22 |
| OSM | Relation 3625650 "Ambaguio Trail to Pulag"; "Lusod Trail" relation 4847664 and jump-off node 3485894423; shelters and springs on the Lusod side | P11 |

**Other routes in OSM** (no official status found): Tinoc–Pulag Trail (Ifugao side; DENR-CAR mentions a proposed DOT rest area in Brgy. Ehem, Tinoc, inside the MPPL, P18), Lusod Trail, "Banao – Napo Tuyak". Do not present these as open Trails without PAMO confirmation.

### 3.3 Rules and logistics (newest first)

| Item | Value | Source |
|---|---|---|
| Booking | Reservation required; no walk-ins (LakbayPinas 2026). Booking via the PAMO Facebook page; LakbayPinas names it "Mt. Pulag Protected Landscape Bulletin" (not verified). Gurupress (2022): book by calling PAMO or messaging online in office hours. | P21, P14 |
| Orientation | Mandatory at the Ambangeg Visitor Center before any Trail; reported ~2 h (SummitPost) or ~30 min (older news) | P3, P4, P10 |
| Medical certificate | "Fit to climb" certificate required (PAMO advisory after a fatal heart attack at Camp 2; PM 2015; LakbayPinas 2026) **(verify)** | P23, P3, P21 |
| **Fees (conflict, verify)** | 2026 (LakbayPinas, low trust): environmental fee ₱250 weekday / ₱350 weekend and holiday, plus admin/LGU fees. 2022 (Gurupress): entrance and user fees doubled on weekends and holidays (no amounts). 2016: entrance ₱175. ≤2015: ₱225 orientation/registration, +₱50 at Akiki. **No official current fee schedule found.** | P21, P14, P5, P3, P4 |
| **Guides and porters (verify)** | Guide required on all Trails. 2026 (LakbayPinas): ₱1,200 per group of 1–5 on Ambangeg, hired at the ranger station. 2015 (PM): Ambangeg ₱500 for 1–5 (+₱100 each extra, max 10 per guide); Akiki ₱1,800 per guide for 1–8; porters ₱300/day (Ambangeg) or ₱1,500/trip (Akiki). 2019 Ambaguio–Kabayan guide ₱5,200. | P21, P3, P4, P13 |
| **Visitor cap (conflict, verify)** | 120 climbers at a time (DENR RD, 2013); "daily carrying capacity limit" referenced by DENR-CAR (2022, no number); groups ≤20 (2016) or ≤30 (2013 recommendation); groups ≤10 (joanathx, low trust); 500 trekkers/day (LakbayPinas, low trust). | P6, P19, P5, P22, P21 |
| Camping | Designated campsites only; no summit camping; no open fires (stoves only). **Weekend camping restriction**: no Ambangeg camping Fri–Sun from 2016 (PM); LakbayPinas says a "2026 weekend camping ban" sends weekend hikers to homestays near the ranger station **(verify)**. Fine up to ₱5,000 for camping violations (LakbayPinas, unverified). | P5, P21, P10 |
| **Campsites 1 and 2** | Closed by PAMO in Feb 2025 for rehabilitation and clean-up after persistent litter; reopening to be announced. **No reopening notice found** in DENR-CAR releases (clean-up of Ambangeg Trail on 10 Jun 2025; RED site walk on 30 Apr 2025 citing litter and water-resource concerns). A 2026 blog describes weekday camping at Camps 1 and 2, which suggests reopening, but this is **unverified**. | P7, P16, P15, P21 |
| Closures | Fire closures 2018, 2019 (Akiki), 2020; all hikes suspended in stormy weather under DENR policy (older news); PAMB decides closures, not the town (2010); reopening after COVID needed a PAMB resolution (DENR-CAR 2022) | P2, P9, P8, P19 |
| Drones | Unauthorised drone flights prohibited; commercial use needs PAMB/DENR clearance (joanathx, unsourced) **(verify)** | P22 |
| Conduct | Pack out all trash; DENR-CAR asks visitors to "Leave No Trace" and respect the sacredness of the Cordillera highlands | P16, P7 |

### 3.4 Hazards

| Hazard | Value | Source |
|---|---|---|
| Cold / frost | Temperatures can reach 0 °C or lower, especially Dec–Feb; frost common; LakbayPinas claims lows near −5 °C (unverified). Prepare for cold all year. | P3, P2, P21 |
| Hypothermia | PAMO (via Gurupress 2022) warned that waiting more than an hour at the summit for sunrise without proper clothing can cause hypothermia. A hiker was rescued with hypothermia in Dec 2024 (GMA). | P14, P20 → Emergency Guide: hypothermia |
| Altitude | Summit 2,922 m; altitude illness becomes a risk when sleeping at about 2,450 m or higher (CDC). Camp 2 is about 2,700 m (OSM). | P15, S9, P11 → Emergency Guide: altitude sickness |
| Heart / fitness | Fatal heart attacks reported at Camp 2 and on the trail (older news); DENR urges hikers to get fit before climbing | P23, P20 |
| Fog, wind, rain | Fog and limited visibility on Ambangeg (DENR-CAR, Jun 2025); strong summit wind; slippery mossy-forest sections after rain | P16, P21, P3 |
| Fire | Grass fires from stoves (2018) led to closures and DENR charges; no open fires | P2, P9 |
| Leeches | Reported on Tawangan's mossy forest; none listed on Ambangeg or Akiki | P12, P3, P4 → Guide: leech bites |
| Signal | Weak or sporadic at Camp 2; present at summit (PM); no reliable e-wallet signal at the ranger station (LakbayPinas) | P3, P21 |

### 3.5 Emergency

| Item | Value | Source |
|---|---|---|
| National | **911** | S23 |
| Local MDRRMO (Kabayan, Bokod, Kayapa) | **Not found** on any official page. A 2015 PASu mobile on Pinoy Mountaineer is stale and personal; do not ship. | — |
| Nearest hospital (verify) | **Dennis Molintas District Hospital**, Daclan, Bokod (named in a PhilHealth accredited-hospital list seen via search; PDF could not be opened). Benguet General Hospital, La Trinidad (named in the same lists). A Kabayan District Hospital was only a pending bill in the 19th Congress. A small clinic near the Ambangeg Visitor Center issues medical certificates (LakbayPinas). | P25, P21 |
| OSM hospitals and police (straight-line from the Ambangeg ranger station, computed here) | **Dennis Molintas District Hospital**, Bokod (node 6407982687), ~9 km. **Atok District Hospital** (way 781766536), ~13.5 km. **Benguet General Hospital**, La Trinidad (way 460265060, operator DOH, `emergency=yes`), ~34 km. **Baguio General Hospital & Medical Center** (relation 17638973, `emergency=yes`), ~36 km. Police: **Kabayan Municipal Police Station** (way 684036144), ~7 km; **Bokod Municipal Police Station** (way 684042584), ~10.5 km. Road distances are much longer. | P11 |

### 3.6 OSM Waypoints for Pulag (ODbL, data as of 2026-10-09)

| Trail | Waypoint | OSM ID | Tags / elevation |
|---|---|---|---|
| Ambangeg | Ambangeg Visitor Center area | node 4559629191 "Ambangeg Trail Jumpoff" | `fixme=verify placement` — do not use without checking |
| Ambangeg | Ranger station | way 712312667 "Babadak Ranger Station" | amenity=ranger_station |
| Ambangeg | Trailhead | node 312984720 "Mt. Pulag Jumpoff – Babalak" | highway=trailhead |
| Ambangeg | Homestay | way 441851307 "Baban's Homestay" | tourism=hostel |
| Ambangeg | Camp 1 | node 1914649477; way 320168578 "Camp 1 Shelter" | 2,577 m |
| Ambangeg | Water | node 837190992 (spring, 2,650 m); node 3266680875 (spring, 2,700 m) | natural=spring |
| Ambangeg | Camp 2 | way 320168582 (2,709 m); way 320168581 "Camp 2 Extension" (2,739 m) | tourism=camp_site |
| Ambangeg | Toilets | nodes 6364223899, 6364223898, 6697375022 | amenity=toilets |
| Ambangeg | Camp 3 / Saddle | node 3238428674 "Pulag Saddle Camp (Todiakap Trail)"; shelter way 712312665 | tourism=camp_site |
| All | Summit | node 332020032 "Mount Pulag" (2,928 m); node 3266680872 "Sea of Clouds Viewpoint" (2,925 m) | natural=peak |
| Ambangeg | Pulag Junior (Peak 3) | node 3266680871 | viewpoint |
| Akiki | Jump-off, Welcome Center | node 312986457; node 4917828321 | trailhead; information office |
| Akiki | Eddet Campsite, water | node 4917828222; node 12634910342 (`drinking_water=untreated`); shelter 4176765990; toilets 4176775689 | |
| Akiki | Marlboro Campsite, water | node 4917828421; spring 4176753895 / 6697375010; shelter way 712312664; toilets 6697375016 | |
| Tawangan | Jump-off | node 5234245922 | trailhead |
| Tawangan / Lusod | Junction | node 3266680873 "Summit – Tawangan – Lusod Junction" (2,741 m) | information |
| Lusod / Ambaguio | Jump-off | node 3485894423 "Lusod Trail Jump-off"; spring 3542868985 | |
| Routes | Relations | 3625651 Ambangeg, 3625649 Akiki, 3625650 Ambaguio, 4847664 Lusod | route=hiking |
| Named ways | Trails | Ambangeg 70084439, 712312668; Akiki 181022303, 181022304, 712312670, 1460246174; Tawangan 320168585, 365632754, 365638785, 365646897; Camp 2→3 28489052; Camp 3→summit 28489053 | highway=path |

Many Pulag features carry the note "GPS Trace by Ervin Malicdem" (Schadow1). **Excluded:** node 13408262905 (a 2025 viewpoint with an inappropriate name; it is actually near Itogon, not Pulag).

### 3.7 Pulag source list

| ID | URL | Owner | Type | Supports | Date | Terms |
|---|---|---|---|---|---|---|
| P1 | https://lawphil.net/statutes/repacts/ra2022/ra_11685_2022.html | Text of RA 11685 (LawPhil host) | Primary (law) | Name, area, municipalities, PAMB/PASu, IPAF | 8 Apr 2022 | No copyright (RA 8293 s.176) |
| P2 | https://en.wikipedia.org/wiki/Mount_Pulag | Wikipedia | Secondary | Elevation conflict, trails, climate, fire history | Edited 15 Aug 2026 | CC BY-SA 4.0 |
| P3 | https://www.pinoymountaineer.com/2007/09/mt-pulag-2922.html | Pinoy Mountaineer | Secondary | Ambangeg specs, camps, water, fees, guides, cold, signal | 5 Sep 2007, upd. 3 Dec 2015 | All rights reserved |
| P4 | https://www.pinoymountaineer.com/2008/02/mt-pulagakiki-trail-2922.html | Pinoy Mountaineer | Secondary | Akiki specs, camps, water, fees | 4 Feb 2008, upd. 12 Oct 2015 | All rights reserved |
| P5 | https://www.pinoymountaineer.com/2016/02/mountain-news-new-mt-pulag-rules-limit-groups-to-20-participants.html | Pinoy Mountaineer (relays park post) | Secondary | Groups ≤20, no weekend Ambangeg camping, ₱175 | 15 Feb 2016 | All rights reserved |
| P6 | https://www.sunstar.com.ph/more-articles/only-120-climbers-allowed-in-pulag-at-a-time-denr | SunStar | Secondary | 120 at a time | 22 Nov 2013 | All rights reserved |
| P7 | https://tribune.net.ph/2025/02/20/garbage-overwhelms-mt-pulag | Daily Tribune (relays PAMO) | Secondary | Campsites 1–2 closure, penalties, PASu | Feb 2025 | All rights reserved |
| P8 | https://www.sunstar.com.ph/more-articles/environment-office-cautions-pulag-hikers | SunStar | Secondary | PAMB decides closures | 29 Jul 2010 | All rights reserved |
| P9 | https://newsinfo.inquirer.net/1233375/mt-pulag-closed-given-time-to-heal-after-fire-hits-benguet-forests | Inquirer | Secondary (snippet) | 2020 fire closure, Bashoy entrance | 2020 | All rights reserved |
| P10 | https://www.summitpost.org/mt-pulag/519193 | SummitPost | Secondary (snippet) | Orientation length, camp rules | Undated | Unknown |
| P11 | OSM IDs in 3.6 (query via https://overpass-api.de/api/interpreter) | OpenStreetMap contributors | Primary for geometry | Trails, Waypoints | 2026-10-09 | ODbL 1.0 |
| P12 | https://www.pinoymountaineer.com/?p=1307 | Pinoy Mountaineer | Secondary | Tawangan specs | 4 Oct 2007, upd. 6 Sep 2015 | All rights reserved |
| P13 | https://lakwatsero.com/trail-tale/mount-pulag-ambaguio-akiki-overnight-traverse | Lakwatsero | Secondary (trip report) | Ambaguio route, distance, gain, fees | 2019 | All rights reserved (assumed) |
| P14 | https://www.gurupress-cordillera.com/post/mt-pulag-re-opens-for-tourist-midnight-trekking-prohibited | Gurupress Cordillera | Secondary (reports PAMO announcement) | Reopening, booking, trekking times, doubled weekend fees, hypothermia warning, "Babadak" | 12 Jun 2022 (upd. 14 Oct 2022) | Unknown |
| P15 | https://car.denr.gov.ph/news-events/moreno-personally-leads-ground-assessment-in-mt-pulag/ | DENR-CAR | **Primary** | 2,922 m; RED site walk 30 Apr 2025; litter and water concerns | 2025 | Government work |
| P16 | https://car.denr.gov.ph/news-events/denr-car-marks-38th-anniversary-with-cleanup-drive-at-mt-pulag/ | DENR-CAR | **Primary** | Ambangeg clean-up 10 Jun 2025; fog and cold; Leave No Trace | Jul 2025 | Government work |
| P17 | https://car.denr.gov.ph/news-events/denr-car-deped-car-forge-landmark-deal-to-strengthen-unity-and-shared-land-use-over-ambangeg-site/ | DENR-CAR | **Primary** | PAMO location in Ambangeg, Bokod | May 2025 | Government work |
| P18 | https://car.denr.gov.ph/news-events/denr-car-officials-inspect-proposed-rest-area-on-tinoc-side-of-mt-pulag/ | DENR-CAR | **Primary** | PASu Emerita Albas; Tinoc side inside MPPL | Undated | Government work |
| P19 | https://car.denr.gov.ph/news-events/mt-pulag-to-be-opened-for-the-altitude-ocr-world-series-asia/ | DENR-CAR | **Primary** | Daily carrying capacity exists; PAMB resolution governs opening | 2022 | Government work |
| P20 | https://www.gmanetwork.com/news/balitambayan/promdi/929558/hiker-na-nakaranas-ng-hypothermia-habang-umaakyat-sa-mt-pulag-nasagip/story/ | GMA News | Secondary | Hypothermia rescue; "Babalak, Bashoy"; DENR fitness reminder | 10 Dec 2024 | All rights reserved |
| P21 | https://lakbaypinas.com/mt-pulag-travel-guide-2024/ | LakbayPinas | Secondary, **low trust** | 2026 fees, guide fee, daily cap claim, weekend camping ban, booking page name, clinic, temperatures | 6 Jun 2026 | © 2026 |
| P22 | https://joanathx.com/mount-pulag-travel-guide/ | joanathx | Secondary, **low trust** | Group cap 10, Ambaguio special permit, drone rule | Dated 2019, titled 2026 | Unknown |
| P23 | https://newsinfo.inquirer.net/737714/tourist-dies-of-apparent-heart-attack-in-mt-pulag-trip/amp | Inquirer | Secondary (snippet) | Heart attack at Camp 2; medical certificate advisory | c. 2015 | All rights reserved |
| P24 | https://transitpinas.com/pulag-tawangan-benguet/ | Transit Pinas | Secondary (snippet) | Tawangan–Ambangeg 21.8 km, ~11 h, ~1,300 m gain | Undated | All rights reserved |
| P25 | https://www.philhealth.gov.ph/partners/providers/facilities/accredited/HOSP_053125.pdf (seen via search; 404 when fetched) ; https://issuances-library.senate.gov.ph/bills/house-bill-no-9703-19th-congress | PhilHealth; Senate | Primary (unread) | Dennis Molintas District Hospital (Daclan, Bokod); Benguet General Hospital; Kabayan District Hospital bill pending | 2025; 2023 | Government work |

## 4. Mt. Ulap (Destination 3)

**Bottom line:** The Itogon LGU website is a readable primary source for emergency numbers and closures. A Benguet provincial order lifted the latest suspension on 14 Sep 2026, and the Mt. Ulap Eco-Trail resumed on 16 Sep 2026 (reported by Baguio City Guide; spot-checked here). No official fee ordinance or trail rules page was found. Fees and logistics come from trip reports (2020–2026) that disagree. OSM maps the Mount Ulap Eco Trail, its peaks, camps and the barangay hall, but the named Trail ways cover only part of the traverse.

### 4.1 Identity

| Fact | Value | Source |
|---|---|---|
| Name | Mt. Ulap; the managed route is the **Mt. Ulap Eco-Trail** | U1, U12 |
| Location | Itogon, Benguet. Traverse enters at **Brgy. Ampucao** and exits at **Brgy. Sta. Fe**. | U1, U15 |
| **Elevation (conflict)** | **1,846 m**: Pinoy Mountaineer ("official"), LakbayPinas. **1,856 m**: Pinoy Mountaineer author's GPS. **1,845 m**: OSM node 5235980108. **1,843 m**: OSM node 7101485014 "Mount Ulap Summit". The two OSM summit nodes are ~370 m apart. Use "about 1,846 m". | U1, U19, U8 |
| Summit | 16.2904 N, 120.6312 E (Pinoy Mountaineer; OSM node 7101485014) | U1, U8 |
| Difficulty | Pinoy Mountaineer 3/9, trail class 1–3 (no official rating) | U1, U15 |

### 4.2 Trail: Ampucao–Sta. Fe traverse (Mt. Ulap Eco-Trail)

| Item | Value | Source |
|---|---|---|
| Jump-off | Brgy. Ampucao, off the road toward Philex; parking and the earlier registration point at Ampucao Elementary School. No source names the sitio. One blog wrongly places it at the Itogon barangay hall. | U1, U16, U19, U17 |
| Registration | **Ampucao Barangay Hall** (OSM node 4794386922): sign a manifest with emergency contacts, pay fees, short orientation (2022–2026 blogs). In 2020, registration was at Ampucao Elementary School. | U19, U18, U16 |
| Waypoints in order | Jump-off → **Ambanaw (Ambanao)–Paoay**, 1st peak → **Gungal Rock**, 2nd peak → Campsite 2 / small store → **Mt. Ulap summit**, 3rd peak → **Pong-ol burial caves** → **Sta. Fe** exit | U15, U16, U17, U19 |
| Distance (conflict) | ~8 km (Pinoy Mountaineer), ~8.5 km (Transit Pinas 2022), 9.4 km (LakbayPinas 2026, Joan's Footprints). OSM named "Mount Ulap Eco Trail" ways total ~5.1 km (partial). | U1, U15, U19, U20, U8 |
| Elevations along the way (LakbayPinas, unverified) | Jump-off ~1,497 m (Transit Pinas: 1,440 m) → Ambanao-Paoay 1,788 m at km 3.6 → Gungal 1,814 m at km 5.0 (Transit Pinas: 1,797 m) → summit 1,846 m at km 6.0 → Pong-ol at km 7.5 → Sta. Fe ~1,277 m at km 9.4 | U19, U15 |
| Elevation gain | ~400 m (Transit Pinas; only source) | U15 |
| Duration | 2–3 h to summit, 4–6 h full traverse (PM, LakbayPinas); 6–8 h (Queen's Escape). Segments (Joan's Footprints): jump-off → Ambanao-Paoay ~1 h; → Gungal ~1 h; → summit ~20 min; summit → campsite ~20 min; descent to Sta. Fe ~1.5 h. | U1, U19, U17, U20 |
| Camps | **Camp Site 1** (OSM node 7101485010, near Ambanaw-Paoay) and **Camp Site 2** (OSM node 7101485015, below the summit, with a store). Camping fees conflict (see 4.3). | U8, U15, U19 |
| Water | **No reliable natural water and none at the campsites**; buy water at the Campsite 2 store when open; carry at least 2 L | U17, U15, U19 |
| Notable segments | Open pine and grass ridges with no shade; **Gungal Rock**, a slanted rock with a cliff drop where rangers limit photo time; steep, loose descent from the summit to Pong-ol and Sta. Fe; hanging bridges and cemented path near Sta. Fe | U1, U17, U18, U16, U19 |
| Variants | Reverse traverse from Sta. Fe; overnight with backtrack from Campsite 2 to Gungal, then down via Sta. Fe (Transit Pinas). No other official variant found. | U15 |
| Pong-ol | Burial caves; do not touch or photograph remains (LakbayPinas, unverified rule) | U19 |

### 4.3 Rules and logistics (newest first; all fees verify before demo)

| Item | Value | Source |
|---|---|---|
| **2026 status timeline** | 20 Apr: Itogon EO 21 closed Ulap and other eco-sites for forest fires (no trekking, camping or events). 1 May: EO 23 reopened them with stricter fire prevention. 3 Jun: Ampucao barangay closure for monsoon rains (aggregator only, unverified). 24 Jul: closed for Typhoon Kiyapo; 27 Jul: Itogon lifted the suspension. 5 Aug: Benguet EO 2026-53 suspended adventure tourism province-wide (TS Maymay and monsoon). 14 Sep: EO 2026-71 lifted it; **16 Sep: Mt. Ulap Eco-Trail resumed operations.** No October notice found. | U10, U11, U3, U9, U4, U6, U12 |
| Who closes | Itogon mayor (EOs 21, 23), Benguet governor (EOs 2026-53, 2026-71), and the barangay; enforcement by police, BFP, MDRRMO and barangay officials | U10, U11, U12 |
| Registration fee | ₱100/person (2022, Jan 2025, 2026 blogs); ₱50 in 2020 | U15, U20, U19, U16 |
| Environmental (DENR) fee | ₱30/adult; ₱15 students, ₱100 foreigners (Joan's Footprints, Jan 2025); 2022: ₱30/person or ₱200/group. A separate ₱60 "hiking fee" in one source only. | U20, U19, U15 |
| Guides | **Mandatory**, 1 guide per up to 7 hikers. 2025–26: ₱800 day hike, ₱1,600 overnight. 2020–22: ₱600 / ₱1,000. | U19, U20, U15, U16 |
| Porters | 2025–26: ₱800 one way, ₱1,200 two way, 15 kg cap | U19, U20 |
| Camping fee (conflict) | 2022: ₱800 site fee for 1–7 + ₱100/person DENR; Jan 2025: ₱800 per group of 10 + ₱200/group DENR; 2026: ₱200/group | U15, U20, U19 |
| Other fees | Parking ₱100/vehicle; shower ₱40–50 | U15, U19 |
| Registration hours / cut-off (conflict) | 2022: day hikes register 5 AM–12 noon; overnight 9 AM–2 PM; reservation by online form. 2026: opens 4 AM weekends, 5 AM weekdays; walk-in for groups under 15; no formal cut-off stated. | U15, U19 |
| Visitor caps (conflict) | 500/day weekends and holidays, 150 weekdays, groups ≤20 (syramay, attributed to the LGU); groups 15–20 (2020); "no cap" (LakbayPinas 2026) | U18, U16, U19 |
| Fire rules | Itogon declared Mt. Ulap smoke- and vape-free (24 Jun 2025); open flames only in fire pits, ₱1,000 fine (LakbayPinas, unverified); littering fine ₱500 (unverified) | U5, U19 |
| Weather rule | Trail closes at Tropical Cyclone Wind Signal No. 1 (LakbayPinas, unverified); in practice the LGU and province suspend activity ahead of storms (2026 EOs) | U19, U4, U12 |
| Clean-ups | DENR-CAR and Itogon held a clean-up on Mt. Ulap on 14 Feb 2025 | U14 |

### 4.4 Hazards

| Hazard | Value | Source |
|---|---|---|
| Cliffs and drops | Gungal Rock edge (rangers limit photo time); cliff-edge trail sections | U17, U18, U16, U1 |
| Steep, loose descent | Summit to Pong-ol and Sta. Fe | U15, U16, U19 |
| Exposure | No shade on ridges; strong wind, especially in November; cold nights; fog can hide the trail | U15, U17, U19 |
| Fire season | Feb–May; 2026 closure for forest fires; smoke-free rule | U10, U5, U19 |
| Storms | Typhoon and monsoon closures (Jul–Sep 2026) | U4, U12 |
| Lightning | **No Ulap-specific source found**; exposed ridge → Emergency Guide: lightning (S10) | S10 |
| Livestock | Cattle near the summit (LakbayPinas) | U19 |
| Incidents | Jan 2018: ~1 ha grass fire near Sta. Fe, outside Mt. Ulap, blamed on a cigarette butt from the road. No Ulap deaths or rescues found in news. | U21 |
| Signal | Patchy along the trail; none at Campsite 2 | U15, U17, U19 |

### 4.5 Emergency

| Item | Value | Source |
|---|---|---|
| National | **911** | S23 |
| Itogon MDRRMO (official) | 0962-967-2977 / 0929-862-9895 / 0956-856-3661 (Itogon LGU hotline page, list updated 2 Feb 2026) **(verify before demo)** | U2 |
| Other Itogon offices (official) | Tourism, Culture & Arts 0938-629-6065; MENRO 0946-126-4340; Municipal Health 0946-201-3328 **(verify before demo)** | U2 |
| Ampucao barangay | (074) 637-2189 (blogs 2022 and 2026 only; **unverified, do not ship**) | U15, U19 |
| Hospitals (OSM, straight-line from Ampucao, computed here) | **Itogon Tinongdan District Hospital** (way 485069367), ~7.4 km (a 10-bed Itogon hospital in Tinongdan was created by RA 6875, 1990). **Baguio General Hospital & Medical Center** (relation 17638973, `emergency=yes`), ~10.4 km. **Benguet General Hospital**, La Trinidad (way 460265060, DOH), ~15.5 km. Police outpost, Itogon Poblacion (way 962643157), ~4.3 km. | U8, U22 |

### 4.6 OSM Waypoints for Ulap (ODbL, data as of 2026-10-09)

| Waypoint | OSM ID | Notes |
|---|---|---|
| Ampucao Barangay Hall (registration) | node 4794386922 | amenity=townhall |
| Mt. Ulap photo spot near start | node 7101485009 | viewpoint |
| Camp Site 1 | node 7101485010 | camp_site |
| Ambanaw-Paway 1st Peak | node 6284078689 | viewpoint |
| Gungal Peak (2nd peak) | node 7101485012 | peak |
| Gungal Rock Formation | nodes 7101485013, 6284089886 (duplicates) | viewpoint |
| Toilets near Gungal | node 7101485011 | amenity=toilets |
| Mount Ulap camp_site | node 5133012421 | camp_site near summit |
| Mount Ulap Summit | node 7101485014 (1,843 m); node 5235980108 (1,845 m) | duplicate peaks |
| Camp Site 2 | node 7101485015 | camp_site |
| "Mount Ulap" hut | node 4896257426 | alpine_hut |
| "Ulap Jumpoff-Exit" | node 5572530838 | alpine_hut; location fits the Sta. Fe side **(verify)** |
| Trail ways | "Mount Ulap Eco Trail": 760182513, 760182515–760182518, 760182797–760182800, 760184379, 760185742, 760185743 (~5.1 km); "Philex Ridge Trail": 366755651, 760182514, 760182512 | sac_scale mountain_hiking; no route relation |
| Not mapped | Water points, Pong-ol caves, ranger station | |
| **Excluded** | node 13408262905 (viewpoint with an inappropriate name, ~2 km west of the Ulap ridge) | Do not import |

### 4.7 Ulap source list

| ID | URL | Owner | Type | Supports | Date | Terms |
|---|---|---|---|---|---|---|
| U1 | https://www.pinoymountaineer.com/2015/11/mt-ulap-1846m-in-itogon-benguet.html | Pinoy Mountaineer | Secondary | Elevation, route, times, difficulty, hazards | 30 Nov 2015, upd. 30 Jan 2017 | All rights reserved |
| U2 | https://itogon.gov.ph/2024/02/itogon-emergency-hotlines/ | Municipality of Itogon | **Primary** | MDRRMO, tourism, MENRO, health numbers | 20 Feb 2024; list upd. 2 Feb 2026 | Not stated |
| U3 | https://itogon.gov.ph/2026/04/itogon-reopens-eco-tourism-sites-starting-may-1st/ | Municipality of Itogon | **Primary** | EO 23 reopening 1 May 2026 | 30 Apr 2026 | Not stated |
| U4 | https://itogon.gov.ph/2026/07/tourism-mining-activities-suspended-ahead-of-tropical-storm-kiyapo/ | Municipality of Itogon | **Primary** | Typhoon suspension | Jul 2026 | Not stated |
| U5 | https://itogon.gov.ph/?p=4738 | Municipality of Itogon | **Primary** | Smoke/vape-free Ulap | 24 Jun 2025 | Not stated |
| U6 | https://itogon.gov.ph/2026/07/mayor-lifts-tourism-mining-suspension/ | Municipality of Itogon | **Primary** | Suspension lifted | 27 Jul 2026 | Not stated |
| U7 | https://tribune.net.ph/2026/07/24/cordillera-tourist-sites-shut-as-kiyapoph-threatens-region | Daily Tribune | Secondary | Ulap closed for Kiyapo | 24 Jul 2026 | All rights reserved |
| U8 | OSM IDs in 4.6 | OpenStreetMap contributors | Primary for geometry | Trail, Waypoints, hospitals | 2026-10-09 | ODbL 1.0 |
| U9 | https://www.govserv.org/PH/Baguio-City/699260517571730/Department-of-Tourism--Cordillera-Administrative-Region-Office | govserv.org (aggregator) | Secondary, **low trust** | 3 Jun 2026 Ampucao closure | Jun 2026 | Unknown |
| U10 | https://tribune.net.ph/2026/04/22/itogon-suspends-trekking-amid-forest-fires | Daily Tribune | Secondary | EO 21 closure, enforcers | 22 Apr 2026 | All rights reserved |
| U11 | https://baguiocityguide.com/mt-ulap-other-itogon-eco-tourism-sites-temporarily-closed-to-trekking-camping-and-other-activities/ | Baguio City Guide | Secondary | EO 21 details | 28 Apr 2026 | Unknown |
| U12 | https://baguiocityguide.com/mt-ulap-eco-trail-reopens-as-benguet-lifts-suspension-on-adventure-activities/ | Baguio City Guide (cites Benguet EO 2026-71) | Secondary (spot-checked) | Provincial suspension 5 Aug, lifted 14 Sep, Ulap resumed 16 Sep 2026 | 16 Sep 2026 | Unknown |
| U13 | https://www.philstar.com/nation/2026/05/04/2525423/benguet-trekking-trails-reopen | Philstar | Secondary | Reopening 1 May 2026 | 4 May 2026 | All rights reserved |
| U14 | https://itogon.gov.ph/2025/02/puso-at-puno-lgu-itogon-celebrates-valentines-day-with-environmental-advocacy-at-mt-ulap/ | Municipality of Itogon | **Primary** | Clean-up 14 Feb 2025 | 17 Feb 2025 | Not stated |
| U15 | https://transitpinas.com/benguet-mt-ulap-gungal/ | Transit Pinas | Secondary | 2022 fees, hours, elevations, gain, variants, water | 29 Jul 2022 | All rights reserved |
| U16 | https://www.awanderfulsole.com/mt-ulap-dayhike-guide-ampucao-sta-fee-traverse/ | A Wanderful Sole | Secondary | 2020 registration, fees, group size, cliffs | 4 Jun 2020 | Unknown |
| U17 | https://thequeensescape.com/mt-ulap-eco-trail-itogon-benguet-2020-travel-guide/ | The Queen's Escape | Secondary | No water, Gungal Rock, fog, duration | 26 May 2020 | Unknown |
| U18 | https://www.syramay.com/mt-ulap-traverse-dayhike-guide-itinerary/ | syramay.com | Secondary | Orientation, caps, Gungal photo limit | Undated | Unknown |
| U19 | https://lakbaypinas.com/ultimate-guide-to-mt-ulap-in-itogon-benguet/ | LakbayPinas | Secondary, **low trust** | 2026 fees, km markers, rules, hazards | 1 Sep 2026 | © 2026 |
| U20 | https://joansfootprints.com/2026/06/17/2020-diy-travel-guide-to-mt-ulap-in-benguet-itinerary-budget/ | Joan's Footprints | Secondary | Fees as of Jan 2025, segment times | 17 Jun 2026 | Unknown |
| U21 | https://www.sunstar.com.ph/more-articles/mt-ulap-fire-incident-a-hoax | SunStar | Secondary | Jan 2018 grass fire near Sta. Fe | 29 Jan 2018 | All rights reserved |
| U22 | https://www.chanrobles.com/republicacts/republicactno6875.html | RA 6875 (ChanRobles host) | Primary (law, via snippet) | 10-bed Itogon hospital in Tinongdan | 1990 | No copyright |

## 5. Cross-mountain safety sources (Guide Library)

**Bottom line:** Use the **IFRC 2020 guidelines** as the base for Emergency Guides, since the Philippine Red Cross publishes no public first-aid text. Back them with CDC, WHO and NWS (public domain or reusable with credit) and with PAGASA for Philippine weather terms. Per [ADR 0003](../adr/0003-emergencies-route-to-guides.md), these sources feed the reviewed static Guides, not free-form Assistant answers.

### 5.1 Source register

| ID | URL | Owner | Type | Facts supported | Date | Reuse terms |
|---|---|---|---|---|---|---|
| S1 | https://www.ifrc.org/sites/default/files/2022-02/EN_GFARC_GUIDELINES_2020.pdf | International Federation of Red Cross and Red Crescent Societies (PRC is a member) | Primary | First-aid chapters: severe bleeding p.187, cuts and grazes p.202, blister p.209, fractures/sprains/strains p.223, insect bites or stings p.244, snakebites p.254, allergic reaction and anaphylaxis p.279, hyperthermia p.332, dehydration p.337, hypothermia p.343, altitude sickness p.352 | 2020 | © IFRC 2020; copies for **non-commercial use** allowed with source acknowledged; commercial use needs permission |
| S2 | https://redcross.org.ph/ and https://redcross.org.ph/trainings | Philippine Red Cross | Primary | Emergency hotline **143**, trunkline +63 2 8790 2300; course list (Standard First Aid, Emergency First Aid incl. wilderness variants). **No public first-aid content.** | Undated, "© 2024" | All rights reserved |
| S3 | https://www.who.int/news-room/fact-sheets/detail/snakebite-envenoming | WHO | Primary | Global snakebite burden; antivenom is the effective treatment and is on the WHO Essential Medicines List; no first-aid steps | Fetch showed a 2026 date (re-check) | WHO terms of use (not read) |
| S4 | https://www.upm.edu.ph/cpt_news/celebrating-up-pgh-national-poison-prevention-week-insights-on-venoms-common-poisons-and-first-aid-tips/ | UP Manila (state university; UP-PGH poison center) | Institutional secondary | PH antivenom exists only for the Philippine cobra (*Naja philippinensis*), produced by RITM, with supply shortages; first aid: clean, immobilise, no tourniquet; NPMCC phone **(verify)** | 2 Jul 2024 | Not stated |
| S5 | https://www.frontiersin.org/articles/10.3389/fphar.2021.727756/pdf | Frontiers in Pharmacology (peer-reviewed) | Secondary | Philippine cobra antivenom only weakly neutralises Samar cobra venom | 2021 | Probably CC BY (unconfirmed) |
| S6 | https://alpha.pna.gov.ph/articles/1224373 ; https://www.sunstar.com.ph/cebu/antivenom-for-cobra-bites-available-in-cebu | PNA (government news agency); SunStar | Secondary | Antivenom supply from RITM only, uneven by region | Recent (dates not captured) | PNA: government work; SunStar: all rights reserved |
| S7 | https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/heat-and-cold-illness-in-travelers.html | US CDC (Backer, Freer) | Primary | Hypothermia (<35 °C core, shivering, confusion); heat exhaustion vs heatstroke (≥41 °C + mental change), cool first; salt drink recipe | 23 Apr 2025 | Public domain; credit CDC, no endorsement implied |
| S8 | https://www.cdc.gov/natural-disasters/psa-toolkit/recognizing-hypothermia.html | US CDC | Primary (search excerpt only) | Hypothermia can occur above ~4 °C when wet from rain or sweat; warm the core; no alcohol | Undated | Public domain |
| S9 | https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html | US CDC | Primary (search excerpt) | Altitude illness risk when sleeping ≥2,450 m; AMS symptoms; do not ascend with symptoms | Apr 2025 | Public domain |
| S10 | https://www.cdc.gov/lightning/safety/index.html | US CDC | Primary | No place outside is safe; wait 30 min after last thunder; get off peaks and ridges; avoid lone trees; spread groups out | 16 Jun 2026 | Public domain |
| S11 | https://www.weather.gov/safety/flood-turn-around-dont-drown | US National Weather Service | Primary | ~15 cm of fast water can knock an adult down; do not enter moving floodwater | Undated | Public domain; no endorsement implied |
| S12 | https://www.pagasa.dost.gov.ph/learning-tools/tropical-cyclone-wind-signal | PAGASA (DOST) | Primary | **TCWS #1** 39–61 km/h, 36 h lead · **#2** 62–88 km/h, 24 h · **#3** 89–117 km/h, 18 h · **#4** 118–184 km/h, 12 h · **#5** ≥185 km/h, 12 h (re-checked here) | Undated | No terms stated; government work |
| S13 | https://pagasa.dost.gov.ph/learnings/legend | PAGASA | Primary | Thunderstorm Advisory (storm within ~2 h), Watch (likely within 12 h), Information; rainfall warning tiers Advisory / Alert / Emergency | Undated | Government work |
| S14 | https://varsitarian.net/sci-tech/20250724/explainer-how-do-pagasas-rainfall-warnings-and-weather-advisories-work ; https://newsinfo.inquirer.net/215587/pagasa-unveils-color-coding-for-rain-alerts | News | Secondary | Yellow 7.5–15 mm/h, orange 15–30 mm/h, red >30 mm/h (official page not found) | 2025; 2012 | All rights reserved |
| S15 | https://www.pagasa.dost.gov.ph/weather/heat-index (bands only in an image); https://newsinfo.inquirer.net/2040858/heat-index-hits-danger-levels-in-5-luzon-areas | PAGASA; Inquirer | Primary page, secondary text | Heat index bands: Caution 27–32 °C, Extreme Caution 33–41 °C, Danger 42–51 °C, Extreme Danger ≥52 °C **(verify against PAGASA image)** | 2025 | Government work / all rights reserved |
| S16 | https://newsinfo.inquirer.net/2039890/doh-warns-vs-heat-related-illness-amid-high-heat-index ; https://mindanews.com/top-stories/2025/04/doh-warns-against-exposure-to-extreme-heat/ | News reporting DOH | Secondary | DOH heat first aid: shade, loosen clothes, cold compress on neck/armpits/groin, sips of water if conscious, hospital | Mar–Apr 2025 | All rights reserved |
| S17 | https://iris.who.int/handle/10665/155821 (WHO/FWC/WSH/15.02) | WHO | Primary | A rolling boil kills bacteria, viruses and protozoa, even at altitude; cool and store safely | 2015 | Usually CC BY-NC-SA 3.0 IGO (unverified) |
| S18 | https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html ; https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/water-disinfection-for-travelers.html | US CDC | Primary | Boil 1 min (3 min above ~2,000 m); treatment options for hikers | 2024–2025 | Public domain |
| S19 | https://www.fs.usda.gov/visit/know-before-you-go/if-you-get-lost ; https://www.nps.gov/glac/learn/news/missing-hikers-were-well-prepared.htm | USDA Forest Service; US NPS | Primary (USFS via excerpts) | STOP (Stop, Think, Observe, Plan); stay put at night or when hurt; three signals = distress | Undated; 2012 | Public domain |
| S20 | https://mb.com.ph/2026/08/19/doh-urges-floodwater-exposed-people-to-get-checked-for-leptospirosis-within-24-to-48-hours | Manila Bulletin reporting DOH | Secondary | After floodwater exposure, get checked within 24–48 h; do not self-medicate | Aug 2026 | All rights reserved |
| S21 | https://lnt.org/wp-content/uploads/2026/01/LeaveNoTrace_Community_brandguide_1.26.26.pdf | Leave No Trace | Primary | The 7 Principles and their usage terms (see Section 7) | 26 Jan 2026 | **Copyrighted; strict usage terms** |
| S22 | https://lawphil.net/statutes/repacts/ra2018/ra_11038_2018.html | RA 11038 (E-NIPAS Act), LawPhil copy | Primary (law) | Prohibited acts in protected areas, including disturbing wildlife, collecting without permit, cutting timber, dumping waste, causing forest fires, damaging trails or formations, littering | 22 Jun 2018 | No copyright (RA 8293 s.176) |
| S23 | https://lawphil.net/executive/execord/eo2018/eo_56_2018.html | EO 56 s.2018, LawPhil copy | Primary (law) | **911** is the Nationwide Emergency Hotline, run under DILG, replacing 117 (re-checked here) | 25 May 2018 | No copyright |
| S24 | https://lawphil.net/executive/execord/eo2016/eo_6_2016.html | EO 6 s.2016 | Primary (law) | **8888** is the Citizens' Complaint Hotline, **not** an emergency number | 2016 | No copyright |
| S25 | https://lawphil.net/statutes/repacts/ra1997/ra_8293_1997.html | RA 8293 (IP Code) | Primary (law) | s.176: no copyright in Philippine Government works (approval needed for profit use); s.175: laws and official texts unprotected | 6 Jun 1997 | No copyright |

### 5.2 Mapping to the 15 Guides

| Guide | Emergency Guide? | Main sources | Notes |
|---|---|---|---|
| Snakebite | Yes | S1 p.254, S3, S4, S5, S6 | Keep still, immobilise, no tourniquet/cutting/suction, get to hospital. PH antivenom covers only the Philippine cobra (RITM). **No DOH page read; no Batulao snake record found.** |
| Insect and bee stings | No | S1 p.244, p.279 (anaphylaxis) | Step text not yet read |
| Leech bites | No | **Not found**; fall back to S1 p.202 (cuts and grazes) | Flag as unsourced |
| Sprains and fractures (splinting) | Yes | S1 p.223 | Improvised splints mentioned for remote settings |
| Bleeding wounds | Yes | S1 p.187, p.202 | Direct pressure first; tourniquet only for life-threatening limb bleeding |
| Blisters | No | S1 p.209 | Step text not yet read |
| Hypothermia | Yes | S1 p.343, S7, S8 | Relevant on Pulag (0 °C or lower Dec–Feb) and on any wet, windy ridge |
| Heat exhaustion and heatstroke | Yes | S1 p.332, S7, S15, S16 | Most relevant on Batulao (exposed grassland) |
| Dehydration | Yes | S1 p.337, S7 | Batulao has no water on the Trail |
| Lost on the trail (STOP) | Yes | S19 | No Philippine source found |
| Lightning | Yes | S10, S13 | Batulao and Ulap are exposed ridges |
| Flash floods and river crossings | Yes | S11, S13, S14, S20 | No PH river-crossing source |
| Altitude sickness | Yes | S1 p.352, S9 | Matters only on Pulag-class peaks (sleeping ≥2,450 m); not Batulao (811 m) or Ulap (~1,846 m) |
| Pitching a tent | No | **None**; LNT principle 2 (S21) for site choice | Camp skill |
| Purifying water | No | S17, S18 | Boil 1 min; 3 min above ~2,000 m (Pulag) |

### 5.3 Hotlines

| Line | Number | Source | Status |
|---|---|---|---|
| National emergency | **911** | S23 (EO 56 s.2018) | Primary, confirmed |
| Philippine Red Cross | **143** | S2 (redcross.org.ph) | Official site **(verify before demo)** |
| UP-PGH National Poison Management and Control Center | +63 2 8524 1078 | S4 (UP Manila, Jul 2024) | Official university page **(verify before demo)** |
| 8888 | Not an emergency line | S24 | Do not list as emergency |
| DOH hotline 1555 | — | News only | Unverified, do not ship |
| NDRRMC operations | — | Secondary listicles only | Unverified, do not ship |
| Nasugbu MDRRMO / PNP / Batangas PDRRMO | — | Only a low-trust blog (B6) | **Not verified; do not ship until confirmed** |
| Itogon MDRRMO (Mt. Ulap) | 0962-967-2977 / 0929-862-9895 / 0956-856-3661 | itogon.gov.ph | Primary **(verify before demo)** |
| Kabayan / Bokod / Kayapa MDRRMO (Mt. Pulag) | — | Not found on any official page | Do not ship |
| Itogon Tourism, MENRO, Municipal Health (Mt. Ulap) | 0938-629-6065 / 0946-126-4340 / 0946-201-3328 | U2 (itogon.gov.ph) | Primary **(verify before demo)** |
| Ampucao barangay hall | — | Blogs only (U15, U19) | Unverified, do not ship |

### 5.4 Leave No Trace and protected-area rules

- **LNT 7 Principles** (S21): Plan Ahead and Prepare; Travel and Camp on Durable Surfaces; Dispose of Waste Properly; Leave What You Find; Minimize Campfire Impacts; Respect Wildlife; Be Considerate of Others. Strict reuse terms, see Section 7.
- **RA 11038 / RA 7586 (NIPAS)** (S22): applies to Pulag (a legislated protected landscape). It does **not** clearly apply to Batulao, which is not a known NIPAS site (unverified). Implementing rules DAO 2019-05 (https://faolex.fao.org/docs/pdf/phi190721.pdf, not read). Penalties of ₱50,000 to ₱5 million and 6–12 years in prison are reported by Inquirer (https://newsinfo.inquirer.net/1007859/expanded-nipas-law-creates-94-more-natl-parks-across-ph, secondary).
- No national DENR circular specific to hiking trails was found. Rules are set per site by the PAMB (protected areas) or by the LGU and barangay.

## 6. Proposed RAG passages

### 6.1 Mt. Batulao passages

Each passage should be 60–150 words, written fresh by the team in English with a Filipino version, and carry its source IDs and a "last verified" date. Anything marked **(verify)** must be confirmed by phone or on the ground before the demo, or worded as "reported by hikers in 2022–2026; confirm at registration".

| # | Passage title | Hiker question it answers (EN / Taglish) | Feeds from |
|---|---|---|---|
| 1 | About Mt. Batulao | "Gaano kataas ang Batulao? Saan 'to?" | B1, B2, B3 (811 m, Nasugbu, inactive volcano, ~300 m gain) |
| 2 | Getting to the jump-off | "Paano pumunta sa jump-off?" | B3, B4, B6, B2 (trailhead node, parking node) |
| 3 | Registration and fees **(verify)** | "Magkano ang registration? May bayad ba sa taas?" | B6, B4, B7, B10 (present as a range + "bring small bills, confirm at kiosk") |
| 4 | Do I need a guide? **(verify)** | "Kailangan ba ng guide?" | B11, B7, B6 (say: guides are commonly required at the registration area; official status unconfirmed) |
| 5 | The two Trails: Old Trail vs New Trail | "Ano mas madali, Old or New trail?" | B3, B6, B7, B2 |
| 6 | How long does it take? | "Malayo pa ba ang summit? Ilang oras?" | B3, B4, B7, B2 (OSM length) — pair with the Assistant's distance-to-next-Waypoint tool |
| 7 | Camps and peaks along the way (Waypoint list) | "Nasaan na ako? Ano ang Camp 8?" | B2 (Camp 1–9, Peak 1–11 with elevations), B3 |
| 8 | Water: there is none on the Trail | "May tubig ba sa taas?" | B3, B6, B7, B8 (no natural source; buy at huts when open; carry 2–3 L) → links Guide: dehydration, purifying water |
| 9 | The rope section (Camp 8 to summit, Old Trail) | "May rope segment ba? Delikado ba?" | B3, B7, B4 → links Guide: sprains and fractures |
| 10 | Summit and camping rules | "Pwede bang mag-camp sa summit?" | B4, B7, B3 (no summit camping; designated camps; no open fires) |
| 11 | Best time to hike and start time | "Anong oras dapat mag-start?" | B3, B5, B6, S-PAGASA-climate (start ≤6 AM; dry season Dec–May; rainy Jun–Nov per PAGASA) |
| 12 | Heat and sun on an exposed ridge | "Sobrang init, ano gagawin ko?" | B3, B5, B6, DOH heat advisories (Section 5) → Emergency Guide: heat exhaustion and heatstroke |
| 13 | Rain, mud and lightning on the ridge | "Umuulan, ok lang ba tumuloy?" | B4, B6, PAGASA thunderstorm/rainfall warnings (Section 5) → Emergency Guide: lightning |
| 14 | Steep drops and the 2012 accident | "Saan ang pinaka-delikadong part?" | B3, B13, B6 (stay on the Trail at Peak 8 and the summit ridge) |
| 15 | Brushfires in the dry season | "Bawal ba magsiga?" | B12, B5, B7, DENR/LNT (Section 5) |
| 16 | Mobile signal on the mountain | "May signal ba sa taas?" | B3, B4, B7 (usually present; do not rely on it; Tahak works offline) |
| 17 | Emergency: who to call **(verify numbers)** | "Sino tatawagan pag may emergency?" | 911 (Section 5), Nasugbu MDRRMO/PNP once verified, guide/registration desk → Emergency Guides |
| 18 | Nearest hospitals | "Saan ang pinakamalapit na ospital?" | B2 (OSM), B14; name 2–3 facilities with town and road, no phone numbers unless verified |
| 19 | Leave No Trace on Batulao | "Saan itatapon ang basura?" | LNT 7 principles (paraphrased, see licensing), B7, B10 |
| 20 | Wildlife and insects | "May ahas ba? May limatik?" | B3 (no leeches listed), B5/B7 (insects at summit); DOH snakebite (Section 5) → Emergency Guide: snakebite. **No Batulao-specific snake record found; do not claim any species is present.** |

Guide slugs used in `related_guides` are kebab-case forms of the 15 Guide names in docs/plan.md (e.g. `hypothermia`, `altitude-sickness`, `lost-on-the-trail`, `pitching-a-tent`).

### 6.2 Mt. Pulag passages (drafted in `content/destinations/mt-pulag/passages/`)

| # | Passage | Hiker question (EN / Taglish) | Sources | Guides | Verify |
|---|---|---|---|---|---|
| 01 | About Mt. Pulag | "How high is Pulag?" / "Gaano kataas ang Pulag?" | P1, P2, P11, P15, P16, P17 | — | yes (elevation conflict) |
| 02 | Booking, orientation and medical certificate | "Kailangan ba ng reservation? Saan ang orientation?" | P3, P4, P14, P17, P21, P23 | — | yes |
| 03 | Fees | "Magkano ang bayad sa Pulag?" | P3, P5, P14, P21 | — | yes |
| 04 | Guides and porters | "Required ba ang guide? May porter ba?" | P3, P4, P13, P21 | — | yes |
| 05 | Ambangeg Trail | "Ano ang pinakamadaling trail?" | P3, P11, P14, P21 | — | no |
| 06 | Ranger station name (Babadak / Badabak / Babalak) | "Saan ang ranger station?" | P3, P11, P14, P20, P21 | — | yes |
| 07 | Akiki Trail | "Gaano kahirap ang Akiki?" | P4, P11 | — | no |
| 08 | Tawangan Trail | "Pwede ba sa Tawangan?" | P11, P12, P24 | leech-bites | yes |
| 09 | Ambaguio Trail | "Gaano kahaba ang Ambaguio trail?" | P11, P13, P22 | — | yes |
| 10 | Campsites and camping rules (Camps 1–2 closure) | "Pwede bang mag-camp sa Camp 2?" | P3, P5, P7, P16, P21 | pitching-a-tent | yes |
| 11 | Water on the Trails | "May tubig ba sa taas?" | P3, P4, P11, P12, P21 | purifying-water, dehydration | no |
| 12 | Cold, frost and wind | "Gaano kalamig sa summit?" | P2, P3, P14, P16, P20, P21 | hypothermia | no |
| 13 | Altitude | "May altitude sickness ba sa Pulag?" | P11, P15, S9 | altitude-sickness | no |
| 14 | Summit sunrise timing | "Anong oras dapat umalis para sa sunrise?" | P14, P21 | hypothermia | no |
| 15 | Weather, fire and closures | "Sarado ba ang Pulag pag may bagyo?" | P2, P8, P9, P19, S12 | lightning | no |
| 16 | Emergency contacts and hospitals | "Saan ang pinakamalapit na ospital?" | P11, P25, S23 | — | yes |
| 17 | Leave No Trace and protected-area rules | "Saan itatapon ang basura?" | P1, P7, P11, P15, P16, S22 | — | no |

### 6.3 Mt. Ulap passages (drafted in `content/destinations/mt-ulap/passages/`)

| # | Passage | Hiker question (EN / Taglish) | Sources | Guides | Verify |
|---|---|---|---|---|---|
| 01 | About Mt. Ulap | "Gaano kataas ang Ulap?" | U1, U8, U19 | — | yes (elevation conflict) |
| 02 | Getting to the Ampucao jump-off | "Saan ang jump-off ng Ulap?" | U1, U15, U16, U19 | — | no |
| 03 | Registration and hours | "Anong oras bukas ang registration?" | U15, U16, U18, U19 | — | yes |
| 04 | Fees | "Magkano ang fees sa Ulap?" | U15, U16, U19, U20 | — | yes |
| 05 | Guides and porters | "Kailangan ba ng guide?" | U15, U16, U19, U20 | — | yes |
| 06 | The traverse at a glance | "Gaano kahaba ang traverse?" | U1, U8, U15, U19, U20 | — | yes (distance conflict) |
| 07 | Ampucao to Ambanaw-Paoay and Gungal | "Malayo pa ba ang Gungal Rock?" | U8, U15, U19, U20 | — | no |
| 08 | Gungal Rock safety | "Delikado ba sa Gungal Rock?" | U1, U17, U18 | sprains-and-fractures, bleeding-wounds | no |
| 09 | Summit and campsites | "Pwede bang mag-overnight?" | U8, U15, U19, U20 | pitching-a-tent | yes (camping fees) |
| 10 | Descent to Pong-ol and Sta. Fe | "Mahirap ba ang pababa?" | U1, U8, U15, U16, U19 | blisters, sprains-and-fractures | no |
| 11 | Water | "May tubig ba sa Ulap?" | U15, U17, U19 | dehydration | no |
| 12 | Closures and current status (2026) | "Bukas ba ang Ulap ngayon?" | U3, U4, U6, U10, U12 | — | yes |
| 13 | Fire rules (smoke-free) | "Pwede bang mag-yosi o magsiga?" | U5, U10, U19 | — | yes (fines) |
| 14 | Wind, cold, fog and lightning | "Malamig ba sa Ulap? Paano pag kumikidlat?" | U15, U17, U19, S10 | hypothermia, lightning, lost-on-the-trail | no |
| 15 | Emergency contacts and hospitals | "Sino tatawagan pag may emergency?" | U2, U8, U22, S23 | — | yes |
| 16 | Mobile signal | "May signal ba sa Ulap?" | U15, U17, U19 | — | no |

## 7. Licensing notes

**Bottom line:** OSM data and Philippine laws can be bundled. IFRC can be adapted for a non-commercial app with credit. CDC and NWS are public domain. Everything else (blogs, news, PRC, Wikipedia prose, LNT text) must be paraphrased or properly attributed, and no copyrighted text should ship verbatim.

| Source class | Can it be bundled in the Destination Pack? | Required action / attribution |
|---|---|---|
| **OpenStreetMap** (B2, P11, U8) and Protomaps tiles derived from it | **Yes**: geometry, names, elevations | ODbL 1.0. Show "© OpenStreetMap contributors" on the map and in an About screen, with a link to openstreetmap.org/copyright. If the team publishes a modified database (e.g. corrected Waypoints), it must also be ODbL (share-alike). Do not import blog-derived data back into OSM without permission. |
| **DENR-CAR news releases** (P15–P19) | Facts yes; paraphrase text | Government works, no copyright (RA 8293 s.176). Credit "DENR-CAR". |
| **Itogon LGU pages** (U2–U6, U14) | Facts and official phone numbers yes | Government works. Credit "Municipality of Itogon". Re-check numbers before each release. |
| **Philippine laws and EOs** (RA 11685, RA 11038, RA 7234, EO 56, RA 8293) | **Yes** | No copyright (RA 8293 s.175, s.176). Cite the law number. Prefer the Official Gazette as canonical; LawPhil is only a host. |
| **PAGASA, DOH, PNA, LGU pages** (S12, S13, S15, U2–U6) | Facts yes; text should be paraphrased | Government works have no copyright (RA 8293 s.176.1), but use "for profit" needs the agency's prior approval. A free hackathon app is fine; paraphrase and credit "Source: PAGASA" etc. |
| **IFRC Guidelines 2020** (S1) | **Yes, non-commercial**, adapted into Guides | "Adapted from IFRC International First Aid, Resuscitation and Education Guidelines 2020." Commercial release needs permission from IFRC. |
| **CDC, NWS, USFS, NPS** (S7–S11, S18, S19) | Yes | Public domain. Credit the agency, do not imply endorsement, do not alter the substance while still calling it CDC/NWS guidance, no logos. |
| **WHO** (S3, S17) | Paraphrase | WHO terms of use; IRIS documents usually CC BY-NC-SA 3.0 IGO (verify). |
| **Philippine Red Cross** (S2) | No text to bundle | All rights reserved. "Reviewed against Philippine Red Cross first-aid training content" is a claim the team can make only after an actual review. Do not use the PRC logo. |
| **Leave No Trace** (S21) | Only with conditions | The principle text is copyrighted. If shown verbatim: call them "principles", not "rules"; do not reorder or alter them; put "© Leave No Trace: www.LNT.org" directly below. LNT asks businesses to become partners first. **Safest:** paraphrase the ideas in our own words, without the LNT name as a heading, and link to lnt.org, or email info@LNT.org for permission before the demo. |
| **Wikipedia** (B1, P2) | Paraphrase facts | CC BY-SA 4.0. Verbatim or adapted text requires attribution and share-alike licensing of that passage. Facts paraphrased in our own words need no license, but cite as a courtesy. |
| **Blogs and news** (Pinoy Mountaineer, Transit Pinas, LakbayPinas, Hike To Mountains, A Wanderful Sole, waypoints.ph, Inquirer, SunStar, Tribune, Manila Bulletin) | **No verbatim text, photos or maps** | All rights reserved. Use as fact leads only; write passages from scratch and cite the source ID in passage metadata. waypoints.ph explicitly forbids public reproduction. |

**OSM data hygiene:** exclude node 13408262905 (inappropriately named viewpoint near Itogon). Treat duplicate Ulap summit nodes (5235980108, 7101485014), duplicate Gungal Rock nodes (6284089886, 7101485013) and the Pulag node tagged `fixme=verify placement` (4559629191) as needing review before import.

**Passage drafts:** Pulag and Ulap passages in `content/destinations/<slug>/passages/` follow these rules: facts only from this file, cited by ID; no first-aid steps (ADR 0003); Filipino text drafted by AI and needs a native speaker's review. Each Destination folder has a `SOURCES.md` with the attribution lines.

**Passage metadata suggestion** (for the Admin Portal): `sources: [B2, B3]`, `verified_on: 2026-10-10`, `time_sensitive: true|false`. The Assistant's source chips can show the source name, so attribution travels with every answer.
