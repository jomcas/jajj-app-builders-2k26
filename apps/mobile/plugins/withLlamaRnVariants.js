// llama.rn 0.13.0-rc.7 compiles llama.cpp from source (its own gradle.properties sets
// rnllamaBuildFromSource=true because the bundled prebuilt libraries are out of date), and by
// default it compiles the whole tree once per CPU variant: eight times. That does not fit on
// the build machine's disk, so build only the two the Galaxy Z Flip 6 needs:
// - rnllama_v8_2_dotprod_i8mm_hexagon_opencl: what llama.rn loads on a Snapdragon with an
//   Adreno GPU and dotprod + i8mm (the 8 Gen 3), with the OpenCL GPU backend;
// - rnllama: the generic library, which llama.rn always loads as well.
// Phones without those features would fall back to the generic library only.
const { withGradleProperties } = require('expo/config-plugins');

const VARIANTS = 'rnllama,rnllama_v8_2_dotprod_i8mm_hexagon_opencl';

module.exports = function withLlamaRnVariants(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'rnllamaVariants'),
    );
    cfg.modResults.push({ type: 'property', key: 'rnllamaVariants', value: VARIANTS });
    return cfg;
  });
};
