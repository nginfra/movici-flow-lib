import vue from 'rollup-plugin-vue2';
import node from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import babel from 'rollup-plugin-babel';
import alias from '@rollup/plugin-alias';
// import typescript from 'rollup-plugin-typescript2';
// import scss from 'rollup-plugin-scss';
// import typescript from 'rollup-plugin-typescript2';
const capitalize = s => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const lowercase = s => {
  if (typeof s !== 'string') return '';
  return s.toLowerCase();
};

const baseFolder = './src/';
const componentsFolder = 'components/js/';
const components = ['Action', 'ActionBar', 'ActionMenu', 'LanguagePicker', 'TooltipInfo'];
const external = [
  'lodash',
  'axios',
  'vue',
  'vue-class-component',
  'vue-router',
  'vue-i18n',
  'proj4',
  'reproject'
];

const aliasConfig = { entries: [{ find: /^@\/(.+)/, replacement: './src/$1' }] };

const scssConfig = {
  prefix: `@import "./src/assets/sass/variables.scss";`
};

const vuePluginConfig = {};

const babelConfig = {
  exclude: 'node_modules/**',
  runtimeHelpers: true,
  babelrc: false,
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: ['@babel/plugin-proposal-optional-chaining']
};

const entries = {
  // main file in js
  index: './src/index.js',
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
          globals: {
            vue: 'Vue'
          }
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
      input: 'src/index.js',
      external,
      output: {
        format: 'umd',
        name: capitalize('flow'),
        file: 'dist/flow.js',
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
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
      input: 'src/index.js',
      external,
      output: {
        format: 'esm',
        file: 'dist/flow.esm.js'
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
