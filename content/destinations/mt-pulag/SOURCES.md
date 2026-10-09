# Mt. Pulag passage sources

Source IDs match [docs/research/rag-sources.md](../../../docs/research/rag-sources.md) (Sections 3 and 5). P26 to P32 were added on 2026-10-10 for the Destination Pack (#22). All passages are paraphrased; no source text is copied. `content/pulag/scripts/build_seed.py` reads this table: the ID, Title, Publisher, URL and Published columns go into each passage's `sources`.

Filipino text drafted by AI; needs review by a native speaker before shipping.

**Trust.** The Benguet Provincial Tourism page (P26) is the only official source for current fees and guide rates, and it's a provincial page, not a DENR or PAMO notice. Current booking, visitor cap and camping rules still come from blogs (P21, P22) and one trip report (P28). Passages always say who reported what and when. P31 returned HTTP 403 and was read only through search-engine excerpts.

| ID | Title | Publisher | URL | Published | Attribution line required |
|---|---|---|---|---|---|
| P1 | Republic Act No. 11685, Mt. Pulag Protected Landscape Act (2022) | Republic of the Philippines (text via LawPhil) | https://lawphil.net/statutes/repacts/ra2022/ra_11685_2022.html | 2022-04-08 | None required (government work, RA 8293 s.176); cite as "RA 11685". |
| P2 | Mount Pulag | Wikipedia contributors | https://en.wikipedia.org/wiki/Mount_Pulag | 2026-08-15 | Facts only, paraphrased. If any text is reused: "Adapted from Wikipedia, Mount Pulag, CC BY-SA 4.0". |
| P3 | Mt. Pulag Ambangeg Trail (2,922+) | Pinoy Mountaineer | https://www.pinoymountaineer.com/2007/09/mt-pulag-2922.html | 2015-12-03 | All rights reserved; facts only. Courtesy credit: "Source: Pinoy Mountaineer". |
| P4 | Mt. Pulag/Akiki Trail (2,922+) | Pinoy Mountaineer | https://www.pinoymountaineer.com/2008/02/mt-pulagakiki-trail-2922.html | 2015-10-12 | All rights reserved; facts only. "Source: Pinoy Mountaineer". |
| P6 | Only 120 climbers allowed in Pulag at a time – DENR | SunStar | https://www.sunstar.com.ph/more-articles/only-120-climbers-allowed-in-pulag-at-a-time-denr | 2013-11-22 | All rights reserved; facts only. "Source: SunStar". |
| P7 | Garbage overwhelms Mt. Pulag | Daily Tribune | https://tribune.net.ph/2025/02/20/garbage-overwhelms-mt-pulag | 2025-02-20 | All rights reserved; facts only. "Source: Daily Tribune". |
| P8 | Environment office cautions Pulag hikers | SunStar | https://www.sunstar.com.ph/more-articles/environment-office-cautions-pulag-hikers | 2010-07-29 | All rights reserved; facts only. "Source: SunStar". |
| P11 | OpenStreetMap data (Ambangeg route relation 3625651, camps, springs, hospitals) | OpenStreetMap contributors | https://www.openstreetmap.org/relation/3625651 | 2026-10-09 | **Required:** "© OpenStreetMap contributors" (ODbL 1.0), with a link to openstreetmap.org/copyright. |
| P12 | Mt. Pulag/Tawangan Trail (2,922+) | Pinoy Mountaineer | https://www.pinoymountaineer.com/?p=1307 | 2015-09-06 | All rights reserved; facts only. "Source: Pinoy Mountaineer". |
| P13 | Tales from Mount Pulag: Ambaguio – Akiki Overnight Traverse | Lakwatsero | https://lakwatsero.com/trail-tale/mount-pulag-ambaguio-akiki-overnight-traverse | 2019 | All rights reserved; facts only. "Source: Lakwatsero". |
| P14 | Mt. Pulag re-opens for tourist, midnight trekking prohibited | Gurupress Cordillera | https://www.gurupress-cordillera.com/post/mt-pulag-re-opens-for-tourist-midnight-trekking-prohibited | 2022-06-12 | Terms unknown; facts only. "Source: Gurupress Cordillera". |
| P15 | Moreno personally leads ground assessment in Mt. Pulag | DENR-CAR | https://car.denr.gov.ph/news-events/moreno-personally-leads-ground-assessment-in-mt-pulag/ | 2025 | Government work; "Source: DENR-CAR". |
| P16 | DENR-CAR marks 38th anniversary with cleanup drive at Mt. Pulag | DENR-CAR | https://car.denr.gov.ph/news-events/denr-car-marks-38th-anniversary-with-cleanup-drive-at-mt-pulag/ | 2025-07 | Government work; "Source: DENR-CAR". |
| P17 | DENR-CAR, DepEd-CAR forge landmark deal over Ambangeg site | DENR-CAR | https://car.denr.gov.ph/news-events/denr-car-deped-car-forge-landmark-deal-to-strengthen-unity-and-shared-land-use-over-ambangeg-site/ | 2025-05 | Government work; "Source: DENR-CAR". |
| P19 | Mt. Pulag to be opened for the Altitude OCR World Series Asia | DENR-CAR | https://car.denr.gov.ph/news-events/mt-pulag-to-be-opened-for-the-altitude-ocr-world-series-asia/ | 2022 | Government work; "Source: DENR-CAR". |
| P21 | Mt. Pulag Via Ambangeg Trail: Complete 2026 Hiking Guide (author climbed February 2026) | LakbayPinas | https://lakbaypinas.com/mt-pulag-travel-guide-ambangeg-trail/ | 2026-06-06 | © 2026 LakbayPinas; facts only, low trust. "Source: LakbayPinas". |
| P22 | Mount Pulag Travel Guide 2026 | joanathx | https://joanathx.com/mount-pulag-travel-guide/ | 2026 | Terms unknown; facts only, low trust. "Source: joanathx.com". |
| P25 | PhilHealth accredited hospitals list (2025) | PhilHealth | https://www.philhealth.gov.ph/partners/providers/facilities/accredited/HOSP_053125.pdf | 2025 | Government work; "Source: PhilHealth". |
| P26 | Mt. Pulag (hiking rates, guides and how to get there) | Benguet Provincial Tourism Office | https://tourism.benguet.gov.ph/tourist_spots/mt-pulag/ | 2026-09-15 | Government work; "Source: Benguet Provincial Tourism Office". Published 2026-05-11, updated 2026-09-15. |
| P27 | DENR imposes stricter rules for Mt Pulag trekkers | Rappler | https://www.rappler.com/philippines/122314-denr-imposes-stricter-rules-for-mt-pulag-trekkers/ | 2016-02-13 | All rights reserved; facts only. "Source: Rappler". Quotes a DENR park notice. |
| P28 | Mt. Pulag Overnight Itinerary: Mighty and Spectacular Sea of Clouds (trip report, climbed about November 2025) | Dito Kay Shellan | https://ditokayshellan.com/2025/11/11/mt-pulag-overnight-itinerary-mighty-and-spectacular-sea-of-clouds/ | 2025-11-11 | Terms unknown; facts only, one trip report. "Source: ditokayshellan.com". |
| P29 | Mt. Pulag freezes below zero | The Philippine Star | https://www.philstar.com/headlines/2015/12/29/1537575/mt-pulag-freezes-below-zero | 2015-12-29 | All rights reserved; facts only. "Source: Philstar". |
| P30 | Viewpoint: Mt. Pulag may be the coldest place in the Philippines, but we need a thermometer to say exactly how cold | Pinoy Mountaineer | https://www.pinoymountaineer.com/2013/02/viewpoint-mt-pulag-may-be-coldest-place.html | 2013-02-01 | All rights reserved; facts only. "Source: Pinoy Mountaineer". |
| P31 | Frost hits Mount Pulag; Akiki Trail opens Jan. 9 | Philippine Information Agency | https://pia.gov.ph/news/frost-hits-mount-pulag-akiki-trail-opens-jan-9/ | 2026-01 | Government work; "Source: PIA". Read only through search excerpts (HTTP 403). |
| P32 | Climate of the Philippines | PAGASA (DOST) | https://www.pagasa.dost.gov.ph/information/climate-philippines | undated | Government work; "Source: PAGASA". |
| S9 | High-Altitude Travel and Altitude Illness (CDC Yellow Book 2026) | US Centers for Disease Control and Prevention | https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html | 2025-04-23 | Public domain. "Source: US CDC" (no endorsement implied). |
| S12 | Tropical Cyclone Wind Signal | PAGASA (DOST) | https://www.pagasa.dost.gov.ph/learning-tools/tropical-cyclone-wind-signal | undated | Government work; "Source: PAGASA". |
| S22 | Republic Act No. 11038, Expanded NIPAS Act (2018) | Republic of the Philippines (text via LawPhil) | https://lawphil.net/statutes/repacts/ra2018/ra_11038_2018.html | 2018-06-22 | None required; cite as "RA 11038". |
| S23 | Executive Order No. 56, s. 2018 (Emergency 911) | Republic of the Philippines (text via LawPhil) | https://lawphil.net/executive/execord/eo2018/eo_56_2018.html | 2018-05-25 | None required; cite as "EO 56 s. 2018". |

Sources the earlier drafts used and the passages no longer cite: P5, P9, P10, P20, P23 and P24 (see `rag-sources.md`). P20 (GMA, the December 2024 hypothermia rescue) was dropped for length and can come back if a passage has room.
