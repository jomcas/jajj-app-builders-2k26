// Mt. Ulap (Itogon, Benguet): Trails and Waypoints for Tahak.
// Run:  curl -s -A "tahak-content" --data-urlencode data@queries/ulap.overpassql \
//         https://overpass-api.de/api/interpreter -o raw/overpass.json
// Output: JSON with `out meta geom`, so every way carries its node ids, geometry,
// version and timestamp, and every node carries its tags and timestamp.
// OSM has no route relation for the Eco-Trail, so every footpath and track in the
// area is pulled and the Trail is chained from named ways in scripts/build_geojson.py.
[out:json][timeout:90];

// 1. Footpaths, tracks and minor roads around the ridge (Ampucao to Sta. Fe).
way(16.255,120.605,16.345,120.670)["highway"~"^(path|footway|track|steps|unclassified|residential|service)$"];
out meta geom;

// 2. Waypoint candidates: the barangay hall, peaks, viewpoints, springs, water,
//    campsites, huts, toilets and information points.
(
  node(16.255,120.605,16.345,120.670)["highway"="trailhead"];
  node(16.255,120.605,16.345,120.670)["natural"~"^(peak|spring)$"];
  node(16.255,120.605,16.345,120.670)["amenity"~"^(drinking_water|toilets|townhall)$"];
  node(16.255,120.605,16.345,120.670)["tourism"~"^(camp_site|information|viewpoint|alpine_hut)$"];
  way(16.255,120.605,16.345,120.670)["tourism"="camp_site"];
);
out meta center;
