// Mt. Pulag (Kabayan and Bokod, Benguet): the Ambangeg Trail and its Waypoints for Tahak.
// Run:  curl -s -A "tahak-content" --data-urlencode data@queries/pulag.overpassql \
//         https://overpass-api.de/api/interpreter -o raw/overpass.json
// Output: JSON with `out meta geom`, so every way carries its node ids, geometry,
// version and timestamp, and every node carries its tags and timestamp.
// Hiking route relations in the area are pulled too, in case one covers Ambangeg.
[out:json][timeout:120];

// 1. Hiking route relations around the summit.
relation(16.50,120.82,16.64,120.94)["route"~"^(hiking|foot)$"];
out meta;

// 2. Footpaths, tracks and minor roads from the DENR Visitor Center in Ambangeg to the summit.
way(16.50,120.82,16.64,120.94)["highway"~"^(path|footway|track|steps|unclassified|residential|service|tertiary)$"];
out meta geom;

// 3. Waypoint candidates: trailheads, ranger stations, peaks, springs, water, campsites,
//    huts, toilets and information points.
(
  node(16.50,120.82,16.64,120.94)["highway"="trailhead"];
  node(16.50,120.82,16.64,120.94)["natural"~"^(peak|spring|saddle)$"];
  node(16.50,120.82,16.64,120.94)["amenity"~"^(drinking_water|toilets|ranger_station|townhall|water_point)$"];
  node(16.50,120.82,16.64,120.94)["tourism"~"^(camp_site|information|viewpoint|alpine_hut|wilderness_hut|guest_house)$"];
  way(16.50,120.82,16.64,120.94)["tourism"~"^(camp_site|information)$"];
  way(16.50,120.82,16.64,120.94)["amenity"="ranger_station"];
  node(16.50,120.82,16.64,120.94)["waterway"];
);
out meta center;
