import vue from 'rollup-plugin-vue';
import node from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import alias from '@rollup/plugin-alias';
import ts from 'rollup-plugin-typescript2';

const lowercase = s => {
    if (typeof s !== 'string') return '';
    return s.toLowerCase();
  },
  baseFolder = './src/',
  componentsFolder = 'components/',
  distFolder = 'flow_module',
  components = {
    Action: baseFolder + componentsFolder + 'global/Action.vue'
    // ActionBar: baseFolder + componentsFolder + 'global/ActionBar.vue',
    // ActionMenu: baseFolder + componentsFolder + 'global/ActionMenu.vue',
    // LanguagePicker: baseFolder + componentsFolder + 'global/LanguagePicker.vue',
    // TooltipInfo: baseFolder + componentsFolder + 'global/TooltipInfo.vue',
    // Deck: baseFolder + componentsFolder + 'map/Deck.vue',
    // MapVis: baseFolder + componentsFolder + 'map/MapVis.vue'
    // FlowMain: baseFolder + componentsFolder + 'FlowMain.vue',
    // FlowProjects: baseFolder + componentsFolder + 'FlowProjects.vue',
    // FlowDatasets: baseFolder + componentsFolder + 'FlowDatasets.vue',
    // FlowScenario: baseFolder + componentsFolder + 'FlowScenario.vue',
    // FlowVisualization: baseFolder + componentsFolder + 'FlowVisualization.vue',
    // FlowExport: baseFolder + componentsFolder + 'FlowExport.vue'
  },
  external = [
    'vue',
    'vue-router',
    'vue-i18n',
    'vuex',
    'lodash',
    'axios',
    'proj4',
    'reproject',
    'mapbox-gl',
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/aggregation-layers'
  ],
  globals = {
    vue: 'Vue',
    'vue-i18n': 'VueI18n',
    'vue-property-decorator': 'vuePropertyDecorator',
    axios: 'axios',
    proj4: 'proj4',
    reproject: 'reproject',
    'mapbox-gl': 'mapboxgl',
    '@deck.gl/core': 'DeckGL'
  },
  nodeConfig = {
    extensions: ['.vue', '.js'],
    browser: true
  },
  tsConfig = {
    typescript: require('typescript'),
    module: 'esnext',
    target: 'es2019'
    // tsconfig: 'tsconfig.json'
  },
  aliasConfig = {
    entries: [{ find: /^@\/(.+)/, replacement: './src/$1' }]
  },
  scssConfig = {},
  vuePluginConfig = {
    css: true,
    data: {
      scss: `@import "./src/assets/sass/variables.scss";`
    }
  },
  plugins = [
    ts(tsConfig),
    vue(vuePluginConfig),
    // scss(scssConfig),
    alias(aliasConfig),
    node(nodeConfig),
    cjs()
  ];

export default () => {
  const mapComponent = (name, input) => {
    return [
      {
        input,
        external,
        output: {
          name,
          format: 'umd',
          file: `${distFolder}/components/${lowercase(name)}.js`,
          exports: 'named',
          globals
        },
        plugins
      }
    ];
  };

  const config = [
    {
      input: 'src/main.ts',
      external,
      output: {
        format: 'esm',
        file: `${distFolder}/flow.esm.js`,
        inlineDynamicImports: true,
        globals
      },
      plugins
    }
    // individual components
    // ...Object.entries(components)
    //   .map(([name, path]) => mapComponent(name, path))
    //   .reduce((r, a) => r.concat(a), [])
  ];

  return config;
};
