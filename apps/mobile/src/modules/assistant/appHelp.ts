// App-written help and topic passages for the Assistant's search corpus (ADR 0005). They let
// in-scope questions about the app, trail food, packing, transport, weather and local culture
// pass the relevance gate even when no Destination Pack covers them. They are general advice
// written by the app team, not facts about any Destination, and their source says so.
// Medical and emergency steps are deliberately absent: those come only from the reviewed
// Guides (ADR 0003). Model-facing content, not UI text. Pure data.

import type { HelpPassage } from './corpus';

export const APP_HELP: readonly HelpPassage[] = [
  {
    id: 'download-pack',
    title: { en: 'Downloading a Destination Pack', fil: 'Pag-download ng Destination Pack' },
    text: {
      en: 'To use a Destination offline, download its Destination Pack while you still have signal. Open the Explore tab, tap the Destination, then tap "Download for offline use". A progress bar shows the download. When it finishes, a small cloud-off icon appears next to the name: the map, Trails, Waypoints and reference info now work in airplane mode. If a newer version exists, the button says "Download the update".',
      fil: 'Para magamit ang isang Destination kahit walang signal, i-download ang Destination Pack nito habang may internet ka pa. Buksan ang Tuklasin tab, i-tap ang Destination, tapos i-tap ang "I-download para sa offline". May progress bar habang nagda-download. Pag tapos na, may lalabas na maliit na cloud-off icon sa tabi ng pangalan: gagana na offline ang mapa, mga Trail, Waypoint at reference info. Kung may bagong version, "I-download ang update" ang nakasulat sa button.',
    },
  },
  {
    id: 'offline',
    title: { en: 'What works offline', fil: 'Ano ang gumagana offline' },
    text: {
      en: 'Tahak is built for the trail, where there is often no signal. Once a Destination Pack is downloaded, the offline map, your GPS position, the Hike, Deviation alerts, the Guide Library, the Flare and the Assistant all work in airplane mode. Downloading packs and updates needs internet. GPS works without signal.',
      fil: 'Ginawa ang Tahak para sa trail, kung saan madalas walang signal. Pag na-download mo na ang Destination Pack, gagana kahit naka-airplane mode ang offline na mapa, ang GPS position mo, ang Hike, ang Deviation alert, ang Guide Library, ang Flare at ang Assistant. Kailangan lang ng internet para mag-download ng pack at update. Gumagana ang GPS kahit walang signal.',
    },
  },
  {
    id: 'hike',
    title: { en: 'Starting and ending a Hike', fil: 'Pag-start at pag-end ng Hike' },
    text: {
      en: 'Open the Hike tab, pick a Trail on the Trail picker card and tap "Start Hike". The map follows you, and a panel at the bottom shows the next Waypoint with its distance and ETA, and your progress along the Trail. When you are done, tap "End Hike". A Hike is one trip on one Trail, from start to end.',
      fil: 'Buksan ang Akyat tab, pumili ng Trail sa Trail picker card, at i-tap ang "Simulan ang Hike". Susundan ka ng mapa, at may panel sa baba na nagpapakita ng susunod na Waypoint, gaano pa kalayo at ang ETA, at ang progress mo sa Trail. Pag tapos ka na, i-tap ang "Tapusin ang Hike". Ang isang Hike ay isang biyahe sa isang Trail, mula simula hanggang dulo.',
    },
  },
  {
    id: 'deviation',
    title: { en: 'Deviation alerts (off the Trail)', fil: 'Deviation alert (lumihis sa Trail)' },
    text: {
      en: 'During a Hike, Tahak watches whether you stay on the Trail. If you are more than 40 m off the Trail for more than 30 seconds, that is a Deviation: the phone vibrates, plays an alert sound and shows a notification, a red banner appears with an arrow pointing back to the Trail, and the Trail line turns dashed. Follow the arrow. The alert clears once you are back within 30 m.',
      fil: 'Habang naka-Hike ka, binabantayan ng Tahak kung nasa Trail ka pa. Kapag lumayo ka nang higit 40 m sa Trail nang mahigit 30 segundo, Deviation na iyon: magba-vibrate ang phone, tutunog ang alert, may lalabas na notification, may pulang banner na may arrow pabalik sa Trail, at magiging putol-putol ang linya ng Trail. Sundan lang ang arrow. Mawawala ang alert pag nakabalik ka na sa loob ng 30 m.',
    },
  },
  {
    id: 'flare',
    title: { en: 'The Flare (SOS signal)', fil: 'Ang Flare (SOS signal)' },
    text: {
      en: 'The Flare is a local distress signal for when you need people nearby to find you. The SOS control is at the top right of every screen. Fire it with a slide or a long press, not a tap, so it does not go off by accident. It flashes SOS on the flashlight, strobes the screen and plays a loud whistle tone. It does not send a message or call anyone, so it only helps people who can see or hear you.',
      fil: 'Ang Flare ay lokal na distress signal para mahanap ka ng mga taong malapit sa iyo. Nasa kanang itaas ng bawat screen ang SOS control. Pinapagana ito sa pag-slide o long press, hindi sa tap, para hindi aksidenteng tumunog. Magfa-flash ng SOS ang flashlight, kikislap ang screen at tutunog ang malakas na sipol. Hindi ito nagte-text o tumatawag, kaya ang makakatulong lang ay ang mga taong nakakakita o nakakarinig sa iyo.',
    },
  },
  {
    id: 'guides',
    title: { en: 'The Guide Library', fil: 'Ang Guide Library' },
    text: {
      en: 'The Guides tab holds the Guide Library: step-by-step Guides for emergencies and first aid, such as snakebite, bleeding wounds, sprains and fractures, hypothermia, heatstroke, dehydration and getting lost, plus camp skills like pitching a tent and purifying water. The Guides ship inside the app, so they work offline before anything is downloaded. Emergency Guides have a red icon.',
      fil: 'Nasa Mga gabay tab ang Guide Library: mga step-by-step na Guide para sa emergency at first aid, gaya ng kagat ng ahas, sugat na dumudugo, pilay at bali, hypothermia, heatstroke, dehydration at pagkaligaw, pati camp skills tulad ng pagtayo ng tent at paglinis ng tubig. Kasama na ang mga Guide sa app, kaya gumagana offline kahit wala ka pang na-download. Pula ang icon ng mga Emergency Guide.',
    },
  },
  {
    id: 'assistant',
    title: { en: 'Asking the Assistant', fil: 'Pagtatanong sa Assistant' },
    text: {
      en: 'The Assistant in the Ask tab answers questions about hiking and camping, outdoor first aid, gear, trail weather, your Destination, trail food, getting to the jump-off, local culture and using Tahak. It runs on your phone, so it works offline, and it answers from your Destination Pack, the Guide Library and the app help. Tap a source chip under an answer to see where it came from. You can ask in English, Filipino or Taglish. Answers are in English, or in Taglish when the app language is Filipino.',
      fil: 'Ang Assistant sa Magtanong tab ay sumasagot tungkol sa hiking at camping, first aid sa labas, gamit, panahon sa trail, ang Destination mo, pagkain sa trail, pagpunta sa jump-off, lokal na kultura at paggamit ng Tahak. Tumatakbo ito sa phone mo kaya gumagana offline, at sumasagot ito mula sa Destination Pack, Guide Library at app help. I-tap ang source chip sa ilalim ng sagot para makita kung saan galing. Puwede kang magtanong sa English, Filipino o Taglish. English ang sagot, o Taglish kapag Filipino ang wika ng app.',
    },
  },
  {
    id: 'settings',
    title: { en: 'Language and theme settings', fil: 'Setting ng wika at tema' },
    text: {
      en: 'Tap Settings in the header to change the app language (English or Filipino) and the theme (Day or Night). Changes apply right away and are remembered. The Assistant answers in English when the app is in English, and in Taglish when it is in Filipino.',
      fil: 'I-tap ang Mga setting sa header para palitan ang wika ng app (English o Filipino) at ang tema (Araw o Gabi). Agad itong nag-a-apply at naaalala ng app. English ang sagot ng Assistant kapag English ang app, at Taglish kapag Filipino.',
    },
  },
  {
    id: 'food',
    title: { en: 'What to eat before and during a climb', fil: 'Ano ang kakainin bago at habang umaakyat' },
    text: {
      en: 'General advice: eat a proper meal with rice, bread or other carbohydrates a few hours before the climb, and a light snack just before you start. On the trail, eat small amounts often: trail mix, nuts, bananas, bread, biscuits, chocolate or energy bars. Bring packed rice meals for longer hikes. Salty snacks or electrolyte drinks help replace what you sweat out. Avoid heavy, oily food right before a steep climb.',
      fil: 'Pangkalahatang payo: kumain ng maayos na meal na may kanin, tinapay o ibang carbs ilang oras bago umakyat, at light snack bago mag-start. Sa trail, kumain nang paunti-unti pero madalas: trail mix, mani, saging, tinapay, biskwit, tsokolate o energy bar. Magbaon ng packed rice meal kung mahaba ang hike. Nakakatulong ang maaalat na snack o electrolyte drink para mapalitan ang nawawala sa pawis. Iwasan ang mabigat at mamantikang pagkain bago ang matarik na akyat.',
    },
  },
  {
    id: 'packing',
    title: { en: 'What to bring on a hike', fil: 'Ano ang dadalhin sa hike' },
    text: {
      en: 'General packing list for a day hike: enough water (at least 2 litres, more in hot weather), trail food, a cap and sunscreen, a rain jacket or poncho, a headlamp with spare batteries, a small first-aid kit, a whistle, a fully charged phone and a power bank, cash for fees, a valid ID, a trash bag to pack out your trash, and shoes with good grip. Wear quick-dry clothes, not cotton. For an overnight camp add a tent, a sleeping bag or blanket, warm clothes and a stove.',
      fil: 'Pangkalahatang listahan para sa day hike: sapat na tubig (at least 2 litro, mas marami kapag mainit), pagkain para sa trail, cap at sunscreen, rain jacket o poncho, headlamp na may extra na baterya, maliit na first-aid kit, pito, fully charged na phone at power bank, cash para sa fees, valid ID, trash bag para iuwi ang basura mo, at sapatos na makapit. Magsuot ng quick-dry na damit, hindi cotton. Kung mag-o-overnight camp, dagdagan ng tent, sleeping bag o kumot, pangginaw at stove.',
    },
  },
  {
    id: 'jump-off',
    title: { en: 'Getting to the jump-off', fil: 'Pagpunta sa jump-off' },
    text: {
      en: 'General advice: the jump-off is where a Trail starts, usually where you register. Plan to arrive early, since registration and the cooler morning hours matter. Commuters usually take a provincial bus toward the town nearest the mountain, then a tricycle or jeepney to the jump-off; ask the driver or conductor where to get off. Private vehicles may need to pay for parking. Check your Destination Pack for the exact route, and allow extra time for traffic.',
      fil: 'Pangkalahatang payo: ang jump-off ay kung saan nagsisimula ang Trail, at kadalasan doon ka magre-register. Pumunta nang maaga, dahil mahalaga ang registration at ang mas malamig na umaga. Ang mga nagko-commute ay karaniwang sumasakay ng provincial bus papunta sa bayan na malapit sa bundok, tapos tricycle o jeep papuntang jump-off; tanungin ang driver o konduktor kung saan bababa. Baka may bayad ang parking kung may sariling sasakyan. Tingnan ang Destination Pack mo para sa eksaktong ruta, at maglaan ng dagdag na oras para sa traffic.',
    },
  },
  {
    id: 'weather',
    title: { en: 'Weather on the trail', fil: 'Panahon sa trail' },
    text: {
      en: 'General advice: start early, because open trails get very hot by late morning. In the rainy season (roughly June to November) trails turn muddy and slippery and afternoon thunderstorms are common, so bring rain gear and turn back if a storm builds. Get off exposed ridges and summits when you hear thunder. Do not hike during a typhoon or heavy rainfall warning. Check the forecast before you lose signal.',
      fil: 'Pangkalahatang payo: mag-start nang maaga, dahil sobrang init na sa open trail pagdating ng tanghali. Sa tag-ulan (mga Hunyo hanggang Nobyembre) madulas at maputik ang trail at madalas ang kulog at ulan sa hapon, kaya magdala ng rain gear at bumalik kung may paparating na bagyo. Bumaba mula sa ridge at summit kapag may kulog. Huwag mag-hike kapag may bagyo o heavy rainfall warning. Tingnan ang forecast bago ka mawalan ng signal.',
    },
  },
  {
    id: 'camping',
    title: { en: 'Camping basics and Leave No Trace', fil: 'Basics ng camping at Leave No Trace' },
    text: {
      en: 'General advice: camp only at designated campsites, and pitch your tent on flat ground away from cliff edges and dry stream beds. Pack out all your trash, including food scraps. Keep noise down at night, do not cut trees or plants, and use a stove instead of an open fire where fires are not allowed. Bring a warm layer: it gets cold on mountains at night even in the tropics.',
      fil: 'Pangkalahatang payo: mag-camp lang sa designated na campsite, at itayo ang tent sa patag na lugar na malayo sa bangin at tuyong daluyan ng tubig. Iuwi lahat ng basura mo, pati tirang pagkain. Huwag maingay sa gabi, huwag pumutol ng puno o halaman, at gumamit ng stove imbes na bonfire kung bawal ang apoy. Magdala ng pangginaw: malamig sa bundok sa gabi kahit tropical ang bansa.',
    },
  },
  {
    id: 'culture',
    title: { en: 'Local culture and trail etiquette', fil: 'Lokal na kultura at trail etiquette' },
    text: {
      en: 'General advice: register at the barangay or tourism office and follow their rules; fees support the local community. Greet residents and ask permission before entering private land or taking photos of people. Hire local guides where required, and agree on the price first. Respect sacred or historic sites and any local customs. Buy food and drinks from local stores and huts. On the trail, give way to hikers coming up.',
      fil: 'Pangkalahatang payo: mag-register sa barangay o tourism office at sundin ang rules nila; nakakatulong sa lokal na komunidad ang fees. Bumati sa mga residente at magpaalam bago pumasok sa pribadong lupa o kumuha ng litrato ng tao. Kumuha ng local guide kung required, at pag-usapan muna ang presyo. Igalang ang mga sagrado o makasaysayang lugar at mga lokal na kaugalian. Bumili ng pagkain at inumin sa mga lokal na tindahan at kubo. Sa trail, paunahin ang mga paakyat.',
    },
  },
  {
    id: 'water',
    title: { en: 'How much water to bring', fil: 'Gaano karaming tubig ang dadalhin' },
    text: {
      en: 'General advice: bring at least 2 litres of water for a half-day hike in the Philippines, and 3 litres or more for hot, exposed trails or a full day. Drink small amounts often instead of a lot at once. Do not count on water sources on the trail unless your Destination Pack says there is reliable water, and treat any stream or spring water before drinking it. Electrolyte drinks help on hot days.',
      fil: 'Pangkalahatang payo: magdala ng at least 2 litrong tubig para sa kalahating araw na hike sa Pilipinas, at 3 litro o higit pa kung mainit at walang lilim ang trail o buong araw ang akyat. Uminom nang paunti-unti pero madalas. Huwag umasa sa water source sa trail maliban kung sinasabi ng Destination Pack mo na maaasahan ito, at linisin muna ang tubig mula sa sapa o bukal bago inumin. Nakakatulong ang electrolyte drink kapag mainit.',
    },
  },
  {
    id: 'fitness',
    title: { en: 'Preparing for a climb and pacing', fil: 'Paghahanda sa akyat at tamang bilis' },
    text: {
      en: 'General advice: sleep well the night before and tell someone your plan and expected return time. Walk at a pace where you can still talk, rest briefly every 30 to 45 minutes, and keep the group together with the slowest hiker setting the pace. Turn back if the weather turns bad, if you run low on water, or if someone in the group is not feeling well. Reaching the summit is optional; getting home is not.',
      fil: 'Pangkalahatang payo: matulog nang maayos bago ang akyat at sabihin sa isang tao ang plano mo at kung kailan ka babalik. Maglakad sa bilis na kaya mo pang makipag-usap, magpahinga sandali kada 30 hanggang 45 minuto, at sabay-sabay ang grupo, ang pinakamabagal ang nagse-set ng pace. Bumalik kung sumama ang panahon, paubos na ang tubig, o may masama ang pakiramdam sa grupo. Optional ang summit; ang importante ay makauwi.',
    },
  },
];
