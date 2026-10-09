// Builds native code for arm64-v8a only (the Galaxy Z Flip 6 ABI).
// Keeps the APK and the build cache small; disk space on the build machine is tight.
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withArm64Only(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures'),
    );
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: 'arm64-v8a' });
    return cfg;
  });
};
