// Mt. Batulao (Nasugbu, Batangas): Trails and Waypoints for Tahak.
// Run:  curl -s -A "tahak-content" --data-urlencode data@queries/batulao.overpassql \
//         https://overpass-api.de/api/interpreter -o raw/overpass.json
// Output: JSON with `out meta geom`, so every way carries its node ids, geometry,
// version and timestamp, and every node carries its tags and timestamp.
[out:json][timeout:90];

// 1. The hiking route relation "Mt. Batulao New to Old Trail" and its member ways.
relation(3350629)->.route;
.route out meta;
way(r.route)->.members;
.members out meta geom;

// 2. Waypoint candidates around the mountain: the trailhead, peak, springs,
//    drinking water, campsites, information/registration points and the
//    trailside stores (kubo) used for context.
(
  node(14.030,120.795,14.060,120.825)["highway"="trailhead"];
  node(14.030,120.795,14.060,120.825)["natural"~"^(peak|spring)$"];
  node(14.030,120.795,14.060,120.825)["amenity"~"^(drinking_water|toilets)$"];
  node(14.030,120.795,14.060,120.825)["tourism"~"^(camp_site|information)$"];
  way(14.030,120.795,14.060,120.825)["tourism"="camp_site"];
  node(14.030,120.795,14.060,120.825)["shop"~"^(ticket|beverages|convenience)$"];
);
out meta center;
