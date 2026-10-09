// Copies assets/map/ (glyphs and sprites for the Hike map, built by
// scripts/build-map-assets.py) into the APK's assets, where MapLibre reads them through
// asset://map/... URLs. Bundling them is what lets map labels and icons render with no
// network at all (ADR 0002); a require()d asset would come from Metro over HTTP in a dev build.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withMapAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const from = path.join(cfg.modRequest.projectRoot, 'assets', 'map');
      const to = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets', 'map');
      fs.rmSync(to, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.cpSync(from, to, { recursive: true });
      return cfg;
    },
  ]);
};
