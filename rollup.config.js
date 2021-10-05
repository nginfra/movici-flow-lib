import vue from 'rollup-plugin-vue2';
import node from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import babel from 'rollup-plugin-babel';
import alias from '@rollup/plugin-alias';
// import typescript from 'rollup-plugin-typescript2';
// import scss from 'rollup-plugin-scss';
// import typescript from 'rollup-plugin-typescript2';
const capitalize = s => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  lowercase = s => {
    if (typeof s !== 'string') return '';
    return s.toLowerCase();
  },
  baseFolder = './src/',
  componentsFolder = 'components/js/',
  components = [
    'Action',
    'ActionBar',
    'ActionMenu',
    'LanguagePicker',
    'TooltipInfo',
    'Deck',
    'MapVis',
    'FlowMain',
    'FlowProjects',
    'FlowDatasets',
    'FlowScenario',
    'FlowVisualization',
    'FlowExport'
  ],
  external = [
    'lodash',
    'axios',
    'vue',
    'vue-class-component',
    'vue-router',
    'vue-i18n',
    'proj4',
    'reproject'
  ],
  globals = {
    axios: 'Axios',
    vue: 'Vue',
    proj4: 'proj4',
    reproject: 'reproject',
    'vue-i18n': 'VueI18n'
  },
  aliasConfig = { entries: [{ find: /^@\/(.+)/, replacement: './src/$1' }] },
  scssConfig = {
    prefix: `@import "./src/assets/sass/variables.scss";`
  },
  vuePluginConfig = {},
  babelConfig = {
    exclude: 'node_modules/**',
    runtimeHelpers: true,
    babelrc: false,
    presets: ['@vue/cli-plugin-babel/preset'],
    plugins: ['@babel/plugin-proposal-optional-chaining', '@babel/plugin-syntax-dynamic-import']
  },
  entries = {
    // main file in js
    index: './src/main.js',
    // components
    ...components.reduce((obj, name) => {
      obj[name] = baseFolder + componentsFolder + lowercase(name);
      return obj;
    }, {})
  };

export default () => {
  const mapComponent = name => {
    return [
      {
        input: baseFolder + componentsFolder + `${name}`,
        external,
        output: {
          format: 'umd',
          name: capitalize(name),
          file: `dist/components/${lowercase(name)}/index.js`,
          exports: 'named',
          globals
        },
        plugins: [
          vue(vuePluginConfig),
          scss(scssConfig),
          alias(aliasConfig),
          babel(babelConfig),
          node({
            extensions: ['.vue', '.js']
          }),
          cjs()
        ]
      }
    ];
  };

  const config = [
    {
      input: entries,
      external,
      output: {
        format: 'esm',
        dir: `dist/esm`
      },
      plugins: [
        vue(vuePluginConfig),
        scss(scssConfig),
        alias(aliasConfig),
        babel(babelConfig),
        node({
          extensions: ['.vue', '.js']
        }),
        cjs()
      ]
    },
    {
      input: entries,
      external,
      output: {
        format: 'cjs',
        dir: 'dist/cjs',
        exports: 'named'
      },
      plugins: [
        vue(vuePluginConfig),
        scss(scssConfig),
        alias(aliasConfig),
        babel(babelConfig),
        node({
          extensions: ['.vue', '.js']
        }),
        cjs()
      ]
    },
    {
      input: 'src/main.js',
      external,
      output: {
        format: 'esm',
        file: 'dist/flow.esm.js',
        inlineDynamicImports: true
      },
      plugins: [
        vue(vuePluginConfig),
        scss(scssConfig),
        alias(aliasConfig),
        babel(babelConfig),
        node({
          extensions: ['.vue', '.js']
        }),
        cjs()
      ]
    },
    // individual components
    ...components.map(f => mapComponent(f)).reduce((r, a) => r.concat(a), [])
  ];

  return config;
};
