'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vuePropertyDecorator = require('vue-property-decorator');
var mapboxgl = require('mapbox-gl');
require('mapbox-gl/dist/mapbox-gl.css');
var core = require('@deck.gl/core');
var upperFirst = require('lodash/upperFirst');
var layers = require('@deck.gl/layers');
var aggregationLayers = require('@deck.gl/aggregation-layers');
var proj4 = require('proj4');
var reproject = require('reproject');
require('lodash/isEmpty');
require('lodash/cloneDeep');
var isEqual = require('lodash/isEqual');
var isError = require('lodash/isError');
var buefy = require('buefy');
var axios = require('axios');
var FlowMain = require('@/components/FlowMain.vue');
var FlowProjects = require('@/components/FlowProjects.vue');
var FlowDatasets = require('@/components/FlowDatasets.vue');
var FlowScenario = require('@/components/FlowScenario.vue');
var FlowVisualization = require('@/components/FlowVisualization.vue');
var FlowExport = require('@/components/FlowExport.vue');
var Vue = require('vue');
var VueI18n = require('vue-i18n');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var mapboxgl__default = /*#__PURE__*/_interopDefaultLegacy(mapboxgl);
var upperFirst__default = /*#__PURE__*/_interopDefaultLegacy(upperFirst);
var proj4__default = /*#__PURE__*/_interopDefaultLegacy(proj4);
var isEqual__default = /*#__PURE__*/_interopDefaultLegacy(isEqual);
var isError__default = /*#__PURE__*/_interopDefaultLegacy(isError);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var FlowMain__default = /*#__PURE__*/_interopDefaultLegacy(FlowMain);
var FlowProjects__default = /*#__PURE__*/_interopDefaultLegacy(FlowProjects);
var FlowDatasets__default = /*#__PURE__*/_interopDefaultLegacy(FlowDatasets);
var FlowScenario__default = /*#__PURE__*/_interopDefaultLegacy(FlowScenario);
var FlowVisualization__default = /*#__PURE__*/_interopDefaultLegacy(FlowVisualization);
var FlowExport__default = /*#__PURE__*/_interopDefaultLegacy(FlowExport);
var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);
var VueI18n__default = /*#__PURE__*/_interopDefaultLegacy(VueI18n);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

/**
 * Shorthand for checking the existence of a property on an object. Use the
 * Object prototype to prevent overridden usage, and potential security issues
 * when performing this on a (user-provided) JSON loaded object
 * @param obj
 * @param property
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasOwnProperty(obj, property) {
    return Object.prototype.hasOwnProperty.call(obj, property);
}
function propertyString(property) {
    const base = property.component ? property.component + '/' : '';
    return base + property.name;
}
function parsePropertyString(val) {
    const parts = val.split('/');
    if (parts.length === 1) {
        return { name: parts[0], component: null };
    }
    if (parts.length === 2) {
        return { component: parts[0], name: parts[1] };
    }
    throw new Error(`Couldn't parse '${val}' as a valid property identifier`);
}
function getEntitySummary(entityType, summary) {
    const index = summary.entity_groups.map(e => e.name).indexOf(entityType);
    if (index === -1) {
        return null;
    }
    return summary.entity_groups[index];
}
function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}
function getBaseURL() {
    return (window.location.protocol +
        '//' +
        window.location.hostname +
        (window.location.port ? `:${window.location.port}` : '') +
        window.location.pathname);
}
/**
 * Receives a scenario status and returns a Bulma class for the color
 * @param status
 */
function getClassFromStatus(status) {
    let statusClass = 'is-';
    switch (status) {
        case 'Failed':
        case 'Unknown':
        case 'Invalid':
        case 'Cancelled':
            statusClass += 'danger';
            break;
        case 'Ready':
        case 'Running':
        case 'Pending':
            statusClass += 'info';
            break;
        case 'Succeeded':
            statusClass += 'primary';
            break;
    }
    return statusClass;
}
function getStatusFromScenarioAndSimulation(scenario, simulation) {
    const allStatuses = ['failed', 'invalid', 'pending', 'running', 'succeeded', 'ready', 'unknown'];
    const scenarioStatus = getStatusOrUnknown(scenario).toLowerCase();
    const simulationStatus = getStatusOrUnknown(simulation).toLowerCase();
    for (let i = 0; i < allStatuses.length; i++) {
        const status = allStatuses[i];
        if (scenarioStatus === status || simulationStatus === status) {
            return upperFirst__default["default"](status);
        }
    }
    return 'unknown'; // should not get here
}
function getStatusOrUnknown(obj) {
    return obj.status ? obj.status : 'Unknown';
}

const DEFAULT_VIEWSTATE = {
    latitude: 51.992381,
    longitude: 4.3649092,
    zoom: 10,
    bearing: 0,
    pitch: 0
};
let Deck = class Deck extends vuePropertyDecorator.Vue {
    constructor() {
        super(...arguments);
        this.map = null;
        this.deck = null;
        this.loaded = false;
    }
    setStyle() {
        this.map?.setStyle(this.basemap);
    }
    mounted() {
        const viewState = this.value || DEFAULT_VIEWSTATE;
        this.map = new mapboxgl__default["default"].Map({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch,
            container: 'map',
            accessToken: this.accessToken,
            maxPitch: 65,
            style: this.basemap,
            attributionControl: false,
            interactive: false
        });
        this.map.on('load', () => {
            this.loaded = true;
        });
        this.deck = new core.Deck({
            canvas: 'deckgl-overlay',
            width: '100%',
            height: '100%',
            initialViewState: viewState,
            // @ts-expect-error
            getCursor: ({ isHovering }) => {
                return isHovering ? 'pointer' : 'initial';
            },
            controller: true,
            layers: [],
            onViewStateChange: ({ viewState }) => {
                this.updateViewState(viewState);
            },
            getTooltip(info) {
                const object = info.object;
                if (object && typeof object === 'object' && hasOwnProperty(object, 'onHoverText')) {
                    return `${object.onHoverText}`;
                }
            }
        });
    }
    renderDeck() {
        if (!this.deck) {
            throw new Error('No Deck to render');
        }
        if (!this.map) {
            throw new Error('Cannot render deck when Map is not initialized');
        }
        this.deck.setProps({ layers: this.layers });
    }
    updateViewState(viewState) {
        this.deck && this.deck.setProps({ viewState });
        this.map?.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch
        });
        this.$emit('input', viewState);
    }
    beforeDestroy() {
        // this was triggering errors
        // need to destroy children, so that layer removal is done before the map itself is removed
        this.$children.forEach(child => child.$destroy());
        this.map?.remove();
        // this.deck?.canvas.remove();
    }
};
__decorate([
    vuePropertyDecorator.Prop([Object])
], Deck.prototype, "value", void 0);
__decorate([
    vuePropertyDecorator.Prop({
        type: String,
        default: 'mapbox://styles/mapbox/light-v10'
    })
], Deck.prototype, "basemap", void 0);
__decorate([
    vuePropertyDecorator.Prop({
        type: String,
        default: process.env.VUE_APP_MAPBOX_TOKEN
    })
], Deck.prototype, "accessToken", void 0);
__decorate([
    vuePropertyDecorator.Prop({
        type: Array,
        default() {
            return [];
        }
    })
], Deck.prototype, "layers", void 0);
__decorate([
    vuePropertyDecorator.Watch('basemap')
], Deck.prototype, "setStyle", null);
__decorate([
    vuePropertyDecorator.Watch('layers')
], Deck.prototype, "renderDeck", null);
__decorate([
    vuePropertyDecorator.Watch('value')
], Deck.prototype, "updateViewState", null);
Deck = __decorate([
    vuePropertyDecorator.Component({
        name: 'Deck'
    })
], Deck);
var script$7 = Deck;

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__$7 = script$7;

/* template */
var __vue_render__$6 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _c(
      "div",
      { attrs: { id: "mapbox-container" } },
      [
        _c("div", { attrs: { id: "map" } }),
        _vm._v(" "),
        _c("canvas", { attrs: { id: "deckgl-overlay" } }),
        _vm._v(" "),
        _vm.loaded
          ? _c(
              "div",
              { staticClass: "map-control-zero" },
              [
                _vm._t("control-zero", null, {
                  map: _vm.map,
                  onViewstateChange: _vm.updateViewState
                })
              ],
              2
            )
          : _vm._e(),
        _vm._v(" "),
        _vm.loaded
          ? _c(
              "div",
              { staticClass: "map-control-left" },
              [
                _vm._t("control-left", null, {
                  map: _vm.map,
                  onViewstateChange: _vm.updateViewState
                })
              ],
              2
            )
          : _vm._e(),
        _vm._v(" "),
        _vm.loaded
          ? _c(
              "div",
              { staticClass: "map-control-right" },
              [
                _vm._t("control-right", null, {
                  map: _vm.map,
                  onViewstateChange: _vm.updateViewState
                })
              ],
              2
            )
          : _vm._e(),
        _vm._v(" "),
        _vm.loaded
          ? _c(
              "div",
              { staticClass: "map-control-bottom" },
              [
                _vm._t("control-bottom", null, {
                  map: _vm.map,
                  onViewstateChange: _vm.updateViewState
                })
              ],
              2
            )
          : _vm._e(),
        _vm._v(" "),
        _vm.loaded
          ? [
              _vm._t("map", null, {
                map: _vm.map,
                deck: _vm.deck,
                viewState: _vm.value
              })
            ]
          : _vm._e()
      ],
      2
    )
  ])
};
var __vue_staticRenderFns__$6 = [];
__vue_render__$6._withStripped = true;

  /* style */
  const __vue_inject_styles__$7 = function (inject) {
    if (!inject) return
    inject("data-v-534e972f_0", { source: "#mapbox-container[data-v-534e972f] {\n  width: 100%;\n  height: 100vh;\n}\n#mapbox-container > #map[data-v-534e972f], #mapbox-container > #deckgl-overlay[data-v-534e972f] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100% !important;\n  height: 100% !important;\n}\n#mapbox-container .map-control-zero[data-v-534e972f] {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n#mapbox-container[data-v-534e972f]  .map-control-left {\n  position: absolute;\n  top: 10px;\n  left: 10px;\n  transition: transform 0.5s;\n}\n#mapbox-container[data-v-534e972f]  .map-control-left > * {\n  margin-bottom: 8px;\n  margin-right: auto;\n}\n#mapbox-container[data-v-534e972f]  .map-control-left > *:last-child {\n  margin-bottom: 0;\n}\n#mapbox-container[data-v-534e972f]  .map-control-right {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n}\n#mapbox-container[data-v-534e972f]  .map-control-right > * {\n  margin-bottom: 8px;\n  margin-left: auto;\n}\n#mapbox-container[data-v-534e972f]  .map-control-right > *:last-child {\n  margin-bottom: 0;\n}\n#mapbox-container[data-v-534e972f]  .map-control-bottom {\n  position: absolute;\n  bottom: 24px;\n  height: 100px;\n  z-index: 1;\n  left: 0;\n  right: 0;\n  width: calc(100vw - 18.75rem - 4.75rem);\n  display: flex;\n  justify-content: center;\n  transition: transform 0.5s, width 0.5s;\n}\n#mapbox-container .deck-tooltip[data-v-534e972f] {\n  width: 30px;\n  height: 20px;\n}\n#mapbox-container[data-v-534e972f]  .mapboxgl-ctrl-bottom-left {\n  right: 10px;\n  left: unset;\n}\n#mapbox-container[data-v-534e972f]  .mapboxgl-popup {\n  z-index: 99;\n}\n#mapbox-container[data-v-534e972f]  .mapboxgl-popup .mapboxgl-popup-content {\n  padding: 18px 24px 12px 12px;\n}\n#mapbox-container[data-v-534e972f]  .mapboxgl-popup .mapboxgl-popup-close-button {\n  font-family: \"Font Awesome 5 Pro\";\n  font-size: 0px;\n  content: \"\";\n  width: 24px;\n  height: 24px;\n}\n#mapbox-container[data-v-534e972f]  .mapboxgl-popup .mapboxgl-popup-close-button::before {\n  font-size: 12px;\n  content: \"\\f00d\";\n}\n\n/*# sourceMappingURL=Deck.vue.map */", map: {"version":3,"sources":["C:\\_projects\\movici-flow-common\\src\\components\\map\\Deck.vue","Deck.vue"],"names":[],"mappings":"AAyJA;EACA,WAAA;EACA,aAAA;ACxJA;AD0JA;EAEA,kBAAA;EACA,MAAA;EACA,OAAA;EACA,sBAAA;EACA,uBAAA;ACzJA;AD4JA;EACA,kBAAA;EACA,MAAA;EACA,OAAA;AC1JA;AD8JA;EACA,kBAAA;EACA,SAAA;EACA,UAAA;EACA,0BAAA;AC5JA;AD6JA;EACA,kBAAA;EACA,kBAAA;AC3JA;AD4JA;EACA,gBAAA;AC1JA;AD+JA;EACA,kBAAA;EACA,SAAA;EACA,WAAA;AC7JA;AD8JA;EACA,kBAAA;EACA,iBAAA;AC5JA;AD6JA;EACA,gBAAA;AC3JA;ADgKA;EACA,kBAAA;EACA,YAAA;EACA,aAAA;EACA,UAAA;EACA,OAAA;EACA,QAAA;EACA,uCAAA;EAEA,aAAA;EACA,uBAAA;EACA,sCAAA;AC/JA;ADmKA;EACA,WAAA;EACA,YAAA;ACjKA;ADqKA;EACA,WAAA;EACA,WAAA;ACnKA;ADqKA;EACA,WAAA;ACnKA;ADoKA;EACA,4BAAA;AClKA;ADoKA;EACA,iCAAA;EACA,cAAA;EACA,WAAA;EACA,WAAA;EACA,YAAA;AClKA;ADmKA;EACA,eAAA;EACA,gBAAA;ACjKA;;AAEA,mCAAmC","file":"Deck.vue","sourcesContent":["<template>\r\n  <div>\r\n    <div id=\"mapbox-container\">\r\n      <div id=\"map\" />\r\n      <canvas id=\"deckgl-overlay\" />\r\n      <div class=\"map-control-zero\" v-if=\"loaded\">\r\n        <slot name=\"control-zero\" :map=\"map\" :on-viewstate-change=\"updateViewState\" />\r\n      </div>\r\n      <div class=\"map-control-left\" v-if=\"loaded\">\r\n        <slot name=\"control-left\" :map=\"map\" :on-viewstate-change=\"updateViewState\" />\r\n      </div>\r\n      <div class=\"map-control-right\" v-if=\"loaded\">\r\n        <slot name=\"control-right\" :map=\"map\" :on-viewstate-change=\"updateViewState\" />\r\n      </div>\r\n      <div class=\"map-control-bottom\" v-if=\"loaded\">\r\n        <slot name=\"control-bottom\" :map=\"map\" :on-viewstate-change=\"updateViewState\" />\r\n      </div>\r\n      <template v-if=\"loaded\">\r\n        <slot name=\"map\" :map=\"map\" :deck=\"deck\" :view-state=\"value\" />\r\n      </template>\r\n    </div>\r\n  </div>\r\n</template>\r\n\r\n<script lang=\"ts\">\r\nimport { Component, Prop, Vue, Watch } from 'vue-property-decorator';\r\nimport mapboxgl from 'mapbox-gl';\r\nimport 'mapbox-gl/dist/mapbox-gl.css';\r\nimport { Deck as DeckGL, Layer } from '@deck.gl/core';\r\n\r\n// noinspection TypeScriptCheckImport\r\nimport { DeckProps, PickInfo } from '@deck.gl/core/lib/deck';\r\nimport { hasOwnProperty } from '@/utils';\r\nimport { CameraOptions, Nullable } from '@/types';\r\n\r\nconst DEFAULT_VIEWSTATE = {\r\n  latitude: 51.992381,\r\n  longitude: 4.3649092,\r\n  zoom: 10,\r\n  bearing: 0,\r\n  pitch: 0\r\n};\r\n@Component({\r\n  name: 'Deck'\r\n})\r\nexport default class Deck extends Vue {\r\n  @Prop([Object]) readonly value!: Nullable<CameraOptions>;\r\n\r\n  @Prop({\r\n    type: String,\r\n    default: 'mapbox://styles/mapbox/light-v10'\r\n  })\r\n  readonly basemap!: string;\r\n\r\n  @Prop({\r\n    type: String,\r\n    default: process.env.VUE_APP_MAPBOX_TOKEN\r\n  })\r\n  readonly accessToken!: string;\r\n\r\n  @Prop({\r\n    type: Array,\r\n    default() {\r\n      return [];\r\n    }\r\n  })\r\n  readonly layers!: Layer<unknown>[];\r\n  map: mapboxgl.Map | null = null;\r\n  deck: DeckGL | null = null;\r\n  loaded = false;\r\n\r\n  @Watch('basemap')\r\n  setStyle() {\r\n    this.map?.setStyle(this.basemap);\r\n  }\r\n\r\n  mounted() {\r\n    const viewState = this.value || DEFAULT_VIEWSTATE;\r\n    this.map = new mapboxgl.Map({\r\n      center: [viewState.longitude, viewState.latitude],\r\n      zoom: viewState.zoom,\r\n      bearing: viewState.bearing,\r\n      pitch: viewState.pitch,\r\n      container: 'map',\r\n      accessToken: this.accessToken,\r\n      maxPitch: 65,\r\n      style: this.basemap,\r\n      attributionControl: false,\r\n      interactive: false\r\n    });\r\n\r\n    this.map.on('load', () => {\r\n      this.loaded = true;\r\n    });\r\n\r\n    this.deck = new DeckGL(({\r\n      canvas: 'deckgl-overlay',\r\n      width: '100%',\r\n      height: '100%',\r\n      initialViewState: viewState,\r\n      // @ts-expect-error\r\n      getCursor: ({ isHovering }) => {\r\n        return isHovering ? 'pointer' : 'initial';\r\n      },\r\n      controller: true,\r\n      layers: [],\r\n      onViewStateChange: ({ viewState }: { viewState: CameraOptions }) => {\r\n        this.updateViewState(viewState);\r\n      },\r\n      getTooltip(info: PickInfo<unknown>) {\r\n        const object = info.object;\r\n        if (object && typeof object === 'object' && hasOwnProperty(object, 'onHoverText')) {\r\n          return `${object.onHoverText}`;\r\n        }\r\n      }\r\n    } as unknown) as DeckProps);\r\n  }\r\n\r\n  @Watch('layers')\r\n  renderDeck() {\r\n    if (!this.deck) {\r\n      throw new Error('No Deck to render');\r\n    }\r\n    if (!this.map) {\r\n      throw new Error('Cannot render deck when Map is not initialized');\r\n    }\r\n\r\n    this.deck.setProps({ layers: this.layers });\r\n  }\r\n\r\n  @Watch('value')\r\n  updateViewState(viewState: CameraOptions) {\r\n    this.deck && this.deck.setProps({ viewState });\r\n    this.map?.jumpTo({\r\n      center: [viewState.longitude, viewState.latitude],\r\n      zoom: viewState.zoom,\r\n      bearing: viewState.bearing,\r\n      pitch: viewState.pitch\r\n    });\r\n    this.$emit('input', viewState);\r\n  }\r\n\r\n  beforeDestroy() {\r\n    // this was triggering errors\r\n    // need to destroy children, so that layer removal is done before the map itself is removed\r\n    this.$children.forEach(child => child.$destroy());\r\n    this.map?.remove();\r\n    // this.deck?.canvas.remove();\r\n  }\r\n}\r\n</script>\r\n\r\n<style scoped lang=\"scss\">\r\n#mapbox-container {\r\n  width: 100%;\r\n  height: 100vh;\r\n\r\n  & > #map,\r\n  & > #deckgl-overlay {\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100% !important;\r\n    height: 100% !important;\r\n  }\r\n\r\n  .map-control-zero {\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n  }\r\n\r\n  ::v-deep {\r\n    .map-control-left {\r\n      position: absolute;\r\n      top: 10px;\r\n      left: 10px;\r\n      transition: transform 0.5s;\r\n      & > * {\r\n        margin-bottom: 8px;\r\n        margin-right: auto;\r\n        &:last-child {\r\n          margin-bottom: 0;\r\n        }\r\n      }\r\n    }\r\n\r\n    .map-control-right {\r\n      position: absolute;\r\n      top: 10px;\r\n      right: 10px;\r\n      & > * {\r\n        margin-bottom: 8px;\r\n        margin-left: auto;\r\n        &:last-child {\r\n          margin-bottom: 0;\r\n        }\r\n      }\r\n    }\r\n\r\n    .map-control-bottom {\r\n      position: absolute;\r\n      bottom: 24px;\r\n      height: 100px;\r\n      z-index: 1;\r\n      left: 0;\r\n      right: 0;\r\n      width: calc(100vw - #{$left-menu-size} - #{$menu-item-size});\r\n      $left-menu-size: 300px;\r\n      display: flex;\r\n      justify-content: center;\r\n      transition: transform 0.5s, width 0.5s;\r\n    }\r\n  }\r\n\r\n  .deck-tooltip {\r\n    width: 30px;\r\n    height: 20px;\r\n  }\r\n\r\n  ::v-deep {\r\n    .mapboxgl-ctrl-bottom-left {\r\n      right: 10px;\r\n      left: unset;\r\n    }\r\n    .mapboxgl-popup {\r\n      z-index: 99;\r\n      .mapboxgl-popup-content {\r\n        padding: 18px 24px 12px 12px;\r\n      }\r\n      .mapboxgl-popup-close-button {\r\n        font-family: 'Font Awesome 5 Pro';\r\n        font-size: 0px;\r\n        content: '';\r\n        width: 24px;\r\n        height: 24px;\r\n        &::before {\r\n          font-size: 12px;\r\n          content: '\\f00d';\r\n        }\r\n      }\r\n    }\r\n  }\r\n}\r\n</style>\r\n","#mapbox-container {\n  width: 100%;\n  height: 100vh;\n}\n#mapbox-container > #map, #mapbox-container > #deckgl-overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100% !important;\n  height: 100% !important;\n}\n#mapbox-container .map-control-zero {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n#mapbox-container ::v-deep .map-control-left {\n  position: absolute;\n  top: 10px;\n  left: 10px;\n  transition: transform 0.5s;\n}\n#mapbox-container ::v-deep .map-control-left > * {\n  margin-bottom: 8px;\n  margin-right: auto;\n}\n#mapbox-container ::v-deep .map-control-left > *:last-child {\n  margin-bottom: 0;\n}\n#mapbox-container ::v-deep .map-control-right {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n}\n#mapbox-container ::v-deep .map-control-right > * {\n  margin-bottom: 8px;\n  margin-left: auto;\n}\n#mapbox-container ::v-deep .map-control-right > *:last-child {\n  margin-bottom: 0;\n}\n#mapbox-container ::v-deep .map-control-bottom {\n  position: absolute;\n  bottom: 24px;\n  height: 100px;\n  z-index: 1;\n  left: 0;\n  right: 0;\n  width: calc(100vw - 18.75rem - 4.75rem);\n  display: flex;\n  justify-content: center;\n  transition: transform 0.5s, width 0.5s;\n}\n#mapbox-container .deck-tooltip {\n  width: 30px;\n  height: 20px;\n}\n#mapbox-container ::v-deep .mapboxgl-ctrl-bottom-left {\n  right: 10px;\n  left: unset;\n}\n#mapbox-container ::v-deep .mapboxgl-popup {\n  z-index: 99;\n}\n#mapbox-container ::v-deep .mapboxgl-popup .mapboxgl-popup-content {\n  padding: 18px 24px 12px 12px;\n}\n#mapbox-container ::v-deep .mapboxgl-popup .mapboxgl-popup-close-button {\n  font-family: \"Font Awesome 5 Pro\";\n  font-size: 0px;\n  content: \"\";\n  width: 24px;\n  height: 24px;\n}\n#mapbox-container ::v-deep .mapboxgl-popup .mapboxgl-popup-close-button::before {\n  font-size: 12px;\n  content: \"\\f00d\";\n}\n\n/*# sourceMappingURL=Deck.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$7 = "data-v-534e972f";
  /* module identifier */
  const __vue_module_identifier__$7 = undefined;
  /* functional template */
  const __vue_is_functional_template__$7 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$7 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
    __vue_inject_styles__$7,
    __vue_script__$7,
    __vue_scope_id__$7,
    __vue_is_functional_template__$7,
    __vue_module_identifier__$7,
    false,
    createInjector,
    undefined,
    undefined
  );

var layerMixin = {
  props: ['map'],

  methods: {
    attach() {
      this.addSources();
      this.map.addLayer({ ...this.layer, id: this.id });
      this.map.off('idle', this.attach);
    },
    addSources() {
      const sources = this.sources || {};
      for (let key of Object.keys(sources)) {
        this.map.addSource(key, sources[key]);
      }
    },
    removeSources() {
      const sources = this.sources || {};
      for (let key of Object.keys(sources)) {
        this.map.removeSource(key);
      }
    }
  },

  mounted() {
    this.map.on('idle', this.attach);
  },

  beforeDestroy() {
    this.map.removeLayer(this.id);
    this.removeSources();
  },

  render() {
    return {};
  }
};

var script$6 = {
  name: 'Buildings.vue',
  mixins: [layerMixin],
  data() {
    return {
      id: 'basemap-static-buildings',
      sources: {
        'custom-buildings': {
          type: 'vector',
          url: 'mapbox://movici.dh_buildings'
        }
      },
      layer: {
        source: 'custom-buildings',
        'source-layer': 'original',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': '#aaa',

          // use an 'interpolate' expression to add a smooth transition effect to the
          // buildings as the user zooms in
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            13,
            ['get', 'abs_h_max']
          ],

          'fill-extrusion-opacity': 0.8
        }
      }
    };
  }
};

/* script */
const __vue_script__$6 = script$6;

/* template */

  /* style */
  const __vue_inject_styles__$6 = function (inject) {
    if (!inject) return
    inject("data-v-09081960_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"Buildings.vue"}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$6 = "data-v-09081960";
  /* module identifier */
  const __vue_module_identifier__$6 = undefined;
  /* functional template */
  const __vue_is_functional_template__$6 = undefined;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$6 = /*#__PURE__*/normalizeComponent(
    {},
    __vue_inject_styles__$6,
    __vue_script__$6,
    __vue_scope_id__$6,
    __vue_is_functional_template__$6,
    __vue_module_identifier__$6,
    false,
    createInjector,
    undefined,
    undefined
  );

class Dataset {
    constructor(config) {
        this.name = config?.name ?? 'unknown_dataset';
        this.display_name = config?.display_name || this.name;
        this.uuid = config?.uuid ?? '<unknown_uuid>';
        this.type = config?.type ?? 'unknown';
        this.has_data = config?.has_data ?? false;
        this.status = this.has_data ? 'Done' : 'Empty';
        this.created_on = config?.created_on ?? undefined;
        this.last_modified = config?.last_modified ?? undefined;
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class DatasetWithData extends Dataset {
    constructor(config) {
        super(config);
        this.data = config.data ?? {};
    }
}

exports.FlowSectionItem = void 0;
(function (FlowSectionItem) {
    FlowSectionItem["PROJECT"] = "project";
    FlowSectionItem["DATASETS"] = "datasets";
    FlowSectionItem["SCENARIO"] = "scenario";
    FlowSectionItem["VISUALIZATION"] = "visualization";
    FlowSectionItem["EXPORT"] = "export";
})(exports.FlowSectionItem || (exports.FlowSectionItem = {}));

exports.FlowVisualizerType = void 0;
(function (FlowVisualizerType) {
    FlowVisualizerType["POINTS"] = "points";
    FlowVisualizerType["LINES"] = "lines";
    FlowVisualizerType["POLYGONS"] = "polygons";
    FlowVisualizerType["ARCS"] = "arcs";
    // ICONS = 'icons',
    // HEAT_MAP = 'heat_map'
})(exports.FlowVisualizerType || (exports.FlowVisualizerType = {}));

class ColorLegendItem {
    constructor({ title, label, visualizerType, colorType, colorLegends }) {
        this.title = title;
        this.label = label;
        this.visualizerType = visualizerType;
        this.colorType = colorType;
        this.colorLegends = colorLegends ?? [];
    }
}
class ColorByValueLegendItem extends ColorLegendItem {
    constructor(config, byValue, legend) {
        super(config);
        if (byValue && legend?.labels) {
            this.colorLegends = legend.labels.map((label, idx) => {
                return [label, byValue.colors[idx][1]];
            });
        }
    }
}
class ColorStaticLegendItem extends ColorLegendItem {
    constructor(config, static_, legend) {
        super(config);
        if (static_ && legend) {
            this.colorLegends = [[legend.title || 'Topology', static_.color]];
        }
    }
}

exports.EntityGeometry = void 0;
(function (EntityGeometry) {
    EntityGeometry["POINT"] = "points";
    EntityGeometry["LINE"] = "lines";
    EntityGeometry["POLYGON"] = "polygons";
})(exports.EntityGeometry || (exports.EntityGeometry = {}));

exports.SimulationMode = void 0;
(function (SimulationMode) {
    SimulationMode["TIME_ORIENTED"] = "time_oriented";
    SimulationMode["EVENT_ORIENTED"] = "event_oriented";
})(exports.SimulationMode || (exports.SimulationMode = {}));

exports.DatasetFormat = void 0;
(function (DatasetFormat) {
    DatasetFormat["ENTITY_BASED"] = "entity_based";
    DatasetFormat["UNSTRUCTURED"] = "unstructured";
    DatasetFormat["BINARY"] = "binary";
})(exports.DatasetFormat || (exports.DatasetFormat = {}));

class Scope {
    constructor(config) {
        this.scope_name = config.scope_name;
        this.scope_uuid = config.scope_uuid;
    }
}
class ScopeCollection {
    constructor(config) {
        this.scopes = config.scopes;
    }
}
exports.RoleType = void 0;
(function (RoleType) {
    RoleType["owner"] = "owner";
    RoleType["viewer"] = "viewer";
    RoleType["user"] = "user";
    RoleType["admin"] = "admin";
})(exports.RoleType || (exports.RoleType = {}));

exports.VisualizationMode = void 0;
(function (VisualizationMode) {
    VisualizationMode["GEOMETRY"] = "geometry";
    VisualizationMode["SCENARIO"] = "scenario";
})(exports.VisualizationMode || (exports.VisualizationMode = {}));
exports.LayerKind = void 0;
(function (LayerKind) {
    LayerKind["STATIC_COLOR"] = "static_color";
    LayerKind["HEAT_MAP"] = "heat_map";
    LayerKind["COLOR_MAP"] = "color_map";
    LayerKind["ACTIVE_ENTITY"] = "active_entity";
    LayerKind["UNKNOWN"] = "unknown";
})(exports.LayerKind || (exports.LayerKind = {}));
class StaticColorLayerSettings {
    constructor(config) {
        this.kind = exports.LayerKind.STATIC_COLOR;
        this.color = config?.color || [0, 0, 0];
    }
}
class HeatmapLayerSettings {
    constructor() {
        this.kind = exports.LayerKind.HEAT_MAP;
    }
}
class ColorMapLayerSettings {
    constructor(config) {
        this.kind = exports.LayerKind.COLOR_MAP;
        this.property = config?.property;
        this.colors = config?.colors || [];
        this.undefinedColor = config?.undefinedColor || [0, 0, 0];
        this.specialColor = config?.specialColor || [0, 0, 0];
        this.baseColorOverride = config?.baseColorOverride || null;
    }
}
class ActiveEntityLayerSettings {
    constructor(config) {
        this.kind = exports.LayerKind.ACTIVE_ENTITY;
        this.color = config?.color || [0, 0, 0];
        this.inverted = config?.inverted || false;
        this.property = config?.property;
        this.onHover = config?.onHover;
    }
}
class UnknownLayerSettings {
    constructor() {
        this.kind = exports.LayerKind.UNKNOWN;
    }
}

function defaultProject() {
    return {
        name: 'unknown_project',
        uuid: '<unknown_uuid>',
        display_name: 'Unknown Project'
    };
}
var defaults = {
    viewState() {
        return {
            latitude: 51.992381,
            longitude: 4.3649092,
            zoom: 10,
            bearing: 0,
            pitch: 0
        };
    },
    visualisationSettings(project) {
        return {
            mode: exports.VisualizationMode.GEOMETRY,
            project: project || defaultProject(),
            scenario: null
        };
    },
    project: defaultProject
};

class MoviciError extends Error {
    constructor(message) {
        super(message);
    }
    get name() {
        return 'MoviciError';
    }
}
class ValidationError extends MoviciError {
    constructor(message) {
        super(message);
    }
    get name() {
        return 'ValidationError';
    }
}

proj4__default["default"].defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
function transform(coord) {
    return proj4__default["default"]('EPSG:28992', 'WGS84', [coord[0], coord[1]]);
}
function reverseTransform(coord) {
    return proj4__default["default"]('WGS84', 'EPSG:28992', [coord[0], coord[1]]);
}
function transformArray(arr) {
    const len = arr.length;
    const rv = new Array(arr.length);
    for (let i = 0; i < len; i++) {
        rv[i] = transform(arr[i]);
    }
    return rv;
}
function extractCRSName(geojson) {
    const crsInfo = geojson.crs;
    let crsName;
    if (crsInfo === undefined)
        return 'WGS84';
    // taken from reproject.detectCRS
    if (crsInfo.type === 'name') {
        crsName = crsInfo?.properties?.name;
    }
    else if (crsInfo.type === 'EPSG') {
        crsName = 'EPSG:' + crsInfo?.properties?.code;
    }
    // @ts-expect-error
    if (!proj4__default["default"].defs[crsName]) {
        throw new ValidationError('Unsupported CRS: ' + JSON.stringify(crsInfo));
    }
    return crsName;
}
function transformGeoJsonToCRS(geojson, targetCRS = 'EPSG:28992') {
    const crs = extractCRSName(geojson);
    if (crs === targetCRS)
        return geojson;
    const result = reproject.reproject(geojson, crs, targetCRS, proj4__default["default"].defs);
    result.crs = { properties: { name: targetCRS }, type: 'name' };
    return result;
}

/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class TopologyGetter {
    constructor(store, entity) {
        this.store = store;
        this.entity = entity;
    }
    getTopologyFromEntityData(data) {
        const length = data.id.length;
        const rv = [];
        for (let i = 0; i < length; i++) {
            // todo test this
            const coord = this.getCoordinate(data, i);
            if (!coord) {
                continue;
            }
            rv.push({
                id: data.id[i],
                idx: i,
                coordinates: coord
            });
        }
        return rv;
    }
}
class PointTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'point_properties', name: 'position_x' },
            { component: 'point_properties', name: 'position_y' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        if (!data?.point_properties?.position_x || !data?.point_properties?.position_y) {
            throw new Error('Point geometry not found in dataset');
        }
        if (data.point_properties.position_x[i] === null ||
            data.point_properties.position_y[i] === null) {
            return null;
        }
        return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
    }
}
class LineTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'shape_properties', name: 'linestring_2d' },
            { component: 'shape_properties', name: 'linestring_3d' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        const arr = data?.shape_properties?.linestring_3d ?? data?.shape_properties?.linestring_2d;
        if (!arr) {
            throw new Error('Line geometry not found in dataset');
        }
        if (arr[i] === null) {
            return null;
        }
        return transformArray(arr[i]);
    }
}
class PolygonTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [{ component: 'shape_properties', name: 'polygon' }];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        const arr = data?.shape_properties?.polygon;
        if (!arr) {
            throw new Error('Polygon geometry not found in dataset');
        }
        if (arr[i] === null) {
            return null;
        }
        return transformArray(arr[i]);
    }
}
/**
 * The default TopologyGetters download their topology from the initial data. This topology getter
 * downloads it's topology from a scenario state. For this to work, the `DatasetStore` must be
 * configured with a scenario uuid. The requested state is the end state of the scenario.
 */
class PointTopologyFromStateGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'point_properties', name: 'position_x' },
            { component: 'point_properties', name: 'position_y' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        if (!data?.point_properties?.position_x || !data?.point_properties?.position_y) {
            throw new Error('Point geometry not found in dataset');
        }
        if (data.point_properties.position_x[i] === null ||
            data.point_properties.position_y[i] === null) {
            return null;
        }
        return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
    }
}

const DIMENSIONS = {
    SIZE: 3.5,
    SIZE_MIN_PIXELS: 2,
    SIZE_MAX_PIXELS: 5,
    RADIUS_DEPRECATED: 15,
    RADIUS_MIN_PIXELS_DEPRECATED: 2,
    RADIUS_MAX_PIXELS_DEPRECATED: 10,
    RADIUS_SCALE_DEPRECATED: 2
};
class BaseVisualizer {
    constructor(config) {
        this.datasetStore = config.datasetStore;
        this.info = config.info;
        this.onLoad = config.onLoad;
        this.onError = config.onError;
        this.order = 0;
        this.loaded = false;
        this.onClick = () => { };
        this.onHover = () => { };
    }
    get baseID() {
        return `${this.info.id}`;
    }
    get kind() {
        if (hasOwnProperty(this.info.settings, 'kind')) {
            return this.info.settings.kind;
        }
        return exports.LayerKind.UNKNOWN;
    }
    get orderedId() {
        return `${this.info.id}-${this.order}`;
    }
    get priority() {
        const layerOrder = [exports.LayerKind.HEAT_MAP, exports.LayerKind.UNKNOWN];
        return layerOrder.indexOf(this.kind);
    }
    async load(callbacks) {
        if (this.mustReload()) {
            this.info.unsetError('load');
            try {
                await this.doLoad(callbacks?.onProgress);
            }
            catch (err) {
                const error = new Error(String(err));
                console.error(error);
                return this.handleError(error, callbacks?.onError);
            }
            finally {
                this.loaded = true;
            }
            this.handleSuccess(callbacks?.onSuccess);
        }
    }
    mustReload() {
        return !this.loaded;
    }
    settings() {
        return this.info.settings;
    }
    setInfo(info) {
        this.info = info;
    }
    setLayerOrder(order) {
        this.order = order;
    }
    setCallbacks(callbacks) {
        this.onClick = callbacks.onClick || this.onClick;
        this.onHover = callbacks.onHover || this.onHover;
    }
    handleSuccess(callback) {
        this.onLoad && this.onLoad();
        callback && callback();
    }
    handleError(err, callback) {
        this.info.setError('load', err.message);
        if (this.onError) {
            this.onError(err);
        }
        if (callback) {
            callback(err);
        }
    }
}

class StaticDatasetVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
    }
    async doLoad() {
        this.topology = await this.topologyGetter.getTopology();
    }
}
class StaticPointVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        if (this.kind == exports.LayerKind.STATIC_COLOR) {
            return new layers.ScatterplotLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                opacity: 0.9,
                stroked: false,
                filled: true,
                radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
                radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
                radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
                getPosition: d => d.coordinates,
                getRadius: DIMENSIONS.RADIUS_DEPRECATED,
                getFillColor: this.settings().color,
                visible: this.info.visible
            });
        }
        else if (this.kind === exports.LayerKind.HEAT_MAP) {
            return new aggregationLayers.HeatmapLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                opacity: 0.7,
                getPosition: d => d.coordinates,
                visible: this.info.visible
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
class StaticLineVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        return new layers.PathLayer({
            id: this.orderedId,
            data: this.topology,
            pickable: false,
            widthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
            widthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
            getWidth: DIMENSIONS.SIZE,
            getPath: d => d.coordinates,
            getColor: this.settings().color,
            visible: this.info.visible
        });
    }
}
class StaticPolygonVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        const fillColor = this.settings().color;
        fillColor[3] = 100;
        return new layers.PolygonLayer({
            id: this.orderedId,
            data: this.topology,
            pickable: false,
            stroked: true,
            extruded: false,
            getPolygon: d => d.coordinates,
            getLineColor: this.settings().color,
            getFillColor: fillColor,
            getLineWidth: DIMENSIONS.SIZE,
            lineWidthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
            lineWidthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
            visible: this.info.visible
        });
    }
}

class TimelineDownloader {
    constructor(entityGroup, properties, store, reportProgress) {
        this.entityGroup = entityGroup;
        this.properties = properties;
        this.store = store;
        this.reportProgress = reportProgress;
        this.progress = 0;
        this.maxProgress = 1;
    }
    async download() {
        const updates = await this.store.getUpdateList();
        return await this.getUpdateData(updates);
    }
    updateProgress() {
        this.progress++;
        if (this.reportProgress) {
            this.reportProgress((this.progress / this.maxProgress) * 100);
        }
    }
    getUpdateData(updatesList) {
        this.maxProgress = updatesList.length;
        const promises = [];
        for (let i = 0; i < updatesList.length; i++) {
            promises.push(this.store.getUpdateData(updatesList[i], this.entityGroup, this.properties).then(update => {
                this.updateProgress();
                return update;
            }));
        }
        return Promise.all(promises).then(upd => {
            return upd
                .filter(upd => {
                return upd?.data[this.entityGroup];
            })
                .map(upd => {
                return {
                    timestamp: upd.timestamp,
                    iteration: upd.iteration,
                    data: upd.data[this.entityGroup]
                };
            });
        });
    }
}

function getEmptyUpdate(timestamp) {
    return {
        timestamp,
        length: 0,
        indices: [],
        data: []
    };
}
async function layerInfoToTapefile(layerInfo, property, store) {
    if (!layerInfo.scenarioUUID) {
        throw new Error('Missing scenarioUUID');
    }
    return (await getTapefiles({
        store,
        entityGroup: layerInfo.entityGroup,
        properties: [property]
    }))[0];
}
async function getTapefiles(config) {
    const initialData = await config.store.getInitialData({
        entityGroup: config.entityGroup,
        properties: config.properties
    });
    const updates = await new TimelineDownloader(config.entityGroup, config.properties, config.store).download();
    return config.properties.map(p => createTapefileFromStateAndUpdates(p, initialData, updates));
}
function createTapefileFromStateAndUpdates(componentProperty, initialState, updates) {
    const builder = new TapefileBuilder(componentProperty, initialState);
    for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        builder.addUpdate(update);
    }
    return builder.createTapefile();
}
function mergeUpdates(first, second) {
    const updateMap = new Map();
    function applyUpdate(upd) {
        for (let i = 0; i < upd.length; i++) {
            updateMap.set(upd.indices[i], upd.data[i]);
        }
    }
    applyUpdate(first);
    applyUpdate(second);
    const rv = {
        timestamp: first.timestamp,
        length: updateMap.size,
        data: new Array(updateMap.size),
        indices: new Array(updateMap.size)
    };
    let idx = 0;
    for (const [key, value] of updateMap) {
        rv.indices[idx] = key;
        rv.data[idx] = value;
        idx++;
    }
    return rv;
}
/**
 * Creates a SinglePropertyTapefile for a specific ComponentProperty based on `initialState` data
 * and subsequent updates given through `TapefileBuilder.addUpdate`.
 * `initialState` must be EntityGroupData that at least has the `id` field with all entities
 * present. For the `initialState` and subsequent given updates, the `TapefileBuilder` looks up the
 * data array of the `ComponentProperty` and adds that data as an update to a
 * `SinglePropertyTapefile` at the correct timestamp. It also calculates a rollback update to be
 * able to move the tapefile back in time. If there are multiple updates of a property at the
 * same timestamp, these are merged into a single update.
 */
class TapefileBuilder {
    constructor(componentProperty, inititalState) {
        this.updates = [];
        this.componentProperty = componentProperty;
        this.index = new Index(inititalState.id);
        this.state = new PropertyState(inititalState.id.length);
        this.currentTime = 0;
        this.currentIteration = -2; // No state yet so the initial data at iteration -1 is accepted
        this.isFinal = false;
        this.addUpdate({ timestamp: 0, iteration: -1, data: inititalState });
    }
    /**
     * adds an update to the Tapefile. Updates must be added in increasing
     * iteration number. Updates may only be added while the TapefileBuilder
     * is not finalized.
     */
    addUpdate(update) {
        if (this.isFinal) {
            throw Error('Can only add updates while not finalized');
        }
        if (this.updates.length === 0) {
            return this.addInitialUpdate(update);
        }
        // Now we're sure there's at least one update (with our property array) in the
        // list so things like rollback and pop work
        if (update.iteration <= this.currentIteration) {
            throw Error('Can only accept updates in increasing iteration number');
        }
        let parsed = this.prepareUpdate(update);
        if (!parsed) {
            return;
        }
        // We have new update data
        if (update.timestamp === this.currentTime) {
            // merge update with last applied update
            const lastUpdate = this.updates.pop();
            this.state.rollbackUpdate(lastUpdate);
            parsed = mergeUpdates(lastUpdate, parsed);
        }
        // We now have one update per timestamp
        parsed.rollback = this.calculateRollback(parsed);
        this.state.applyUpdate(parsed);
        this.updates.push(parsed);
        this.currentTime = update.timestamp;
        this.currentIteration = update.iteration;
    }
    addInitialUpdate(update) {
        const parsed = this.prepareUpdate(update) || getEmptyUpdate(update.timestamp);
        parsed.rollback = this.calculateRollback(parsed);
        this.state.applyUpdate(parsed);
        this.updates.push(parsed);
        this.currentTime = update.timestamp;
        this.currentIteration = update.iteration;
    }
    prepareUpdate(update) {
        let dataArray = this.getDataArray(update.data);
        let idArray = update.data.id || [];
        if (dataArray.length !== idArray.length) {
            return null;
        }
        // filter out nulls
        const nullIndices = new Set();
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] === null) {
                nullIndices.add(i);
            }
        }
        if (nullIndices.size) {
            dataArray = dataArray.filter((_, idx) => !nullIndices.has(idx));
            idArray = idArray.filter((_, idx) => !nullIndices.has(idx));
        }
        if (!dataArray.length) {
            return null;
        }
        const indices = this.index.getArray(idArray);
        return {
            timestamp: update.timestamp,
            length: dataArray.length,
            indices,
            data: dataArray
        };
    }
    calculateRollback(update) {
        return this.state.getDataForIndices(update.indices);
    }
    getDataArray(data) {
        if (this.componentProperty.component) {
            const component = data[this.componentProperty.component];
            return component ? component[this.componentProperty.name] || [] : [];
        }
        return (data[this.componentProperty.name] || []);
    }
    createTapefile() {
        this.isFinal = true;
        return new SinglePropertyTapefile(this.componentProperty, this.index.length, this.updates);
    }
}
/**
 * A SinglePropertyTapefile can be used to calculate the state of a specific attribute in an entity
 * group at a specific timestamp in a scenario. It is configured with all updates (including the
 * initial data) and their rollbacks. The general usage of this class is to first move the tape to
 * a specific timestamp using `SinglePropertyTapefile.moveTo()` and then requesting the state with
 * `SinglePropertyTapefile.getState()`
 */
class SinglePropertyTapefile {
    constructor(componentProperty, length, updates) {
        this.componentProperty = componentProperty;
        this.state = new PropertyState(length);
        this.state.applyUpdate(updates[0]);
        this.updates = updates;
        this.currentUpdateIdx = 0;
        this.minTime = this.currentTime;
        this.maxTime = updates[updates.length - 1].timestamp;
    }
    get numberOfEntities() {
        return this.state.length;
    }
    get data() {
        return this.state.data;
    }
    copyState() {
        return this.state.copyState();
    }
    get currentTime() {
        return this.updates[this.currentUpdateIdx].timestamp;
    }
    get nextTime() {
        if (this.currentUpdateIdx === this.updates.length - 1)
            return Infinity;
        return this.updates[this.currentUpdateIdx + 1].timestamp;
    }
    moveTo(time) {
        if (time === this.currentTime)
            return;
        if (time > this.currentTime) {
            return this.moveForward(Math.min(time, this.maxTime));
        }
        if (time < this.currentTime) {
            return this.moveBackward(Math.max(time, this.minTime));
        }
    }
    moveForward(time) {
        while (time >= this.nextTime) {
            this.stepForward();
        }
    }
    moveBackward(time) {
        while (time < this.currentTime) {
            this.stepBackward();
        }
    }
    stepForward() {
        if (this.currentUpdateIdx >= this.updates.length - 1) {
            throw RangeError('Requested step out of bounds');
        }
        this.currentUpdateIdx++;
        const newUpdate = this.updates[this.currentUpdateIdx];
        this.state.applyUpdate(newUpdate);
    }
    stepBackward() {
        if (this.currentUpdateIdx === 0) {
            throw new RangeError('Requested step out of bounds');
        }
        const currentUpdate = this.updates[this.currentUpdateIdx];
        this.state.rollbackUpdate(currentUpdate);
        this.currentUpdateIdx--;
    }
}
class Index {
    constructor(idArray) {
        this.map = new Map();
        for (let i = 0; i < idArray.length; i++) {
            this.map.set(idArray[i], i);
        }
        this.length = idArray.length;
    }
    get(id) {
        return this.map.get(id);
    }
    getArray(ids) {
        const rv = new Array(ids.length);
        for (let i = 0; i < ids.length; i++) {
            rv[i] = this.get(ids[i]);
        }
        return rv;
    }
}
class PropertyState {
    constructor(length) {
        this.length = length;
        this.data = getEmptyArray(length);
    }
    getDataForIndices(indices) {
        const rv = new Array(indices.length);
        for (let i = 0; i < indices.length; i++) {
            rv[i] = this.data[indices[i]];
        }
        return rv;
    }
    applyUpdate(update) {
        return this.setUpdateData(update.indices, update.data);
    }
    rollbackUpdate(update) {
        if (update.rollback) {
            return this.setUpdateData(update.indices, update.rollback);
        }
    }
    setUpdateData(indices, data) {
        for (let i = 0; i < indices.length; i++) {
            this.data[indices[i]] = data[i];
        }
    }
    copyState() {
        return [...this.data];
    }
}
function getEmptyArray(size) {
    return new Array(size).fill(null);
}

class NumberColorMap {
    constructor(config) {
        this.useCache = false;
        this.special = config?.special ?? NaN;
        this.specialColor = config.specialColor;
        this.undefined = config?.undefined ?? null;
        this.undefinedColor = config.undefinedColor;
        this.values = config.colors.map(c => c[0]);
        this.colors = config.colors.map(c => c[1]);
        this.cache = new Map();
    }
    getValue(value) {
        if (this.useCache) {
            const color = this.cache.get(value);
            if (color) {
                return color;
            }
        }
        const color = this.calculateColor(value);
        if (this.useCache) {
            this.cache.set(value, color);
        }
        return color;
    }
    calculateColor(value) {
        if (this.isSpecial(value))
            return this.specialColor;
        if (this.isUndefined(value))
            return this.undefinedColor;
        if (!this.values.length)
            return this.undefinedColor;
        if (value <= this.values[0])
            return this.colors[0];
        for (let i = this.values.length - 1; i >= 0; i--) {
            if (value >= this.values[i]) {
                return this.colors[i];
            }
        }
        throw new Error('Programming error while calculating color');
    }
    isUndefined(value) {
        if (this.undefined === null || value === null) {
            return this.undefined === value;
        }
        if (isNaN(this.undefined))
            return isNaN(value);
        return this.undefined === value;
    }
    isSpecial(value) {
        if (value === null) {
            return false;
        }
        if (isNaN(this.special))
            return isNaN(value);
        return this.special === value;
    }
}
class IntColorMap extends NumberColorMap {
    constructor() {
        super(...arguments);
        this.useCache = true;
    }
}

function colorMapFromLayerSettings(settings) {
    return new IntColorMap(settings);
}
class TapefileVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
        this.tapefile = null;
        this.state = null;
    }
    async doLoad() {
        [this.topology, this.tapefile] = await Promise.all([
            this.topologyGetter.getTopology(),
            layerInfoToTapefile(this.info, this.settings().property, this.datasetStore)
        ]);
    }
    getColor(obj) {
        if (this.colorMap) {
            const val = this.state ? this.state[obj.idx] : this.colorMap.undefined;
            return this.colorMap.getValue(val);
        }
        else {
            return [0, 0, 0];
        }
    }
    updateColorMap() {
        const colorSettings = this.settings();
        this.colorMap = colorMapFromLayerSettings(colorSettings);
    }
    updateEntityData(timestamp) {
        if (this.tapefile) {
            this.tapefile.moveTo(timestamp);
            this.state = this.tapefile.copyState();
        }
    }
}
class TapefilePointVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == exports.LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new layers.ScatterplotLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                opacity: 0.9,
                stroked: false,
                filled: true,
                radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
                radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
                radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
                getPosition: d => d.coordinates,
                getRadius: 7,
                getFillColor: this.getColor.bind(this),
                visible: this.info.visible,
                updateTriggers: {
                    getFillColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
class TapefileLineVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == exports.LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new layers.PathLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                widthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
                widthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
                getWidth: DIMENSIONS.SIZE,
                getPath: d => d.coordinates,
                getColor: this.getColor.bind(this),
                visible: this.info.visible,
                updateTriggers: {
                    getColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
class TapefilePolygonVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getFillColor(obj) {
        const [r, g, b] = this.getColor(obj);
        return [r, g, b, 100];
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == exports.LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new layers.PolygonLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                stroked: true,
                extruded: false,
                getPolygon: d => d.coordinates,
                getLineColor: this.getColor.bind(this),
                getFillColor: this.getFillColor.bind(this),
                getLineWidth: DIMENSIONS.SIZE,
                lineWidthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
                lineWidthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
                visible: this.info.visible,
                updateTriggers: {
                    getLineColor: [timestamp, this.colorMap],
                    getFillColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}

class ActivePointVisualizer extends BaseVisualizer {
    get topologyGetter() {
        return new PointTopologyFromStateGetter(this.datasetStore, this.info.entityGroup);
    }
    async doLoad() {
        this.topology = await this.topologyGetter.getTopology();
        const tapefiles = await getTapefiles({
            store: this.datasetStore,
            entityGroup: this.info.entityGroup,
            properties: [
                this.settings().property,
                this.settings().onHover
            ]
        });
        this.toggleData = tapefiles[0];
        this.onHoverData = tapefiles[1];
    }
    getDataForTimestamp(timestamp) {
        if (!this.toggleData || !this.onHoverData || !this.topology) {
            throw new Error('No data available');
        }
        this.toggleData.moveTo(timestamp);
        this.onHoverData.moveTo(timestamp);
        const rv = [];
        const toggles = this.toggleData.copyState();
        const hoverData = this.onHoverData.copyState();
        const activeWhen = !this.settings().inverted;
        for (const entity of this.topology) {
            const toggle = toggles[entity.idx];
            if (toggle === null || Boolean(toggle) != activeWhen) {
                continue;
            }
            entity.onHoverText = hoverData[entity.idx];
            rv.push(entity);
        }
        return rv;
    }
    getLayer(timestamp) {
        if (this.kind == exports.LayerKind.ACTIVE_ENTITY) {
            return new layers.ScatterplotLayer({
                id: this.orderedId,
                data: this.getDataForTimestamp(timestamp),
                pickable: true,
                opacity: 0.9,
                stroked: false,
                filled: true,
                radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
                radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
                radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
                getPosition: d => d.coordinates,
                getRadius: 7,
                getFillColor: this.settings().color,
                visible: this.info.visible
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}

/**
 * Cleanup VisualizerConfigurationSettings. During configuration of a visualizer, it settings
 * may be polluted with attributes of different kinds of visualizers. This function returns a new
 * object containing only the fields belonging to the `VisualizerConfigurationSettings`
 * @param rawSettings: `VisualizerConfigurationSettings` that may contain extra fields/attributes
 */
function cleanVisualizerSettings(rawSettings) {
    switch (rawSettings.kind) {
        case exports.LayerKind.STATIC_COLOR:
            return new StaticColorLayerSettings(rawSettings);
        case exports.LayerKind.HEAT_MAP:
            return new HeatmapLayerSettings();
        case exports.LayerKind.COLOR_MAP:
            return new ColorMapLayerSettings(rawSettings);
        case exports.LayerKind.ACTIVE_ENTITY:
            return new ActiveEntityLayerSettings(rawSettings);
        case exports.LayerKind.UNKNOWN:
            return new UnknownLayerSettings();
    }
}

class BaseVisualizerInfo {
    constructor(config) {
        this.datasetName = config?.datasetName ?? '';
        this.datasetUUID = config?.datasetUUID ?? null;
        this.name = config?.name || this.datasetName;
        this.scenarioUUID = config?.scenarioUUID || null;
        this.entityGroup = config?.entityGroup ?? '';
        this.mode = config?.mode ?? exports.VisualizationMode.GEOMETRY;
        this.visible = config?.visible ?? true;
        this.errors = config?.errors || {};
        this.onProgress = config?.onProgress;
    }
    /**
     * `setError` and `unsetError` must be used to set/unset an error for a specific category (`key`).
     * This is necessary to maintain Vue reactivity on the `errors` object. Errors are given a
     * category so that specific parts of the code can manage their specific error by category
     * (eg. `load` for downloading errors, or `content` for when a `VisualizerInfo` object has invalid
     * content
     * @param key: the error category
     * @param value: the error message
     */
    setError(key, value) {
        this.errors = Object.assign({}, this.errors, { [key]: value });
    }
    /**
     * Unset an error by category (`key`). See also `setError` above
     * @param key: the error category
     */
    unsetError(key) {
        delete this.errors[key];
        this.errors = Object.assign({}, this.errors);
    }
}
class VisualizerInfo extends BaseVisualizerInfo {
    constructor(config) {
        super(config);
        this.geometry = config?.geometry ?? null;
        this.settings = config?.settings ?? { kind: exports.LayerKind.UNKNOWN };
    }
    get id() {
        let rv = `${this.settings.kind}-${this.datasetName}/${this.entityGroup}`;
        if (hasOwnProperty(this.settings, 'property') && this.settings.property) {
            rv += '/' + propertyString(this.settings.property);
        }
        if (this.geometry) {
            rv += '-' + this.geometry;
        }
        return rv;
    }
    /**
     * Create a `VisualizerInfo` object from a `VisualizerViewConfig`. This also requires giving the
     * scenario UUID. The `VisualizerInfo` must still be validated for any content errors.
     * @param config: VisualizerViewConfig
     * @param scenarioUUID: A Scenario UUID
     */
    static fromLayerConfig(config, scenarioUUID) {
        return new VisualizerInfo({
            scenarioUUID,
            name: config.name,
            geometry: config.geometry,
            datasetName: config.dataset_name,
            entityGroup: config.entity_group,
            mode: config.mode,
            visible: config.visible,
            settings: cleanVisualizerSettings(config.settings)
        });
    }
}
class ComposableVisualizerInfo extends BaseVisualizerInfo {
    constructor(config) {
        super(config);
        this.settings = config?.settings;
        this.id = config?.id ?? randomID();
    }
    toVisualizerConfig() {
        if (!this.settings)
            throw new Error(`No settings defined for ${this.name}`);
        return {
            name: this.name,
            dataset_name: this.datasetName,
            entity_group: this.entityGroup,
            visible: this.visible,
            settings: this.settings
        };
    }
}
function randomID() {
    return Math.random().toString(36);
}

/**
 * Given two subsequent entries in a color mapping, calculate intermediate colors. It linearly
 * interpolates between the two entries, and outputs the intermediate entries in an array. The
 * length of the output array is governed by nSteps
 *
 * @param a: The lower colormap entry
 * @param b: the higher colormap entry
 * @param nSteps number of steps
 */
function interpolateColorMapping(a, b, nSteps) {
    if (nSteps <= 0) {
        return [];
    }
    const rv = Array(nSteps);
    const stepSize = (b[0] - a[0]) / (nSteps + 1);
    for (let step = 1; step < nSteps + 1; step++) {
        const value = a[0] + stepSize * step;
        const color = interpolateColor(a[1], b[1], step, nSteps + 1);
        rv[step - 1] = [value, color];
    }
    return rv;
}
function interpolateColor(a, b, step, nSteps) {
    if (nSteps <= 0) {
        throw new Error('must have positive number of steps');
    }
    if (step < 0 || step >= nSteps) {
        throw new Error('Step nog in between 0 and nSteps');
    }
    if (a.length != b.length) {
        throw new Error('Incompatible colors');
    }
    const rv = Array(a.length);
    for (let i = 0; i < a.length; i++) {
        const aa = a[i];
        const bb = b[i];
        if (aa === undefined || bb === undefined) {
            continue;
        }
        rv[i] = Math.floor(aa + ((bb - aa) / nSteps) * step);
    }
    return rv;
}

class VisualizerModule {
    constructor(params) {
        this.info = params.info;
    }
    setInfo(info) {
        this.info = info;
    }
}
class TapefileAccessor {
    constructor(mapping, tapefile) {
        this.mapping = mapping;
        this.tapefile = tapefile;
    }
    setTapefile(tapefile) {
        this.tapefile = tapefile;
    }
    getValue(index) {
        if (this.tapefile) {
            return this.mapping.getValue(this.tapefile.data[index]);
        }
        throw new Error('No tapefile defined for accessor');
    }
}

class ColorModule extends VisualizerModule {
    constructor(params) {
        super(params);
    }
    compose(params, visualizer) {
        const changed = this.updateSettings(this.info.settings?.color ?? {});
        if (!params.props.updateTriggers) {
            params.props.updateTriggers = {};
        }
        const accessor = this.updateAccessor(changed, visualizer);
        let updateTriggers;
        switch (params.type.layerName) {
            case 'ScatterplotLayer':
                params.props.getFillColor = accessor;
                updateTriggers = ['getFillColor'];
                break;
            case 'PolygonLayer':
                params.props.getLineColor = accessor;
                params.props.getFillColor = this.setOpacity(accessor, 80);
                updateTriggers = ['getLineColor', 'getFillColor'];
                break;
            case 'ArcLayer':
                params.props.getSourceColor = accessor;
                params.props.getTargetColor = accessor;
                updateTriggers = ['getSourceColor', 'getTargetColor'];
                break;
            default:
                params.props.getColor = accessor;
                updateTriggers = ['getColor'];
        }
        for (const trigger of updateTriggers) {
            params.props.updateTriggers[trigger] = [this.currentSettings];
        }
        return params;
    }
    /**
     * Updates current settings. returns true when values have changed, otherwise false
     * @param settings
     */
    updateSettings(settings) {
        const changed = !isEqual__default["default"](settings, this.currentSettings);
        if (changed) {
            this.currentSettings = settings;
        }
        return changed;
    }
    updateAccessor(changed, visualizer) {
        if (!changed && this.accessor) {
            return this.accessor;
        }
        this.accessor = this.getAccessor(this.currentSettings, visualizer);
        return this.accessor;
    }
    getAccessor(clause, visualizer) {
        if (clause?.byValue?.attribute) {
            const colorMap = new NumberColorMap({
                colors: this.prepareColors(clause.byValue),
                specialColor: clause.byValue.specialColor ?? [0, 0, 0],
                undefinedColor: clause.byValue.undefinedColor ?? [0, 0, 0]
            });
            const accessor = new TapefileAccessor(colorMap);
            visualizer.requestTapefile(clause.byValue.attribute, t => {
                accessor.setTapefile(t);
            });
            return (d) => accessor.getValue(d.idx);
        }
        if (clause?.static) {
            return clause.static.color;
        }
        return [0, 0, 0];
    }
    setOpacity(accessor, opacity) {
        if (Array.isArray(accessor)) {
            const rv = [...accessor];
            rv[3] = opacity;
            return rv;
        }
        return (d) => [...accessor(d).slice(0, 3), opacity];
    }
    prepareColors(colorClause) {
        const colors = colorClause.colors;
        if (colors.length < 2 || colorClause.type == 'buckets') {
            return colors;
        }
        const minColors = 20;
        const minInBetween = 5;
        const inBetween = Math.max(minInBetween, Math.ceil((minColors - colors.length) / (colors.length - 1)));
        const rv = [];
        for (let i = 0; i < colors.length - 1; i++) {
            rv.push(colors[i]);
            rv.push(...interpolateColorMapping(colors[i], colors[i + 1], inBetween));
        }
        rv.push(colors[colors.length - 1]);
        return rv;
    }
}

class PopupModule extends VisualizerModule {
    constructor(params) {
        super(params);
        this.currentSettings = null;
        this.accessor = null;
    }
    compose(params, visualizer) {
        const changed = this.updateSettings(this.info.settings?.popup || null), accessor = this.updateAccessor(changed, visualizer), when = this.currentSettings?.when, show = this.currentSettings?.show ?? true;
        params.props.pickable = false;
        if (show) {
            if (when) {
                params.props.pickable = true;
                params.props[when] = accessor;
            }
            // to close popup while on hover
            if (when === 'onHover') {
                params.props.onClick = () => {
                    visualizer.onHover(null);
                };
            }
        }
        return params;
    }
    updateSettings(settings) {
        const changed = !isEqual__default["default"](settings, this.currentSettings);
        if (changed) {
            this.currentSettings = settings;
        }
        return changed;
    }
    updateAccessor(changed, visualizer) {
        if (!changed && this.accessor) {
            return this.accessor;
        }
        this.accessor = this.getAccessor(this.currentSettings, visualizer);
        return this.accessor;
    }
    getAccessor(clause, visualizer) {
        if (!clause || !(clause.show ?? true)) {
            return null;
        }
        const accessor = new PopupContentAccessor(clause);
        for (const [idx, item] of clause.items.entries()) {
            visualizer.requestTapefile(item.attribute, t => {
                accessor.setTapefile(t, idx);
            });
        }
        // TODO fix typing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (info) => {
            if (info && info.object) {
                visualizer[clause.when](accessor.getValue(info.object.idx, info));
            }
            else {
                visualizer[clause.when](null);
            }
            return true;
        };
    }
}
class PopupContentAccessor {
    constructor(popup) {
        this.tapefiles = new Array(popup.items.length);
        this.popup = popup;
    }
    setTapefile(tapefile, index) {
        if (index >= this.tapefiles.length) {
            throw new Error('Tapefile assignment out of bounds');
        }
        this.tapefiles[index] = tapefile;
    }
    getValue(index, pickInfo) {
        return {
            title: this.popup.title,
            pickInfo,
            when: this.popup.when,
            position: this.popup.position,
            items: this.popup.items.map((item, idx) => {
                return {
                    name: item.name,
                    attribute: item.attribute,
                    tapefile: this.tapefiles[idx]
                };
            }),
            index
        };
    }
}

class NumberSizeMap {
    constructor(config) {
        /**
         * Maps a number to a size. Also works for booleans. The config constructor
         *  parameter has the following keys
         *    values: an array of values
         *
         * A size is calculated as following:
         *   * A size is valid for values starting from it's assigned value in the `values` until
         *     the next value is found. eg for a value` array `[0, 2]` for input `1` the calculated size
         *     would be the size assigned to `0` as that is the highest value lower than our input
         *   * for inputs lower than the lowest value in our `values` array, the first size is used
         */
        this.useCache = false;
        this.values = config.sizes.map(c => c[0]);
        this.sizes = config.sizes.map(c => c[1]);
        this.cache = new Map();
    }
    getValue(value) {
        let size;
        if (this.useCache) {
            size = this.cache.get(value);
            if (size) {
                return size;
            }
        }
        size = this.calculateSize(value);
        if (this.useCache) {
            this.cache.set(value, size);
        }
        return size;
    }
    calculateSize(value) {
        if (value === null || !this.values.length || isNaN(value))
            return 0;
        if (this.values.length == 1 || value <= this.values[0])
            return this.sizes[0];
        if (value >= this.values[this.values.length - 1])
            return this.sizes[this.sizes.length - 1];
        for (let i = this.values.length - 2; i >= 0; i--) {
            if (value >= this.values[i]) {
                return getInterpolatedValue(this.values[i], this.sizes[i], this.values[i + 1], this.sizes[i + 1], value);
            }
        }
        throw new Error('Programming error while calculating sizes');
    }
}
function getInterpolatedValue(X1, Y1, X2, Y2, x) {
    return Y1 + ((Y2 - Y1) / (X2 - X1)) * (x - X1);
}

class SizeModule extends VisualizerModule {
    constructor(params) {
        super(params);
    }
    compose(params, visualizer) {
        const changed = this.updateSettings(this.info.settings?.size ?? {});
        const sizeClause = this.getClause();
        if (!params.props.updateTriggers) {
            params.props.updateTriggers = {};
        }
        const accessor = this.updateAccessor(changed, visualizer);
        let updateTriggers;
        const { units, minPixels = DIMENSIONS.SIZE_MIN_PIXELS, maxPixels = DIMENSIONS.SIZE_MAX_PIXELS } = sizeClause ?? { units: 'pixels' };
        switch (params.type.layerName) {
            case 'ScatterplotLayer':
                params.props.getRadius = accessor;
                params.props.radiusUnits = units;
                if (units == 'meters') {
                    params.props.radiusMaxPixels = maxPixels;
                    params.props.radiusMinPixels = minPixels;
                }
                updateTriggers = ['getRadius'];
                break;
            case 'PathLayer':
            case 'LineLayer':
            case 'ArcLayer':
                params.props.getWidth = accessor;
                params.props.widthUnits = units;
                if (units == 'meters') {
                    params.props.widthMaxPixels = maxPixels;
                    params.props.widthMinPixels = minPixels;
                }
                updateTriggers = ['getWidth'];
                break;
            case 'PolygonLayer':
                params.props.getLineWidth = accessor;
                params.props.lineWidthUnits = units;
                if (units === 'meters') {
                    params.props.lineWidthMaxPixels = maxPixels;
                    params.props.lineWidthMinPixels = minPixels;
                }
                updateTriggers = ['getLineWidth'];
                break;
            default:
                params.props.getWidth = accessor;
                updateTriggers = ['getWidth'];
        }
        for (const trigger of updateTriggers) {
            params.props.updateTriggers[trigger] = [this.currentSettings];
        }
        return params;
    }
    getClause() {
        const size = this.info.settings?.size;
        if (size?.static)
            return size.static;
        if (size?.byValue)
            return size.byValue;
        return null;
    }
    /**
     * Updates current settings. returns true when values have changed, otherwise false
     * @param settings
     */
    updateSettings(settings) {
        const changed = !isEqual__default["default"](settings, this.currentSettings);
        if (changed) {
            this.currentSettings = settings;
        }
        return changed;
    }
    updateAccessor(changed, visualizer) {
        if (!changed && this.accessor) {
            return this.accessor;
        }
        this.accessor = this.getAccessor(this.currentSettings, visualizer);
        return this.accessor;
    }
    getAccessor(clause, visualizer) {
        if (clause?.byValue?.attribute) {
            const sizeMap = new NumberSizeMap({
                sizes: clause.byValue.sizes
            });
            const accessor = new TapefileAccessor(sizeMap);
            visualizer.requestTapefile(clause.byValue.attribute, t => {
                accessor.setTapefile(t);
            });
            return (d) => accessor.getValue(d.idx);
        }
        if (clause?.static) {
            return clause.static.size;
        }
        return DIMENSIONS.SIZE;
    }
}

class ComposableVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
        this.attributes = {};
        this.tapefiles = {};
        this.modules = null;
    }
    mustReload() {
        return true;
    }
    async doLoad() {
        if (!this.topology) {
            this.topology = (await this.topologyGetter.getTopology());
        }
        this.compose();
        await this.ensureTapefiles();
        this.distributeTapefiles();
    }
    compose() {
        this.attributes = {};
        const modules = this.ensureModules();
        let props = this.getDefaultParams();
        for (const mod of modules) {
            props = mod.compose(props, this);
        }
        return props;
    }
    ensureModules() {
        if (!this.modules) {
            this.modules = this.getModules();
        }
        return this.modules;
    }
    setInfo(info) {
        if (!(info instanceof ComposableVisualizerInfo)) {
            throw new Error('unsupported VisualizerInfo');
        }
        super.setInfo(info);
        if (this.modules) {
            this.modules.forEach(m => m.setInfo(info));
        }
    }
    requestTapefile(attribute, onLoad) {
        const key = propertyString(attribute);
        if (!this.attributes[key]) {
            this.attributes[key] = [];
        }
        this.attributes[key].push(onLoad);
    }
    async ensureTapefiles() {
        const toDownload = Object.keys(this.attributes).filter(attr => !this.tapefiles[attr]);
        if (toDownload.length) {
            const properties = toDownload.map(s => parsePropertyString(s));
            const tapefiles = await getTapefiles({
                store: this.datasetStore,
                entityGroup: this.info.entityGroup,
                properties
            });
            for (const [idx, key] of toDownload.entries()) {
                this.tapefiles[key] = tapefiles[idx];
            }
        }
    }
    distributeTapefiles() {
        for (const key of Object.keys(this.attributes)) {
            for (const callback of this.attributes[key]) {
                callback(this.tapefiles[key]);
            }
        }
    }
    updateTimestamp(timestamp) {
        for (const tapefile of Object.values(this.tapefiles)) {
            tapefile.moveTo(timestamp);
        }
    }
    getLayer(timestamp) {
        this.updateTimestamp(timestamp);
        const layerParams = this.compose();
        this.distributeTapefiles();
        for (const triggers of Object.values(layerParams.props.updateTriggers)) {
            triggers.push(timestamp);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new layerParams.type(layerParams.props);
    }
}
class ComposablePointVisualizer extends ComposableVisualizer {
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getDefaultParams() {
        return {
            type: layers.ScatterplotLayer,
            props: {
                id: this.orderedId,
                data: this.topology ?? [],
                visible: this.info.visible,
                opacity: 0.9,
                getPosition: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
class ComposableLineVisualizer extends ComposableVisualizer {
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    getDefaultParams() {
        return {
            type: layers.PathLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                rounded: true,
                visible: this.info.visible,
                getPath: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
class ComposablePolygonVisualizer extends ComposableVisualizer {
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    getDefaultParams() {
        return {
            type: layers.PolygonLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                lineJointRounded: true,
                visible: this.info.visible,
                getPolygon: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
class ComposableArcVisualizer extends ComposableLineVisualizer {
    getDefaultParams() {
        return {
            type: layers.ArcLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                visible: this.info.visible,
                getHeight: 0.5,
                getSourcePosition: (d) => d.coordinates[0],
                getTargetPosition: (d) => {
                    return d.coordinates[d.coordinates.length - 1];
                },
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
function getCommonModules(info) {
    return [
        new ColorModule({ info }),
        new PopupModule({ info }),
        new SizeModule({ info })
    ];
}

const SUPPORTED_VISUALIZERS = {
    [exports.LayerKind.STATIC_COLOR]: {
        [exports.EntityGeometry.POINT]: StaticPointVisualizer,
        [exports.EntityGeometry.LINE]: StaticLineVisualizer,
        [exports.EntityGeometry.POLYGON]: StaticPolygonVisualizer
    },
    [exports.LayerKind.HEAT_MAP]: {
        [exports.EntityGeometry.POINT]: StaticPointVisualizer,
        [exports.EntityGeometry.LINE]: null,
        [exports.EntityGeometry.POLYGON]: null
    },
    [exports.LayerKind.ACTIVE_ENTITY]: {
        [exports.EntityGeometry.POINT]: ActivePointVisualizer,
        [exports.EntityGeometry.LINE]: null,
        [exports.EntityGeometry.POLYGON]: null
    },
    [exports.LayerKind.COLOR_MAP]: {
        [exports.EntityGeometry.POINT]: TapefilePointVisualizer,
        [exports.EntityGeometry.LINE]: TapefileLineVisualizer,
        [exports.EntityGeometry.POLYGON]: TapefilePolygonVisualizer
    },
    [exports.LayerKind.UNKNOWN]: {
        [exports.EntityGeometry.POINT]: null,
        [exports.EntityGeometry.LINE]: null,
        [exports.EntityGeometry.POLYGON]: null
    }
};
function getVisualizer(config) {
    const visClass = getVisualizerType(config.info);
    if (!visClass) {
        throw new Error(`Cannot visualize ${config.info.id}`);
    }
    return new visClass(config);
}
function getVisualizerType(info) {
    return info instanceof ComposableVisualizerInfo
        ? getComposableVisualizerType(info)
        : getLegacyVisualizerType(info);
}
function getLegacyVisualizerType(info) {
    return info.geometry ? SUPPORTED_VISUALIZERS[info.settings.kind][info.geometry] : null;
}
function getComposableVisualizerType(info) {
    switch (info.settings?.type) {
        case exports.FlowVisualizerType.POINTS:
            return ComposablePointVisualizer;
        case exports.FlowVisualizerType.LINES:
            return ComposableLineVisualizer;
        case exports.FlowVisualizerType.POLYGONS:
            return ComposablePolygonVisualizer;
        case exports.FlowVisualizerType.ARCS:
            return ComposableArcVisualizer;
        default:
            return null;
    }
}

function determineChanges(newLayers, oldLayers) {
    const [toCreate, toDiscard, toKeep] = determineChangedIDs(newLayers, oldLayers);
    const [moreToCreate, moreToDiscard] = determineChangedVisualizers(toKeep, oldLayers);
    return [
        [...toCreate, ...moreToCreate],
        [...toDiscard, ...moreToDiscard]
    ];
}
function determineChangedIDs(newLayers, oldLayers) {
    const oldIds = new Set(oldLayers.map(l => l.id));
    const newIds = new Set(newLayers.map(l => l.id));
    const toCreate = newLayers.filter(l => !oldIds.has(l.id));
    const toDiscard = oldLayers.filter(l => !newIds.has(l.id));
    const toKeep = newLayers.filter(l => oldIds.has(l.id));
    return [toCreate, toDiscard, toKeep];
}
function determineChangedVisualizers(newLayers, oldLayers) {
    const oldLayerVisualizerTypes = oldLayers.reduce((obj, l) => {
        obj[l.id] = getVisualizerType(l);
        return obj;
    }, {});
    const oldLayersByID = oldLayers.reduce((obj, l) => {
        obj[l.id] = l;
        return obj;
    }, {});
    const [toCreate, toDiscard, toKeep] = [[], [], []];
    for (const layer of newLayers) {
        if (getVisualizerType(layer) === oldLayerVisualizerTypes[layer.id]) {
            toKeep.push(layer);
        }
        else {
            toCreate.push(layer);
            toDiscard.push(oldLayersByID[layer.id]);
        }
    }
    return [toCreate, toDiscard, toKeep];
}

class DatasetDownloader {
    constructor(config) {
        this.backend = config.backend;
        this.datasetUUID = config.datasetUUID;
        this.scenarioUUID = config.scenarioUUID ?? null;
    }
    async getInitialData(params) {
        const resp = await this.backend.dataset.getData({
            datasetUUID: this.datasetUUID,
            entityGroup: params.entityGroup,
            properties: params.properties
        });
        const entityData = resp?.data && resp.data[params.entityGroup];
        if (!entityData) {
            throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
        }
        return entityData;
    }
    async getDatasetState(params) {
        if (!this.scenarioUUID) {
            return await this.getInitialData(params);
        }
        const resp = await this.backend.dataset.getState({
            datasetUUID: this.datasetUUID,
            scenarioUUID: this.scenarioUUID,
            entityGroup: params.entityGroup,
            properties: params.properties,
            timestamp: params.timestamp
        });
        const entityData = resp?.data && resp.data[params.entityGroup];
        if (!entityData) {
            throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
        }
        return entityData;
    }
    async getUpdateList() {
        if (!this.scenarioUUID) {
            return [];
        }
        const allUpdates = await this.backend.updates.list(this.scenarioUUID);
        if (!allUpdates) {
            throw new Error('Error when downloading updates');
        }
        return allUpdates.filter(upd => upd.dataset_uuid === this.datasetUUID);
    }
    async getUpdateData(update, entityGroup, properties) {
        const data = await this.backend.updates.get(update.uuid, entityGroup, properties);
        if (!data) {
            throw new Error('Error when downloading updates');
        }
        return data;
    }
}

/**
 * The VisualizerManager creates and maintains `Visualizers` for the `MapVis.vue` component
 * @param: config:
 *   * backend: A `Client` for accessing the Simulation Engine backend
 *   * onSuccess: A callback (or array of callbacks) that is/are invoked whenever the Visualizers
 *     have been successfully updated to the state required by the given `layerInfos` in
 *     `VisualizerManager.updateVisualizers()`
 *   * onFailure: A callback (or array of callbacks) that is invoked when an uncaught error is
 *     thrown during updating the visualizers. Note: many errors are caught by the process of
 *     updating the visualizers, and these errors are instead stored in the `AnyVisualizerInfo.errors`
 *     dictionary. In these cases, the `onFailure` callbacks are not invoked
 */
class VisualizerManager {
    constructor(config) {
        this.backend = config.backend;
        this.visualizers = {};
        this.desiredInfos = [];
        this.currentInfos = [];
        this.loading = false;
        this.callbacks = {
            create: [],
            delete: [],
            success: [],
            error: []
        };
        if (config.onSuccess)
            this.on('success', config.onSuccess);
        if (config.onError)
            this.on('error', config.onError);
        if (config.onCreate)
            this.on('create', config.onCreate);
        if (config.onDelete)
            this.on('delete', config.onDelete);
    }
    getVisualizers() {
        return Object.values(this.visualizers);
    }
    on(event, callbacks) {
        callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
        this.callbacks[event].push(...callbacks);
    }
    async updateVisualizers(layerInfos) {
        this.desiredInfos = layerInfos;
        if (this.loading) {
            return;
        }
        this.loading = true;
        // Between runs of `this.doUpdateVisualizers`, `this.desiredInfos` may have changed.
        // We use `this.loading` as a lock, so that only one attempt to update the visualizers
        // is run at the same time. Only after we're done, do we check whether we're still current,
        // or need to update again
        while (!isEqual__default["default"](this.currentInfos, this.desiredInfos)) {
            const thisInfos = this.desiredInfos;
            try {
                await this.doUpdateVisualizers(thisInfos);
            }
            catch (e) {
                // After we catch an error, we need to check whether we've tried the latest desired
                // state. If the latest desired state has changed, we may try again. We only call the
                // error callbacks once we're done trying
                if (!isEqual__default["default"](thisInfos, this.desiredInfos)) {
                    continue;
                }
                this.finalize(e);
                return;
            }
        }
        this.finalize();
    }
    async doUpdateVisualizers(layerInfos) {
        const [layersToAdd, layersToRemove] = determineChanges(layerInfos, this.currentInfos);
        this.removeVisualizers(layersToRemove);
        this.createVisualizers(layersToAdd);
        layerInfos.forEach((info, idx) => {
            this.visualizers?.[info.id].setInfo(info);
            this.visualizers?.[info.id].setLayerOrder(idx);
        });
        await this.reloadVisualizers();
        this.currentInfos = layerInfos;
    }
    removeVisualizers(layers) {
        layers.forEach(info => {
            delete this.visualizers[info.id];
            this.invokeCallbacks('delete', { manager: this, info });
        });
    }
    createVisualizers(layers) {
        layers.forEach(info => {
            info.unsetError('create');
            let visualizer;
            try {
                visualizer = this.createVisualizer(info);
            }
            catch (e) {
                if (isError__default["default"](e)) {
                    info.setError('create', e.message);
                }
                console.error(e);
                return;
            }
            if (visualizer) {
                this.visualizers[visualizer.baseID] = visualizer;
                this.invokeCallbacks('create', { manager: this, info });
            }
        });
    }
    createVisualizer(layerInfo) {
        if (layerInfo instanceof VisualizerInfo && !layerInfo.geometry) {
            throw new Error('Layer has no geometry defined');
        }
        if (!layerInfo.datasetUUID) {
            throw new Error(`Invalid dataset ${layerInfo.datasetName} for layer ${layerInfo.id}: no UUID`);
        }
        const store = new DatasetDownloader({
            backend: this.backend,
            datasetUUID: layerInfo.datasetUUID,
            scenarioUUID: layerInfo.scenarioUUID || undefined
        });
        return getVisualizer({ datasetStore: store, info: layerInfo });
    }
    async reloadVisualizers() {
        return await Promise.all(Object.values(this.visualizers).map(viz => viz.load()));
    }
    finalize(error) {
        if (error) {
            this.invokeCallbacks('error', { manager: this, error });
        }
        else {
            this.invokeCallbacks('success', { manager: this });
        }
        this.loading = false;
    }
    invokeCallbacks(event, payload) {
        for (const callback of this.callbacks[event]) {
            try {
                callback(payload);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}

/**
 * Takes the properties on object from parameter source and adds them to the object
 * parameter target
 * @param {object} target  Object to have properties copied onto from y
 * @param {object} source  Object with properties to be copied to x
 */
function addPropertiesToObject(target, source) {
    var _loop_1 = function (k) {
        Object.defineProperty(target, k, {
            get: function () { return source[k]; }
        });
    };
    for (var _i = 0, _a = Object.keys(source || {}); _i < _a.length; _i++) {
        var k = _a[_i];
        _loop_1(k);
    }
}
/**
 * Returns a namespaced name of the module to be used as a store getter
 * @param module
 */
function getModuleName(module) {
    if (!module._vmdModuleName) {
        throw new Error("ERR_GET_MODULE_NAME : Could not get module accessor.\n      Make sure your module has name, we can't make accessors for unnamed modules\n      i.e. @Module({ name: 'something' })");
    }
    return "vuexModuleDecorators/" + module._vmdModuleName;
}

var VuexModule = /** @class */ (function () {
    function VuexModule(module) {
        this.actions = module.actions;
        this.mutations = module.mutations;
        this.state = module.state;
        this.getters = module.getters;
        this.namespaced = module.namespaced;
        this.modules = module.modules;
    }
    return VuexModule;
}());
function getModule(moduleClass, store) {
    var moduleName = getModuleName(moduleClass);
    if (store && store.getters[moduleName]) {
        return store.getters[moduleName];
    }
    else if (moduleClass._statics) {
        return moduleClass._statics;
    }
    var genStatic = moduleClass._genStatic;
    if (!genStatic) {
        throw new Error("ERR_GET_MODULE_NO_STATICS : Could not get module accessor.\n      Make sure your module has name, we can't make accessors for unnamed modules\n      i.e. @Module({ name: 'something' })");
    }
    var storeModule = genStatic(store);
    if (store) {
        store.getters[moduleName] = storeModule;
    }
    else {
        moduleClass._statics = storeModule;
    }
    return storeModule;
}

var reservedKeys = ['actions', 'getters', 'mutations', 'modules', 'state', 'namespaced', 'commit'];
function stateFactory(module) {
    var state = new module.prototype.constructor({});
    var s = {};
    Object.keys(state).forEach(function (key) {
        if (reservedKeys.indexOf(key) !== -1) {
            if (typeof state[key] !== 'undefined') {
                throw new Error("ERR_RESERVED_STATE_KEY_USED: You cannot use the following\n        ['actions', 'getters', 'mutations', 'modules', 'state', 'namespaced', 'commit']\n        as fields in your module. These are reserved as they have special purpose in Vuex");
            }
            return;
        }
        if (state.hasOwnProperty(key)) {
            if (typeof state[key] !== 'function') {
                s[key] = state[key];
            }
        }
    });
    return s;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function staticStateGenerator(module, modOpt, statics) {
    var state = modOpt.stateFactory ? module.state() : module.state;
    Object.keys(state).forEach(function (key) {
        if (state.hasOwnProperty(key)) {
            // If not undefined or function means it is a state value
            if (['undefined', 'function'].indexOf(typeof state[key]) === -1) {
                Object.defineProperty(statics, key, {
                    get: function () {
                        var path = modOpt.name.split('/');
                        var data = statics.store.state;
                        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                            var segment = path_1[_i];
                            data = data[segment];
                        }
                        return data[key];
                    }
                });
            }
        }
    });
}
function staticGetterGenerator(module, modOpt, statics) {
    Object.keys(module.getters).forEach(function (key) {
        if (module.namespaced) {
            Object.defineProperty(statics, key, {
                get: function () {
                    return statics.store.getters[modOpt.name + "/" + key];
                }
            });
        }
        else {
            Object.defineProperty(statics, key, {
                get: function () {
                    return statics.store.getters[key];
                }
            });
        }
    });
}
function staticMutationGenerator(module, modOpt, statics) {
    Object.keys(module.mutations).forEach(function (key) {
        if (module.namespaced) {
            statics[key] = function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                (_a = statics.store).commit.apply(_a, __spreadArrays([modOpt.name + "/" + key], args));
            };
        }
        else {
            statics[key] = function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                (_a = statics.store).commit.apply(_a, __spreadArrays([key], args));
            };
        }
    });
}
function staticActionGenerators(module, modOpt, statics) {
    Object.keys(module.actions).forEach(function (key) {
        if (module.namespaced) {
            statics[key] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        return [2 /*return*/, (_a = statics.store).dispatch.apply(_a, __spreadArrays([modOpt.name + "/" + key], args))];
                    });
                });
            };
        }
        else {
            statics[key] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        return [2 /*return*/, (_a = statics.store).dispatch.apply(_a, __spreadArrays([key], args))];
                    });
                });
            };
        }
    });
}

function registerDynamicModule(module, modOpt) {
    if (!modOpt.name) {
        throw new Error('Name of module not provided in decorator options');
    }
    if (!modOpt.store) {
        throw new Error('Store not provided in decorator options when using dynamic option');
    }
    modOpt.store.registerModule(modOpt.name, // TODO: Handle nested modules too in future
    module, { preserveState: modOpt.preserveState || false });
}
function addGettersToModule(targetModule, srcModule) {
    Object.getOwnPropertyNames(srcModule.prototype).forEach(function (funcName) {
        var descriptor = Object.getOwnPropertyDescriptor(srcModule.prototype, funcName);
        if (descriptor.get && targetModule.getters) {
            targetModule.getters[funcName] = function (state, getters, rootState, rootGetters) {
                var thisObj = { context: { state: state, getters: getters, rootState: rootState, rootGetters: rootGetters } };
                addPropertiesToObject(thisObj, state);
                addPropertiesToObject(thisObj, getters);
                var got = descriptor.get.call(thisObj);
                return got;
            };
        }
    });
}
function moduleDecoratorFactory(moduleOptions) {
    return function (constructor) {
        var module = constructor;
        var stateFactory$1 = function () { return stateFactory(module); };
        if (!module.state) {
            module.state = moduleOptions && moduleOptions.stateFactory ? stateFactory$1 : stateFactory$1();
        }
        if (!module.getters) {
            module.getters = {};
        }
        if (!module.namespaced) {
            module.namespaced = moduleOptions && moduleOptions.namespaced;
        }
        var parentModule = Object.getPrototypeOf(module);
        while (parentModule.name !== 'VuexModule' && parentModule.name !== '') {
            addGettersToModule(module, parentModule);
            parentModule = Object.getPrototypeOf(parentModule);
        }
        addGettersToModule(module, module);
        var modOpt = moduleOptions;
        if (modOpt.name) {
            Object.defineProperty(constructor, '_genStatic', {
                value: function (store) {
                    var statics = { store: store || modOpt.store };
                    if (!statics.store) {
                        throw new Error("ERR_STORE_NOT_PROVIDED: To use getModule(), either the module\n            should be decorated with store in decorator, i.e. @Module({store: store}) or\n            store should be passed when calling getModule(), i.e. getModule(MyModule, this.$store)");
                    }
                    // ===========  For statics ==============
                    // ------ state -------
                    staticStateGenerator(module, modOpt, statics);
                    // ------- getters -------
                    if (module.getters) {
                        staticGetterGenerator(module, modOpt, statics);
                    }
                    // -------- mutations --------
                    if (module.mutations) {
                        staticMutationGenerator(module, modOpt, statics);
                    }
                    // -------- actions ---------
                    if (module.actions) {
                        staticActionGenerators(module, modOpt, statics);
                    }
                    return statics;
                }
            });
            Object.defineProperty(constructor, '_vmdModuleName', {
                value: modOpt.name
            });
        }
        if (modOpt.dynamic) {
            registerDynamicModule(module, modOpt);
        }
        return constructor;
    };
}
function Module(modOrOpt) {
    if (typeof modOrOpt === 'function') {
        /*
         * @Module decorator called without options (directly on the class definition)
         */
        moduleDecoratorFactory({})(modOrOpt);
    }
    else {
        /*
         * @Module({...}) decorator called with options
         */
        return moduleDecoratorFactory(modOrOpt);
    }
}

var config = {};

function actionDecoratorFactory(params) {
    var _a = params || {}, _b = _a.commit, commit = _b === void 0 ? undefined : _b, _c = _a.rawError, rawError = _c === void 0 ? !!config.rawError : _c, _d = _a.root, root = _d === void 0 ? false : _d;
    return function (target, key, descriptor) {
        var module = target.constructor;
        if (!module.hasOwnProperty('actions')) {
            module.actions = Object.assign({}, module.actions);
        }
        var actionFunction = descriptor.value;
        var action = function (context, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var actionPayload, moduleName, moduleAccessor, thisObj, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            actionPayload = null;
                            if (!module._genStatic) return [3 /*break*/, 2];
                            moduleName = getModuleName(module);
                            moduleAccessor = context.rootGetters[moduleName]
                                ? context.rootGetters[moduleName]
                                : getModule(module);
                            moduleAccessor.context = context;
                            return [4 /*yield*/, actionFunction.call(moduleAccessor, payload)];
                        case 1:
                            actionPayload = _a.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            thisObj = { context: context };
                            addPropertiesToObject(thisObj, context.state);
                            addPropertiesToObject(thisObj, context.getters);
                            return [4 /*yield*/, actionFunction.call(thisObj, payload)];
                        case 3:
                            actionPayload = _a.sent();
                            _a.label = 4;
                        case 4:
                            if (commit) {
                                context.commit(commit, actionPayload);
                            }
                            return [2 /*return*/, actionPayload];
                        case 5:
                            e_1 = _a.sent();
                            throw rawError
                                ? e_1
                                : new Error('ERR_ACTION_ACCESS_UNDEFINED: Are you trying to access ' +
                                    'this.someMutation() or this.someGetter inside an @Action? \n' +
                                    'That works only in dynamic modules. \n' +
                                    'If not dynamic use this.context.commit("mutationName", payload) ' +
                                    'and this.context.getters["getterName"]' +
                                    '\n' +
                                    new Error("Could not perform action " + key.toString()).stack +
                                    '\n' +
                                    e_1.stack);
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        module.actions[key] = root ? { root: root, handler: action } : action;
    };
}
/**
 * The @Action decorator turns an async function into an Vuex action
 *
 * @param targetOrParams the module class
 * @param key name of the action
 * @param descriptor the action function descriptor
 * @constructor
 */
function Action(targetOrParams, key, descriptor) {
    if (!key && !descriptor) {
        /*
         * This is the case when `targetOrParams` is params.
         * i.e. when used as -
         * <pre>
            @Action({commit: 'incrCount'})
            async getCountDelta() {
              return 5
            }
         * </pre>
         */
        return actionDecoratorFactory(targetOrParams);
    }
    else {
        /*
         * This is the case when @Action is called on action function
         * without any params
         * <pre>
         *   @Action
         *   async doSomething() {
         *    ...
         *   }
         * </pre>
         */
        actionDecoratorFactory()(targetOrParams, key, descriptor);
    }
}

function Mutation(target, key, descriptor) {
    var module = target.constructor;
    if (!module.hasOwnProperty('mutations')) {
        module.mutations = Object.assign({}, module.mutations);
    }
    var mutationFunction = descriptor.value;
    var mutation = function (state, payload) {
        mutationFunction.call(state, payload);
    };
    module.mutations[key] = mutation;
}

function entityGroupToCSV(entityGroup) {
    return new CSVBuilder(entityGroup).buildCSV();
}
function objectToCSV(obj) {
    let rv = '';
    for (const [key, val] of Object.entries(obj)) {
        rv += `${key},${anyToString(val)}\n`;
    }
    return rv;
}
function anyToString(item) {
    if (item === null) {
        return 'null';
    }
    if (item instanceof Object) {
        return '"' + JSON.stringify(item) + '"';
    }
    if (typeof item === 'string') {
        return '"' + item + '"';
    }
    return String(item);
}
class CSVBuilder {
    constructor(entityGroup) {
        this.data = flatten(entityGroup);
        this.size = entityGroup.id.length;
    }
    buildCSV() {
        let rv = '';
        rv = this.writeHeader(rv);
        for (let i = 0; i < this.size; i++) {
            rv = this.writeRow(i, rv);
        }
        return rv;
    }
    writeHeader(output) {
        return output + this.rowToString(this.data.map(d => d[0]));
    }
    writeRow(idx, output) {
        return output + this.rowToString(this.getRow(idx));
    }
    getRow(idx) {
        return this.data.map(d => {
            return d[1][idx];
        });
    }
    rowToString(items) {
        return items.map(i => anyToString(i)).join(',') + '\n';
    }
}
function flatten(entityGroup, prefix = '') {
    const rv = [];
    if (Array.isArray(entityGroup['id'])) {
        rv.push(['id', entityGroup['id']]);
    }
    if (Array.isArray(entityGroup['reference'])) {
        rv.push(['reference', entityGroup['reference']]);
    }
    for (const [key, item] of Object.entries(entityGroup)) {
        if (key === 'id' || key == 'reference') {
            continue;
        }
        if (Array.isArray(item)) {
            rv.push([prefix + key, item]);
        }
        else {
            rv.push(...flatten(item, key + '/'));
        }
    }
    return rv;
}

function downloadAsFile(data, filename) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
async function exportFromConfig({ timelineInfo, backend, config }) {
    const exportModule = new DataExporter(timelineInfo, backend);
    const res = await exportModule.config2blob(config);
    return downloadAsFile(res.blob, res.filename);
}
class DataExporter {
    constructor(timelineInfo, backend) {
        this.timelineInfo = timelineInfo;
        this.backend = backend;
    }
    // download zip file with all csv
    // configs2zip(configs: ExportConfig[]): Promise<Blob> {
    //   const zip = new JSZip();
    //   return Promise.all(
    //     configs.map(async (config: ExportConfig) => {
    //       const header = await this.generalDataHeader(config),
    //         data = await this.exportData(config);
    //       zip.file(this.fileName(config), new Blob([header, data]));
    //     })
    //   ).then(() => zip.generateAsync({ type: 'blob' }));
    // }
    // directly download .csv file
    async config2blob(config) {
        const header = await this.generalDataHeader(config), data = await this.exportData(config);
        return {
            blob: new Blob([header, data], { type: 'text/csv' }),
            filename: this.fileName(config)
        };
    }
    generalDataHeader(config) {
        const { projectName, dataset, scenario, timestamp = 0 } = config, unixTime_ = this.unixTime(timestamp) ?? 0, obj = {
            project: projectName,
            dataset: dataset?.display_name ?? dataset?.name ?? '-',
            scenario: scenario?.display_name ?? scenario?.name ?? '-',
            timestamp: this.currentFormattedTime(unixTime_)
        };
        return objectToCSV(obj);
    }
    async exportData(config) {
        const { dataset, scenario, entityName, timestamp } = config, store = new DatasetDownloader({
            backend: this.backend,
            datasetUUID: dataset?.uuid ?? 'unknown',
            scenarioUUID: scenario?.uuid || undefined
        }), data = await store.getDatasetState({
            entityGroup: entityName,
            timestamp
        });
        return entityGroupToCSV(data);
    }
    fileName(config) {
        const { dataset, entityName, timestamp } = config;
        let rv = dataset?.display_name ?? dataset?.name ?? 'unknown_dataset';
        if (entityName) {
            rv += '-' + entityName;
        }
        if (timestamp) {
            rv += '-' + this.fileNameTime(timestamp);
        }
        return rv + '.csv';
    }
    fileNameTime(timestamp) {
        const leadingZero = (val) => ('0' + val).slice(-2);
        if (!this.unixTime)
            return '-';
        const date = new Date(this.unixTime(timestamp) ?? 0);
        return [
            date.getFullYear(),
            leadingZero(date.getMonth() + 1),
            leadingZero(date.getDate()),
            '-',
            leadingZero(date.getHours()),
            leadingZero(date.getMinutes()),
            leadingZero(date.getSeconds())
        ].join('');
    }
    unixTime(timestamp) {
        return this.timelineInfo
            ? (timestamp * this.timelineInfo.time_scale + this.timelineInfo.reference_time) * 1000
            : null;
    }
    currentFormattedTime(unixTime) {
        return unixTime ? new Date(unixTime).toLocaleString('NL-nl') : '-';
    }
}

let FlowStore = class FlowStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.visualizers = [];
        this.view = null;
        this.views = [];
        this.project = null;
        this.projects = [];
        this.scenarios = [];
        this.scenario = null;
        this.timestamp = 0;
        this.currentUser = null;
        this.datasetSummaries = {};
        this.scenarioSummaries = {};
        // injected resources
        this.backend_ = null;
        this.flowUIStore_ = null;
    }
    get hasProject() {
        return !!this.project;
    }
    get hasScenario() {
        return !!this.scenario;
    }
    // TODO: try to use router link options to do this
    get queryString() {
        const params = {
            project: this.project?.name,
            scenario: this.scenario?.name
        };
        return Object.keys(params)
            .filter((key) => params[key])
            .map((key) => key + '=' + params[key])
            .join('&');
    }
    get timelineInfo() {
        if (this.scenario?.simulation_info.mode === exports.SimulationMode.TIME_ORIENTED) {
            return this.scenario.simulation_info;
        }
        return null;
    }
    get backend() {
        return this.backend_;
    }
    get capabilities() {
        return this.backend?.getCapabilities();
    }
    get hasGeocodeCapabilities() {
        return this.capabilities?.indexOf('geocode') != -1;
    }
    get hasUserCapabilities() {
        return this.capabilities?.indexOf('user') != -1;
    }
    UPDATE_VISUALIZERS(visualizers) {
        this.visualizers = visualizers;
    }
    SET_PROJECTS(projects) {
        this.projects = projects;
    }
    SET_CURRENT_PROJECT(project) {
        this.project = project;
    }
    SET_CURRENT_SCENARIO(scenario) {
        this.scenario = scenario;
    }
    SET_SCENARIOS(scenarios) {
        this.scenarios = scenarios;
    }
    UPDATE_VIEW(view) {
        this.view = view;
    }
    SET_VIEWS(views) {
        this.views = views;
    }
    SET_TIMESTAMP(timestamp) {
        this.timestamp = timestamp;
    }
    SET_USER(user) {
        this.currentUser = user;
    }
    SET_BACKEND(backend) {
        this.backend_ = backend;
    }
    SET_UI_STORE(store) {
        this.flowUIStore_ = store;
    }
    ADD_DATASET_SUMMARY(payload) {
        if (payload.scenarioUUID) {
            this.scenarioSummaries[payload.scenarioUUID] ??= {};
            this.scenarioSummaries[payload.scenarioUUID][payload.datasetUUID] = payload.summary;
        }
        else {
            this.datasetSummaries[payload.datasetUUID] = payload.summary;
        }
    }
    CLEAR_SUMMARIES() {
        this.datasetSummaries = {};
        this.scenarioSummaries = {};
    }
    updateCurrentView(view) {
        this.UPDATE_VIEW(view);
    }
    updateVisualizers(visualizers) {
        this.UPDATE_VISUALIZERS(visualizers);
    }
    async getProjects() {
        this.SET_PROJECTS((await this.backend?.project.list()) ?? []);
    }
    async setCurrentFlowProject(project) {
        this.flowUIStore_?.enableSection({
            datasets: true,
            scenario: true
        });
        this.SET_CURRENT_PROJECT(project);
    }
    setApiClient(backend) {
        this.SET_BACKEND(backend);
    }
    setUIStore(flowUIStore_) {
        this.SET_UI_STORE(flowUIStore_);
    }
    async setCurrentFlowScenario(scenario) {
        this.SET_CURRENT_SCENARIO(scenario);
        this.flowUIStore_?.enableSection({ visualization: !!scenario, export: !!scenario });
        await this.getViewsByScenario(scenario.uuid);
    }
    async getDatasets(projectUUID) {
        const activeProjectUUID = this.project?.uuid || projectUUID, datasets = activeProjectUUID
            ? (await this.backend?.dataset.list(activeProjectUUID)) ?? []
            : [];
        return datasets;
    }
    async getScenariosByProject(projectUUID) {
        const activeProjectUUID = projectUUID ?? this.project?.uuid, scenarios = activeProjectUUID
            ? (await this.backend?.scenario.list(activeProjectUUID)) ?? []
            : [];
        this.SET_SCENARIOS(scenarios);
        return scenarios;
    }
    async getViewsByScenario(scenarioUUID) {
        const currentScenarioUUID = scenarioUUID ?? this.scenario?.uuid;
        if (currentScenarioUUID) {
            const views = (await this.backend?.view.list(currentScenarioUUID)) ?? [];
            this.SET_VIEWS(views);
            return views;
        }
        return [];
    }
    async getScenario(activeScenarioUUID) {
        if (activeScenarioUUID) {
            return await this.backend?.scenario.get(activeScenarioUUID);
        }
        return null;
    }
    setTimestamp(value) {
        this.SET_TIMESTAMP(value);
    }
    /**
     * Get a Dataset Summary by `params.datasetUUUID`. When omitting `params.scenarioUUID` the summary
     * will be either  for the init data or, if the `FlowStore` has a `currentScenarioUUID` defined,
     * for dataset in that scenario. Supplying a `params.scenarioUUID` will request the summary for
     * that scenario. If a `null` value is supplied for `params.scenarioUUID`, the summary is
     * requested for the init data, regardless of whether the `SummaryStore` is configured with a
     * `currentScenarioUUID`
     * @param params
     *   datasetUUID: the dataset UUID of the requested summary
     *   scenarioUUID: Optional scenario UUID to specify what (if any) scenario to request the
     *     dataset summary for. Omit this parameter to automatically determine the scenario (if any)
     */
    async getDatasetSummary(params) {
        const { datasetUUID } = params;
        let { scenarioUUID } = params;
        scenarioUUID ??= this.scenario?.uuid;
        let summary;
        summary = scenarioUUID
            ? this.scenarioSummaries[scenarioUUID]?.[datasetUUID]
            : this.datasetSummaries[datasetUUID];
        if (!summary) {
            summary =
                (scenarioUUID
                    ? await this.backend?.summary.getScenario(scenarioUUID, datasetUUID)
                    : await this.backend?.summary.getDataset(datasetUUID)) ?? null;
            if (summary) {
                this.ADD_DATASET_SUMMARY({
                    datasetUUID,
                    scenarioUUID,
                    summary
                });
            }
        }
        return summary;
    }
    clearSummaries() {
        this.CLEAR_SUMMARIES();
    }
    async exportFromConfig(payload) {
        this.flowUIStore_?.setLoading({ value: true, msg: 'Exporting data...' });
        const datasets = (await this.getDatasets(this.project?.uuid ?? '<unknown project>'))?.reduce((obj, curr) => {
            obj[curr.name] = curr;
            return obj;
        }, {});
        if (datasets && this.project && this.scenario && this.timelineInfo && this.backend) {
            await exportFromConfig({
                config: {
                    dataset: datasets[payload.datasetName] ?? null,
                    projectName: this.project?.display_name,
                    scenario: this.scenario,
                    entityName: payload.entityGroup,
                    timestamp: payload.timestamp ?? this.timestamp
                },
                timelineInfo: this.timelineInfo,
                backend: this.backend
            });
        }
        this.flowUIStore_?.setLoading({ value: false });
    }
    async resetFlowStore() {
        this.SET_PROJECTS([]);
        this.SET_CURRENT_PROJECT(null);
        this.SET_SCENARIOS([]);
        this.SET_CURRENT_SCENARIO(null);
        this.SET_TIMESTAMP(0);
        this.UPDATE_VISUALIZERS([]);
    }
    async createView({ scenarioUUID, view }) {
        return await this.backend?.view.create(scenarioUUID, view);
    }
    async getViews(scenarioUUID) {
        return await this.backend?.view.list(scenarioUUID);
    }
    async getView(viewUUID) {
        return await this.backend?.view.get(viewUUID);
    }
    async updateView({ viewUUID, view }) {
        return await this.backend?.view.update(viewUUID, view);
    }
    async deleteView(viewUUID) {
        return await this.backend?.view.delete(viewUUID);
    }
    /**
     * This function sets up the start of the flow, depending on the configuration.
     * The user can start the flow on different sections, each has a different config that is validated here.
     * If config is valid, we query the resources and set them up in the store so they're accessible in the component
     *
     * @param config
     */
    async setupFlowStore({ config, reset = true }) {
        if (reset) {
            this.resetFlowStore();
            this.clearSummaries();
        }
        if (!this.currentUser) {
            const user = await this.backend?.user.get();
            if (user) {
                this.SET_USER(user);
            }
        }
        if (!this.projects || !this.projects.length) {
            await this.getProjects();
        }
        const { currentProjectName, currentScenarioName, getProject = false, getScenario = false, disableCollapser = false } = config;
        // needs a project but doesn't provide project name
        if (getProject && !currentProjectName) {
            throw new Error('Project name not provided');
        }
        // project is not set and provides a project name
        if (!this.project && currentProjectName) {
            const currentProject = this.projects.find((p) => p.name === currentProjectName);
            if (currentProject?.uuid) {
                await this.setCurrentFlowProject(currentProject);
            }
            else {
                // project name is invalid
                this.resetFlowStore();
                throw new Error('Invalid project');
            }
        }
        // has a project (either previously set on the store, or by last if and needs the scenario)
        // needs a scenario and provided a scenario name
        if (this.project && getScenario) {
            const scenarios = (await this.getScenariosByProject(this.project.uuid)) || [];
            if (currentScenarioName) {
                const shortScenario = scenarios.find(p => p.name === currentScenarioName);
                if (shortScenario) {
                    const scenario = await this.getScenario(shortScenario.uuid);
                    // full scenario not found
                    if (scenario) {
                        await this.setCurrentFlowScenario(scenario);
                    }
                    else {
                        this.resetFlowStore();
                        throw new Error('Invalid full scenario');
                    }
                }
                else {
                    // scenario name is invalid
                    this.resetFlowStore();
                    throw new Error('Invalid short Scenario');
                }
            }
        }
        this.flowUIStore_?.enableSection({
            datasets: this.hasProject,
            scenario: this.hasProject,
            visualization: this.hasScenario,
            export: this.hasScenario
        });
        this.flowUIStore_?.setDisableCollapser(disableCollapser);
    }
};
__decorate([
    Mutation
], FlowStore.prototype, "UPDATE_VISUALIZERS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_PROJECTS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_CURRENT_PROJECT", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_CURRENT_SCENARIO", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_SCENARIOS", null);
__decorate([
    Mutation
], FlowStore.prototype, "UPDATE_VIEW", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_VIEWS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_TIMESTAMP", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_USER", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_BACKEND", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_UI_STORE", null);
__decorate([
    Mutation
], FlowStore.prototype, "ADD_DATASET_SUMMARY", null);
__decorate([
    Mutation
], FlowStore.prototype, "CLEAR_SUMMARIES", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateCurrentView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateVisualizers", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getProjects", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setCurrentFlowProject", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setApiClient", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setUIStore", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setCurrentFlowScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getDatasets", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getScenariosByProject", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getViewsByScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setTimestamp", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getDatasetSummary", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "clearSummaries", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "exportFromConfig", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "resetFlowStore", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "createView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getViews", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "deleteView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setupFlowStore", null);
FlowStore = __decorate([
    Module({
        name: 'flow',
        namespaced: true
    })
], FlowStore);

let FlowUIStore = class FlowUIStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.flowSections = [];
        this.collapse = false;
        this.disableCollapser = false;
        this.loading = false;
        this.loadingMessage = null;
        this.lang = 'en';
    }
    SET_SECTIONS(payload) {
        this.flowSections = payload;
    }
    SET_LANG(lang) {
        this.lang = lang;
    }
    toggleCollapse(force) {
        this.collapse = force ?? !this.collapse;
    }
    setDisableCollapser(value) {
        this.disableCollapser = value;
    }
    setLanguage(lang) {
        this.SET_LANG(lang);
    }
    setLoading({ value, msg }) {
        this.loading = value;
        this.loadingMessage = value ? msg ?? null : null;
    }
    setSections(payload) {
        this.SET_SECTIONS(payload);
    }
    enableSection(payload) {
        const affectedSections = Object.keys(payload);
        this.SET_SECTIONS(this.flowSections.map((section, idx) => {
            return Object.assign({}, this.flowSections[idx], {
                enabled: affectedSections.indexOf(section.name) !== -1 ? payload[section.name] : section.enabled
            });
        }));
    }
};
__decorate([
    Mutation
], FlowUIStore.prototype, "SET_SECTIONS", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "SET_LANG", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "toggleCollapse", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "setDisableCollapser", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "setLanguage", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "setLoading", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "setSections", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "enableSection", null);
FlowUIStore = __decorate([
    Module({
        name: 'flowUI',
        namespaced: true
    })
], FlowUIStore);

function transformResult(result) {
    return Object.assign({}, result, {
        location: transform(result.location),
        bounding_box: [
            ...transform([result.bounding_box[0], result.bounding_box[1]]),
            ...transform([result.bounding_box[2], result.bounding_box[3]])
        ]
    });
}
function prepareQuery(query, epsg_code) {
    query = { ...query };
    if (query.nearby_location) {
        query.nearby_location = reverseTransform(query.nearby_location);
    }
    if (query.bounding_box) {
        query.bounding_box = [
            ...reverseTransform([query.bounding_box[0], query.bounding_box[1]]),
            ...reverseTransform([query.bounding_box[2], query.bounding_box[3]])
        ];
    }
    query.epsg_code = epsg_code;
    return query;
}
let GeocodeStore = class GeocodeStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.suggestions = [];
        this.upstreamEPSG = 28992;
        this.backend_ = null;
    }
    get backend() {
        return this.backend_;
    }
    setSuggestions(suggestions) {
        this.suggestions = suggestions;
    }
    SET_BACKEND(backend) {
        this.backend_ = backend;
    }
    async updateSuggestions(query) {
        if (!query) {
            this.setSuggestions([]);
            return;
        }
        this.setSuggestions((await this.backend?.geocode.getSuggestions(prepareQuery(query, this.upstreamEPSG))) || []);
    }
    // add to client interface
    async resolveSuggestion(suggestion) {
        const result = await this.backend?.geocode.resolveSuggestion(suggestion);
        return (result && transformResult(result)) || null;
    }
    async getFirstResult(query) {
        const result = (await this.backend?.geocode.getResults(prepareQuery(query, this.upstreamEPSG))) ?? [];
        return (result.length && transformResult(result[0])) || null;
    }
};
__decorate([
    Mutation
], GeocodeStore.prototype, "setSuggestions", null);
__decorate([
    Mutation
], GeocodeStore.prototype, "SET_BACKEND", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "updateSuggestions", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "resolveSuggestion", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "getFirstResult", null);
GeocodeStore = __decorate([
    Module({
        name: 'geocode',
        namespaced: true
    })
], GeocodeStore);

let flowStore, flowUIStore;

let MapVis = class MapVis extends vuePropertyDecorator.Vue {
    constructor() {
        super(...arguments);
        this.basemap = 'mapbox://styles/mapbox/light-v10';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.layers = [];
        this.visualizers = null;
        this.popupContent = null;
        this.activePopupId = null;
    }
    setBasemap(basemap) {
        this.basemap = basemap;
    }
    // Move this inside a store?
    get backend() {
        return flowStore.backend;
    }
    ensureVisualizers() {
        if (!this.visualizers && this.backend) {
            this.visualizers = new VisualizerManager({
                backend: this.backend,
                onSuccess: () => {
                    flowUIStore.setLoading({ value: false });
                    this.updateLayers();
                },
                onError: () => {
                    flowUIStore.setLoading({ value: false });
                },
                onDelete: ({ info }) => {
                    if (info) {
                        if (info.id === this.activePopupId) {
                            this.activePopupId = null;
                            this.popupContent = null;
                        }
                    }
                }
            });
        }
        return this.visualizers;
    }
    get slotProps() {
        return {
            basemap: this.basemap,
            setBasemap: this.setBasemap,
            popupContent: this.popupContent,
            updateTimestamp: (t) => this.$emit('update:timestamp', t),
            dynamicPopup: this.popupContent?.position === 'dynamic',
            closePopup: () => (this.popupContent = null)
        };
    }
    handleNewLayerInfos() {
        flowUIStore.setLoading({ value: true, msg: 'Loading layers...' });
        const visualizers = this.ensureVisualizers();
        if (visualizers) {
            visualizers.updateVisualizers(this.layerInfos).then(() => { });
        }
    }
    updateLayers() {
        if (flowUIStore.loading) ;
        const visualizers = this.ensureVisualizers();
        this.layers = (visualizers?.getVisualizers() ?? [])
            .sort((a, b) => (a.priority === b.priority ? a.order - b.order : a.priority - b.priority))
            .map((v, idx) => {
            // typescript for some reason can't figure out the type of `v` so we make sure to cast it to the
            // type that it should be (Visualizer)
            const visualizer = v;
            visualizer.setCallbacks({
                onClick: (content) => {
                    this.setPopup({ id: visualizer.info.id, content });
                },
                onHover: (content) => {
                    this.setPopup({ id: visualizer.info.id, content });
                }
            });
            v.setLayerOrder(idx);
            return v.getLayer(this.timestamp);
        });
    }
    setPopup({ id, content }) {
        this.activePopupId = id;
        this.popupContent = content;
    }
    updateViewState(viewState) {
        this.$emit('update:view-state', viewState);
    }
};
__decorate([
    vuePropertyDecorator.Prop({ type: Array, default: () => [] })
], MapVis.prototype, "layerInfos", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Object, default: null })
], MapVis.prototype, "timelineInfo", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Object, default: () => defaults.viewState() })
], MapVis.prototype, "viewState", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Number, default: 0 })
], MapVis.prototype, "timestamp", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Boolean, default: false })
], MapVis.prototype, "buildings", void 0);
__decorate([
    vuePropertyDecorator.Watch('layerInfos', { immediate: true })
], MapVis.prototype, "handleNewLayerInfos", null);
__decorate([
    vuePropertyDecorator.Watch('timestamp')
], MapVis.prototype, "updateLayers", null);
MapVis = __decorate([
    vuePropertyDecorator.Component({
        name: 'MapVis',
        components: { Deck: __vue_component__$7, Buildings: __vue_component__$6 }
    })
], MapVis);
var script$5 = MapVis;

/* script */
const __vue_script__$5 = script$5;

/* template */
var __vue_render__$5 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c("Deck", {
        attrs: {
          value: _vm.viewState,
          layers: _vm.layers,
          basemap: _vm.basemap
        },
        on: {
          input: function($event) {
            return _vm.updateViewState($event)
          }
        },
        scopedSlots: _vm._u(
          [
            _vm.buildings
              ? {
                  key: "map",
                  fn: function(ref) {
                    var map = ref.map;
                    return [_c("Buildings", { attrs: { map: map } })]
                  }
                }
              : null,
            {
              key: "control-zero",
              fn: function(ref) {
                var map = ref.map;
                var onViewstateChange = ref.onViewstateChange;
                return [
                  _vm._t(
                    "control-zero",
                    null,
                    null,
                    Object.assign({}, _vm.slotProps, {
                      map: map,
                      onViewstateChange: onViewstateChange
                    })
                  )
                ]
              }
            },
            {
              key: "control-left",
              fn: function(ref) {
                var map = ref.map;
                var onViewstateChange = ref.onViewstateChange;
                return [
                  _vm._t(
                    "control-left",
                    null,
                    null,
                    Object.assign({}, _vm.slotProps, {
                      map: map,
                      onViewstateChange: onViewstateChange
                    })
                  )
                ]
              }
            },
            {
              key: "control-right",
              fn: function(ref) {
                var map = ref.map;
                var onViewstateChange = ref.onViewstateChange;
                return [
                  _vm._t(
                    "control-right",
                    null,
                    null,
                    Object.assign({}, _vm.slotProps, {
                      map: map,
                      onViewstateChange: onViewstateChange
                    })
                  )
                ]
              }
            },
            {
              key: "control-bottom",
              fn: function(ref) {
                var map = ref.map;
                var onViewstateChange = ref.onViewstateChange;
                return [
                  _vm._t(
                    "control-bottom",
                    null,
                    null,
                    Object.assign({}, _vm.slotProps, {
                      map: map,
                      onViewstateChange: onViewstateChange
                    })
                  )
                ]
              }
            }
          ],
          null,
          true
        )
      })
    ],
    1
  )
};
var __vue_staticRenderFns__$5 = [];
__vue_render__$5._withStripped = true;

  /* style */
  const __vue_inject_styles__$5 = function (inject) {
    if (!inject) return
    inject("data-v-a0557922_0", { source: ".timeslider[data-v-a0557922] {\n  flex-grow: 1;\n  margin: 0 80px;\n}\n\n/*# sourceMappingURL=MapVis.vue.map */", map: {"version":3,"sources":["C:\\_projects\\movici-flow-common\\src\\components\\map\\MapVis.vue","MapVis.vue"],"names":[],"mappings":"AA+JA;EACA,YAAA;EACA,cAAA;AC9JA;;AAEA,qCAAqC","file":"MapVis.vue","sourcesContent":["<template>\r\n  <div>\r\n    <Deck :value=\"viewState\" @input=\"updateViewState($event)\" :layers=\"layers\" :basemap=\"basemap\">\r\n      <template v-if=\"buildings\" #map=\"{ map }\">\r\n        <Buildings :map=\"map\" />\r\n      </template>\r\n      <template #control-zero=\"{ map, onViewstateChange }\">\r\n        <slot name=\"control-zero\" v-bind=\"{ ...slotProps, map, onViewstateChange }\" />\r\n      </template>\r\n      <template #control-left=\"{ map, onViewstateChange }\">\r\n        <slot name=\"control-left\" v-bind=\"{ ...slotProps, map, onViewstateChange }\" />\r\n      </template>\r\n      <template #control-right=\"{ map, onViewstateChange }\">\r\n        <slot name=\"control-right\" v-bind=\"{ ...slotProps, map, onViewstateChange }\" />\r\n      </template>\r\n      <template #control-bottom=\"{ map, onViewstateChange }\">\r\n        <slot name=\"control-bottom\" v-bind=\"{ ...slotProps, map, onViewstateChange }\" />\r\n      </template>\r\n    </Deck>\r\n  </div>\r\n</template>\r\n\r\n<script lang=\"ts\">\r\nimport { Component, Prop, Vue, Watch } from 'vue-property-decorator';\r\nimport { CameraOptions, PopupContent, TimeOrientedSimulationInfo } from '@/types';\r\nimport Deck from './Deck.vue';\r\nimport Buildings from './mapLayers/Buildings.vue';\r\nimport defaults from './defaults';\r\nimport { Layer } from '@deck.gl/core';\r\nimport VisualizerManager from '@/visualizers/VisualizerManager';\r\nimport { Visualizer } from '@/visualizers';\r\nimport { AnyVisualizerInfo } from '@/visualizers/VisualizerInfo';\r\nimport { flowStore, flowUIStore } from '@/store/store-accessor';\r\nimport Backend from '@/api/backend';\r\n\r\n@Component({\r\n  name: 'MapVis',\r\n  components: { Deck, Buildings }\r\n})\r\nexport default class MapVis extends Vue {\r\n  @Prop({ type: Array, default: () => [] })\r\n  readonly layerInfos!: AnyVisualizerInfo[];\r\n\r\n  @Prop({ type: Object, default: null })\r\n  readonly timelineInfo!: TimeOrientedSimulationInfo | null;\r\n\r\n  @Prop({ type: Object, default: () => defaults.viewState() })\r\n  readonly viewState!: CameraOptions;\r\n\r\n  @Prop({ type: Number, default: 0 })\r\n  readonly timestamp!: number;\r\n\r\n  @Prop({ type: Boolean, default: false })\r\n  readonly buildings!: boolean;\r\n\r\n  basemap = 'mapbox://styles/mapbox/light-v10';\r\n\r\n  // eslint-disable-next-line @typescript-eslint/no-explicit-any\r\n  layers: Layer<any>[] = [];\r\n  visualizers: VisualizerManager | null = null;\r\n\r\n  popupContent: PopupContent | null = null;\r\n  activePopupId: string | null = null;\r\n\r\n  setBasemap(basemap: string) {\r\n    this.basemap = basemap;\r\n  }\r\n\r\n  // Move this inside a store?\r\n  get backend(): Backend | null {\r\n    return flowStore.backend;\r\n  }\r\n\r\n  ensureVisualizers() {\r\n    if (!this.visualizers && this.backend) {\r\n      this.visualizers = new VisualizerManager({\r\n        backend: this.backend,\r\n        onSuccess: () => {\r\n          flowUIStore.setLoading({ value: false });\r\n          this.updateLayers();\r\n        },\r\n        onError: () => {\r\n          flowUIStore.setLoading({ value: false });\r\n        },\r\n        onDelete: ({ info }) => {\r\n          if (info) {\r\n            if (info.id === this.activePopupId) {\r\n              this.activePopupId = null;\r\n              this.popupContent = null;\r\n            }\r\n          }\r\n        }\r\n      });\r\n    }\r\n\r\n    return this.visualizers;\r\n  }\r\n\r\n  get slotProps() {\r\n    return {\r\n      basemap: this.basemap,\r\n      setBasemap: this.setBasemap,\r\n      popupContent: this.popupContent,\r\n      updateTimestamp: (t: number) => this.$emit('update:timestamp', t),\r\n      dynamicPopup: this.popupContent?.position === 'dynamic',\r\n      closePopup: () => (this.popupContent = null)\r\n    };\r\n  }\r\n\r\n  @Watch('layerInfos', { immediate: true })\r\n  handleNewLayerInfos() {\r\n    flowUIStore.setLoading({ value: true, msg: 'Loading layers...' });\r\n    const visualizers = this.ensureVisualizers();\r\n\r\n    if (visualizers) {\r\n      visualizers.updateVisualizers(this.layerInfos).then(() => {});\r\n    }\r\n  }\r\n\r\n  @Watch('timestamp')\r\n  updateLayers() {\r\n    if (flowUIStore.loading) {\r\n      return;\r\n    }\r\n\r\n    const visualizers = this.ensureVisualizers();\r\n\r\n    this.layers = (visualizers?.getVisualizers() ?? [])\r\n      .sort((a, b) => (a.priority === b.priority ? a.order - b.order : a.priority - b.priority))\r\n      .map((v, idx) => {\r\n        // typescript for some reason can't figure out the type of `v` so we make sure to cast it to the\r\n        // type that it should be (Visualizer)\r\n        const visualizer: Visualizer = v;\r\n\r\n        visualizer.setCallbacks({\r\n          onClick: (content: PopupContent | null) => {\r\n            this.setPopup({ id: visualizer.info.id, content });\r\n          },\r\n          onHover: (content: PopupContent | null) => {\r\n            this.setPopup({ id: visualizer.info.id, content });\r\n          }\r\n        });\r\n        v.setLayerOrder(idx);\r\n        return v.getLayer(this.timestamp);\r\n      });\r\n  }\r\n\r\n  setPopup({ id, content }: { id: string; content: PopupContent | null }) {\r\n    this.activePopupId = id;\r\n    this.popupContent = content;\r\n  }\r\n\r\n  updateViewState(viewState: CameraOptions) {\r\n    this.$emit('update:view-state', viewState);\r\n  }\r\n}\r\n</script>\r\n\r\n<style scoped lang=\"scss\">\r\n.timeslider {\r\n  flex-grow: 1;\r\n  margin: 0 80px;\r\n}\r\n</style>\r\n",".timeslider {\n  flex-grow: 1;\n  margin: 0 80px;\n}\n\n/*# sourceMappingURL=MapVis.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$5 = "data-v-a0557922";
  /* module identifier */
  const __vue_module_identifier__$5 = undefined;
  /* functional template */
  const __vue_is_functional_template__$5 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$5 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
    __vue_inject_styles__$5,
    __vue_script__$5,
    __vue_scope_id__$5,
    __vue_is_functional_template__$5,
    __vue_module_identifier__$5,
    false,
    createInjector,
    undefined,
    undefined
  );

let MovAction = class MovAction extends vuePropertyDecorator.Vue {
    constructor() {
        super(...arguments);
        this.disabledType = 'is-inactive';
        // Even when the button is-small we want the icon to be is-medium. We can safely use this as
        // the de-facto icon size as bulma automatically scales the icon up when the button becomes larger
        this.minIconSize = 'is-medium';
    }
    get currentAction() {
        const action = this.actions[this.action];
        if (!action) {
            console.error('Invalid action: ', this.action);
        }
        return action;
    }
    get icon() {
        return this.currentAction.icon;
    }
    get type() {
        return this.disabled ? this.disabledType : this.currentAction.type;
    }
    get label() {
        return upperFirst__default["default"](this.action);
    }
    get actionClass() {
        return `action-${this.action} ${this.size}`;
    }
    get actions() {
        return {
            add: {
                icon: 'plus',
                type: 'is-primary'
            },
            view: {
                icon: 'eye',
                type: 'is-primary'
            },
            edit: {
                icon: 'pen',
                type: 'is-info'
            },
            delete: {
                icon: 'trash',
                type: 'is-danger'
            },
            duplicate: {
                icon: 'clone',
                type: 'is-primary'
            },
            download: {
                icon: 'download',
                type: 'is-success'
            },
            generate: {
                icon: 'play',
                type: 'is-primary'
            },
            play: {
                icon: 'play',
                type: 'is-primary'
            },
            reset: {
                icon: 'undo-alt',
                type: 'is-danger'
            },
            cancel: {
                icon: 'stop',
                type: 'is-danger'
            },
            invite: {
                icon: 'envelope',
                type: 'is-dark'
            },
            logs: {
                icon: 'file-alt',
                type: 'is-dark'
            }
        };
    }
};
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: '' })
], MovAction.prototype, "action", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: '' })
], MovAction.prototype, "size", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Boolean, default: false })
], MovAction.prototype, "disabled", void 0);
MovAction = __decorate([
    vuePropertyDecorator.Component({ name: 'MovAction' })
], MovAction);
var script$4 = MovAction;

/* script */
const __vue_script__$4 = script$4;

/* template */
var __vue_render__$4 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "b-tooltip",
    { attrs: { label: _vm.label, type: "is-black" } },
    [
      _c(
        "b-button",
        {
          staticClass: "is-borderless",
          class: _vm.actionClass,
          attrs: { disabled: _vm.disabled },
          on: {
            click: function($event) {
              return _vm.$emit("click")
            }
          }
        },
        [
          _c("b-icon", {
            attrs: { icon: _vm.icon, size: _vm.minIconSize, type: _vm.type }
          })
        ],
        1
      )
    ],
    1
  )
};
var __vue_staticRenderFns__$4 = [];
__vue_render__$4._withStripped = true;

  /* style */
  const __vue_inject_styles__$4 = function (inject) {
    if (!inject) return
    inject("data-v-6428af2a_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"Action.vue"}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$4 = "data-v-6428af2a";
  /* module identifier */
  const __vue_module_identifier__$4 = undefined;
  /* functional template */
  const __vue_is_functional_template__$4 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$4 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    false,
    createInjector,
    undefined,
    undefined
  );

let MovActionBar = class MovActionBar extends vuePropertyDecorator.Vue {
    get actionList() {
        if (this.actions)
            if (Array.isArray(this.actions)) {
                return this.actions;
            }
            else {
                return this.actions.trim().split(' ');
            }
        else
            return [];
    }
    get disabledList() {
        if (this.disabled)
            if (Array.isArray(this.disabled)) {
                return this.disabled;
            }
            else {
                return this.disabled.trim().split(' ');
            }
        else
            return [];
    }
    get enabledList() {
        if (this.enabled)
            if (Array.isArray(this.enabled)) {
                return this.enabled;
            }
            else {
                return this.enabled.trim().split(' ');
            }
        else
            return [];
    }
    isDisabled(action) {
        if (!this.enabled && !this.disabled)
            return false;
        if (this.enabled) {
            return !this.enabledList.includes(action);
        }
        if (this.disabled) {
            return this.disabledList.includes(action);
        }
    }
};
__decorate([
    vuePropertyDecorator.Prop({ type: [String, Array] })
], MovActionBar.prototype, "actions", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: [String, Array] })
], MovActionBar.prototype, "disabled", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: [String, Array] })
], MovActionBar.prototype, "enabled", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: 'is-medium' })
], MovActionBar.prototype, "size", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Array, default: () => [] })
], MovActionBar.prototype, "additionalClasses", void 0);
MovActionBar = __decorate([
    vuePropertyDecorator.Component({ name: 'MovActionBar' })
], MovActionBar);
var script$3 = MovActionBar;

/* script */
const __vue_script__$3 = script$3;

/* template */
var __vue_render__$3 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _vm._t("before"),
      _vm._v(" "),
      _vm._l(_vm.actionList, function(action, idx) {
        return _c("MovAction", {
          key: idx,
          class: _vm.additionalClasses,
          attrs: {
            action: action,
            size: _vm.size,
            disabled: _vm.isDisabled(action)
          },
          on: {
            click: function($event) {
              return _vm.$emit(action)
            }
          }
        })
      }),
      _vm._v(" "),
      _vm._t("after")
    ],
    2
  )
};
var __vue_staticRenderFns__$3 = [];
__vue_render__$3._withStripped = true;

  /* style */
  const __vue_inject_styles__$3 = function (inject) {
    if (!inject) return
    inject("data-v-91f6ca7a_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"ActionBar.vue"}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$3 = "data-v-91f6ca7a";
  /* module identifier */
  const __vue_module_identifier__$3 = undefined;
  /* functional template */
  const __vue_is_functional_template__$3 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$3 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    false,
    createInjector,
    undefined,
    undefined
  );

function isVue(thing) {
    return thing.$el !== undefined;
}
function asElement(thing) {
    if (thing === null) {
        return null;
    }
    return isVue(thing) ? thing.$el : thing;
}
/**
 * FixedPosition is a mixin to handle "relative positioned components" inside a scrollbar overflow.
 * We have a reference for the popup and a reference for the trigger.
 * This values are turned into bounding rectangles in reset() and calls the resetPosition.
 * If there's a overflow parent, then we setup the event bus to trigger it whenever the parent is scrolled.
 * This will update the popup style position correctly.
 */
let FixedPosition = class FixedPosition extends vuePropertyDecorator.Vue {
    constructor() {
        super(...arguments);
        this.overflowParent = null;
        this.style = {};
        this.visible = false;
        this.adjust = {
            top: 0,
            left: 0
        };
    }
    toggle(force) {
        this.visible = force ?? !this.visible;
        if (this.visible) {
            this.reset();
        }
    }
    mounted() {
        this.overflowParent = asElement(this.getOverflowVueParent('x-overflow'));
        if (this.overflowParent) {
            this.overflowParent.addEventListener('scroll', () => {
                this.visible && this.reset();
            });
        }
    }
    reset() {
        if (this.anchorRef && this.popupRef) {
            const anchorRect = this.anchorRef.getBoundingClientRect(), popupRect = this.popupRef.getBoundingClientRect();
            this.resetPosition(anchorRect, popupRect, this.adjust);
            if (this.overflowParent) {
                const overflowRect = this.overflowParent.getBoundingClientRect();
                // detect if either the anchor passed the top or bottom
                if (overflowRect.top > anchorRect.top || anchorRect.bottom > overflowRect.bottom) {
                    this.visible = false;
                }
            }
        }
    }
    /**
     * Takes a class and looks recursively for an parent element that has that class.
     * Used to get the overflow parent of this mixin component
     * parent must be a Vue component
     * @param cssClass CSS class, in most times value is 'overflow'
     * @param vue_ this Vue instance, it's parent or elder parent
     * @returns Vue | null
     */
    getOverflowVueParent(cssClass, vue_) {
        vue_ ??= this;
        const { $el, $parent } = vue_;
        // if the element has the class we are looking for, we return it,
        // else, if it has a parent, we recursively call gerOverflowParent to check for it's parent
        // else reached the end of DOM no parent has overflow class.
        if ($el?.classList.contains(cssClass)) {
            return vue_;
        }
        else if ($parent) {
            return this.getOverflowVueParent(cssClass, $parent);
        }
        else {
            return null;
        }
    }
    /**
     * Values calculates where the popup should be in reference to it's anchor
     * This is done using 'position: fixed', so this can be used where a parent
     * of the component has scrollbar overflow
     * @param anchorRect Simplified rectangle properties of the anchor
     * @param popupRect Simplified rectangle properties of the popup
     * @param adjust top and left adjusts
     */
    resetPosition(anchorRect, popupRect, adjust) {
        const popupStyle = {};
        if (popupRect && anchorRect) {
            // In order to prevent the popup from being positioned outside of the viewport
            // (as best we can), we have to know its dimensions. This way, we can limit
            // offsets as the popup approaches the edge of the viewport.
            // --
            // PERFORMANCE NOTE: For a small improvement, we could gather these dimensions
            // of the popup at the time we first render it. However, then we'd have to store
            // them as component properties and I wanted to keep this as simple as possible.
            const popupWidth = popupRect.width, popupHeight = popupRect.height, anchorWidth = anchorRect.width, windowWidth = document.documentElement.clientWidth, windowHeight = document.documentElement.clientHeight, 
            // NOTE: When positioning the popup, we are translating an ABSOLUTE position (the
            // anchor) into a FIXED position (the popup). As such, we have to take the window
            // scroll-offsets into account.
            // First, let's calculate the "natural" position of the popup relative to the
            // anchor. This would be the position if we didn't want to constrain the location
            // of the popup relative to the viewport.
            naturalLeft = anchorRect.left + (adjust?.left ?? 0), naturalTop = anchorRect.top + (adjust?.top ?? 0), 
            // Second, let's calculate the constrained position of the popup relative to the
            // viewport (such that the popup doesn't overlap with the edge of the viewport).
            // --
            // NOTE: In the following calculations, the "10" is the distance we want to keep
            // the popup away from the edges of the viewport.
            minLeft = 10, maxLeft = windowWidth - popupWidth - 10, minTop = 10, maxTop = windowHeight - popupHeight - 10;
            // Make sure we don't go too far right or left.
            popupStyle.left = Math.max(minLeft, Math.min(naturalLeft + anchorWidth, maxLeft)) + 'px';
            // Make sure we don't go too far down or up.
            popupStyle.top = Math.max(minTop, Math.min(naturalTop, maxTop)) + 'px';
            popupStyle.position = 'fixed !important';
        }
        this.style = popupStyle;
    }
};
FixedPosition = __decorate([
    vuePropertyDecorator.Component
], FixedPosition);
var FixedPosition$1 = FixedPosition;

let MovActionMenu = class MovActionMenu extends vuePropertyDecorator.Mixins(FixedPosition$1) {
    constructor() {
        super(...arguments);
        this.adjust = {
            top: -12,
            left: 8
        };
    }
    emitAndClose(event, value) {
        this.$emit(event, value);
        this.visible = false;
    }
};
__decorate([
    vuePropertyDecorator.Prop({ default: [] })
], MovActionMenu.prototype, "value", void 0);
__decorate([
    vuePropertyDecorator.Ref('anchorRef')
], MovActionMenu.prototype, "anchorRef", void 0);
__decorate([
    vuePropertyDecorator.Ref('popupRef')
], MovActionMenu.prototype, "popupRef", void 0);
MovActionMenu = __decorate([
    vuePropertyDecorator.Component({ name: 'MovActionMenu' })
], MovActionMenu);
var script$2 = MovActionMenu;

/* script */
const __vue_script__$2 = script$2;

/* template */
var __vue_render__$2 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    {
      staticClass: "dropdown dropdown-menu-animation is-mobile-modal",
      attrs: { tabindex: "0" },
      on: {
        blur: function($event) {
          _vm.visible = false;
        }
      }
    },
    [
      _c(
        "div",
        {
          ref: "anchorRef",
          staticClass: "dropdown-trigger",
          attrs: { role: "button", "aria-haspopup": "true" },
          on: { click: _vm.toggle }
        },
        [
          _c(
            "span",
            { staticClass: "ellipsis" },
            [
              _c("b-icon", {
                attrs: { size: "is-small", pack: "far", icon: "ellipsis-v" }
              })
            ],
            1
          )
        ]
      ),
      _vm._v(" "),
      _c(
        "div",
        {
          directives: [
            {
              name: "show",
              rawName: "v-show",
              value: _vm.visible,
              expression: "visible"
            }
          ],
          ref: "popupRef",
          staticClass: "dropdown-menu",
          style: _vm.style
        },
        [
          _c(
            "div",
            { staticClass: "dropdown-content" },
            _vm._l(_vm.value, function(item, index) {
              return _c(
                "a",
                {
                  key: index,
                  staticClass: "dropdown-item",
                  class: item.colorScheme,
                  attrs: {
                    focusable: false,
                    disabled: item.isDisabled ? item.isDisabled() : null
                  },
                  on: {
                    click: function($event) {
                      return _vm.emitAndClose(item.event, $event)
                    }
                  }
                },
                [
                  _c("b-icon", {
                    staticClass: "mr-2",
                    attrs: { icon: item.icon, pack: item.iconPack || "far" }
                  }),
                  _vm._v(" "),
                  _c("span", [
                    _vm._v("\n          " + _vm._s(item.label) + "\n        ")
                  ])
                ],
                1
              )
            }),
            0
          )
        ]
      )
    ]
  )
};
var __vue_staticRenderFns__$2 = [];
__vue_render__$2._withStripped = true;

  /* style */
  const __vue_inject_styles__$2 = function (inject) {
    if (!inject) return
    inject("data-v-0a72c126_0", { source: ".dropdown .dropdown-trigger .ellipsis[data-v-0a72c126] {\n  cursor: pointer;\n}\n.dropdown .dropdown-menu a.dropdown-item[data-v-0a72c126] {\n  color: #000000;\n  font-size: 0.8em;\n}\n.dropdown .dropdown-menu a.dropdown-item[data-v-0a72c126]:hover {\n  color: #1ab67e;\n  background-color: #e8f8f2;\n}\n.dropdown .dropdown-menu a.dropdown-item:hover .icon[data-v-0a72c126] {\n  color: #1ab67e;\n}\n.dropdown .dropdown-menu a.dropdown-item.danger[data-v-0a72c126]:hover {\n  color: #e54b4b;\n  background-color: #f5b7b7;\n}\n.dropdown .dropdown-menu a.dropdown-item.danger:hover .icon[data-v-0a72c126] {\n  color: #e54b4b;\n}\n.dropdown .dropdown-menu a.dropdown-item.info[data-v-0a72c126]:hover {\n  color: #5571f2;\n  background-color: #d8defc;\n}\n.dropdown .dropdown-menu a.dropdown-item.info:hover .icon[data-v-0a72c126] {\n  color: #5571f2;\n}\n\n/*# sourceMappingURL=ActionMenu.vue.map */", map: {"version":3,"sources":["C:\\_projects\\movici-flow-common\\src\\components\\global\\ActionMenu.vue","ActionMenu.vue"],"names":[],"mappings":"AAuEA;EACA,eAAA;ACtEA;AD2EA;EACA,cAAA;EACA,gBAAA;ACzEA;AD0EA;EACA,cAAA;EACA,yBAAA;ACxEA;ADyEA;EACA,cAAA;ACvEA;AD2EA;EACA,cAAA;EACA,yBAAA;ACzEA;AD0EA;EACA,cAAA;ACxEA;AD6EA;EACA,cAAA;EACA,yBAAA;AC3EA;AD4EA;EACA,cAAA;AC1EA;;AAEA,yCAAyC","file":"ActionMenu.vue","sourcesContent":["<template>\r\n  <div\r\n    tabindex=\"0\"\r\n    @blur=\"visible = false\"\r\n    class=\"dropdown dropdown-menu-animation is-mobile-modal\"\r\n  >\r\n    <div\r\n      ref=\"anchorRef\"\r\n      role=\"button\"\r\n      aria-haspopup=\"true\"\r\n      class=\"dropdown-trigger\"\r\n      @click=\"toggle\"\r\n    >\r\n      <span class=\"ellipsis\">\r\n        <b-icon size=\"is-small\" pack=\"far\" icon=\"ellipsis-v\"></b-icon>\r\n      </span>\r\n    </div>\r\n    <div ref=\"popupRef\" class=\"dropdown-menu\" :style=\"style\" v-show=\"visible\">\r\n      <div class=\"dropdown-content\">\r\n        <a\r\n          v-for=\"(item, index) in value\"\r\n          :key=\"index\"\r\n          :focusable=\"false\"\r\n          :disabled=\"item.isDisabled ? item.isDisabled() : null\"\r\n          :class=\"item.colorScheme\"\r\n          @click=\"emitAndClose(item.event, $event)\"\r\n          class=\"dropdown-item\"\r\n        >\r\n          <b-icon :icon=\"item.icon\" :pack=\"item.iconPack || 'far'\" class=\"mr-2\"></b-icon>\r\n          <span>\r\n            {{ item.label }}\r\n          </span>\r\n        </a>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</template>\r\n\r\n<script lang=\"ts\">\r\nimport { Component, Mixins, Prop, Ref } from 'vue-property-decorator';\r\nimport FixedPosition from '../../mixins/FixedPosition';\r\n\r\nexport interface ActionMenuItem {\r\n  icon?: string;\r\n  iconPack?: string;\r\n  label: string;\r\n  event: string;\r\n  colorScheme?: string;\r\n  isDisabled?: () => boolean;\r\n}\r\n\r\n@Component({ name: 'MovActionMenu' })\r\nexport default class MovActionMenu extends Mixins(FixedPosition) {\r\n  @Prop({ default: [] }) readonly value!: ActionMenuItem[];\r\n  @Ref('anchorRef') declare readonly anchorRef: HTMLElement;\r\n  @Ref('popupRef') declare readonly popupRef: HTMLElement;\r\n  adjust = {\r\n    top: -12,\r\n    left: 8\r\n  };\r\n\r\n  emitAndClose(event: string, value: unknown) {\r\n    this.$emit(event, value);\r\n    this.visible = false;\r\n  }\r\n}\r\n</script>\r\n\r\n<style scoped lang=\"scss\">\r\n.dropdown {\r\n  .dropdown-trigger {\r\n    .ellipsis {\r\n      cursor: pointer;\r\n    }\r\n  }\r\n\r\n  .dropdown-menu {\r\n    a.dropdown-item {\r\n      color: $black;\r\n      font-size: 0.8em;\r\n      &:hover {\r\n        color: $primary;\r\n        background-color: $primary-invert;\r\n        .icon {\r\n          color: $primary;\r\n        }\r\n      }\r\n      &.danger {\r\n        &:hover {\r\n          color: $danger;\r\n          background-color: $danger-invert;\r\n          .icon {\r\n            color: $danger;\r\n          }\r\n        }\r\n      }\r\n      &.info {\r\n        &:hover {\r\n          color: $info;\r\n          background-color: $info-invert;\r\n          .icon {\r\n            color: $info;\r\n          }\r\n        }\r\n      }\r\n    }\r\n  }\r\n}\r\n</style>\r\n",".dropdown .dropdown-trigger .ellipsis {\n  cursor: pointer;\n}\n.dropdown .dropdown-menu a.dropdown-item {\n  color: #000000;\n  font-size: 0.8em;\n}\n.dropdown .dropdown-menu a.dropdown-item:hover {\n  color: #1ab67e;\n  background-color: #e8f8f2;\n}\n.dropdown .dropdown-menu a.dropdown-item:hover .icon {\n  color: #1ab67e;\n}\n.dropdown .dropdown-menu a.dropdown-item.danger:hover {\n  color: #e54b4b;\n  background-color: #f5b7b7;\n}\n.dropdown .dropdown-menu a.dropdown-item.danger:hover .icon {\n  color: #e54b4b;\n}\n.dropdown .dropdown-menu a.dropdown-item.info:hover {\n  color: #5571f2;\n  background-color: #d8defc;\n}\n.dropdown .dropdown-menu a.dropdown-item.info:hover .icon {\n  color: #5571f2;\n}\n\n/*# sourceMappingURL=ActionMenu.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$2 = "data-v-0a72c126";
  /* module identifier */
  const __vue_module_identifier__$2 = undefined;
  /* functional template */
  const __vue_is_functional_template__$2 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$2 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    false,
    createInjector,
    undefined,
    undefined
  );

let MovLanguagePicker = class MovLanguagePicker extends vuePropertyDecorator.Vue {
    constructor() {
        super(...arguments);
        this.languages = ['en', 'nl'];
    }
    get language() {
        return flowUIStore.lang;
    }
    set language(newValue) {
        flowUIStore.setLanguage(newValue);
    }
    get label() {
        if (this.withLabel) {
            return upperFirst__default["default"]('' + this.$t('settings.selectLanguage'));
        }
        return '';
    }
};
__decorate([
    vuePropertyDecorator.Prop({ type: Boolean, default: false })
], MovLanguagePicker.prototype, "withLabel", void 0);
MovLanguagePicker = __decorate([
    vuePropertyDecorator.Component({ name: 'MovLanguagePicker' })
], MovLanguagePicker);
var script$1 = MovLanguagePicker;

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "b-field",
    { attrs: { label: _vm.label } },
    [
      _c(
        "b-select",
        {
          model: {
            value: _vm.language,
            callback: function($$v) {
              _vm.language = $$v;
            },
            expression: "language"
          }
        },
        _vm._l(_vm.languages, function(lang, i) {
          return _c("option", { key: "Lang" + i, domProps: { value: lang } }, [
            _vm._v(_vm._s(lang))
          ])
        }),
        0
      )
    ],
    1
  )
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  const __vue_inject_styles__$1 = function (inject) {
    if (!inject) return
    inject("data-v-3fa6c52e_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"LanguagePicker.vue"}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$1 = "data-v-3fa6c52e";
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$1 = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    createInjector,
    undefined,
    undefined
  );

let MovTooltipInfo = class MovTooltipInfo extends vuePropertyDecorator.Mixins(FixedPosition$1) {
    constructor() {
        super(...arguments);
        this.adjust = {
            top: 30,
            left: -80
        };
    }
};
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: '' })
], MovTooltipInfo.prototype, "text", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: 'info' })
], MovTooltipInfo.prototype, "icon", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: 'is-bottom' })
], MovTooltipInfo.prototype, "position", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: 'is-black' })
], MovTooltipInfo.prototype, "color", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: String, default: 'is-small' })
], MovTooltipInfo.prototype, "size", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Boolean, default: false })
], MovTooltipInfo.prototype, "active", void 0);
__decorate([
    vuePropertyDecorator.Prop({ type: Number, default: 0 })
], MovTooltipInfo.prototype, "delay", void 0);
__decorate([
    vuePropertyDecorator.Ref('anchorRef')
], MovTooltipInfo.prototype, "anchorRef", void 0);
__decorate([
    vuePropertyDecorator.Ref('popupRef')
], MovTooltipInfo.prototype, "popupRef", void 0);
MovTooltipInfo = __decorate([
    vuePropertyDecorator.Component({ name: 'MovTooltipInfo' })
], MovTooltipInfo);
var script = MovTooltipInfo;

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _c(
      "span",
      {
        staticClass: "b-tooltip is-white is-bottom is-medium",
        class: _vm.color
      },
      [
        _c(
          "div",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.visible,
                expression: "visible"
              }
            ],
            ref: "popupRef",
            staticClass: "tooltip-content",
            style: _vm.style
          },
          [
            _vm._t("tooltip-content", [
              _c("span", { staticClass: "is-size-7" }, [
                _vm._v("\n          " + _vm._s(_vm.text) + "\n        ")
              ])
            ])
          ],
          2
        ),
        _vm._v(" "),
        _c(
          "div",
          {
            ref: "anchorRef",
            staticClass: "tooltip-trigger",
            on: {
              mouseover: function($event) {
                return _vm.toggle(true)
              },
              mouseleave: function($event) {
                return _vm.toggle(false)
              }
            }
          },
          [
            !this.$slots.default
              ? _c("b-icon", { attrs: { icon: _vm.icon } })
              : _vm._e(),
            _vm._v(" "),
            _vm._t("default")
          ],
          2
        )
      ]
    )
  ])
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-75cb0c80_0", { source: ".icon[data-v-75cb0c80] {\n  font-size: 0.5rem;\n  border-radius: 100%;\n  height: 1rem;\n  width: 1rem;\n  line-height: 0.5rem;\n}\n\n/*# sourceMappingURL=TooltipInfo.vue.map */", map: {"version":3,"sources":["C:\\_projects\\movici-flow-common\\src\\components\\global\\TooltipInfo.vue","TooltipInfo.vue"],"names":[],"mappings":"AA8CA;EACA,iBAAA;EACA,mBAAA;EACA,YAAA;EACA,WAAA;EACA,mBAAA;AC7CA;;AAEA,0CAA0C","file":"TooltipInfo.vue","sourcesContent":["<template>\r\n  <div>\r\n    <span class=\"b-tooltip is-white is-bottom is-medium\" :class=\"color\">\r\n      <div class=\"tooltip-content\" v-show=\"visible\" ref=\"popupRef\" :style=\"style\">\r\n        <slot name=\"tooltip-content\">\r\n          <span class=\"is-size-7\">\r\n            {{ text }}\r\n          </span>\r\n        </slot>\r\n      </div>\r\n      <div\r\n        class=\"tooltip-trigger\"\r\n        ref=\"anchorRef\"\r\n        @mouseover=\"toggle(true)\"\r\n        @mouseleave=\"toggle(false)\"\r\n      >\r\n        <b-icon v-if=\"!this.$slots.default\" :icon=\"icon\"> </b-icon>\r\n        <slot></slot>\r\n      </div>\r\n    </span>\r\n  </div>\r\n</template>\r\n\r\n<script lang=\"ts\">\r\nimport { Component, Mixins, Prop, Ref } from 'vue-property-decorator';\r\nimport FixedPosition from '../../mixins/FixedPosition';\r\n\r\n@Component({ name: 'MovTooltipInfo' })\r\nexport default class MovTooltipInfo extends Mixins(FixedPosition) {\r\n  @Prop({ type: String, default: '' }) text!: string;\r\n  @Prop({ type: String, default: 'info' }) icon!: string;\r\n  @Prop({ type: String, default: 'is-bottom' }) position!: string;\r\n  @Prop({ type: String, default: 'is-black' }) color!: string;\r\n  @Prop({ type: String, default: 'is-small' }) size!: string;\r\n  @Prop({ type: Boolean, default: false }) active!: boolean;\r\n  @Prop({ type: Number, default: 0 }) delay!: number;\r\n  @Ref('anchorRef') declare readonly anchorRef: HTMLElement;\r\n  @Ref('popupRef') declare readonly popupRef: HTMLElement;\r\n  adjust = {\r\n    top: 30,\r\n    left: -80\r\n  };\r\n}\r\n</script>\r\n\r\n<style scoped lang=\"scss\">\r\n.icon {\r\n  font-size: 0.5rem;\r\n  border-radius: 100%;\r\n  height: 1rem;\r\n  width: 1rem;\r\n  line-height: 0.5rem;\r\n}\r\n</style>\r\n",".icon {\n  font-size: 0.5rem;\n  border-radius: 100%;\n  height: 1rem;\n  width: 1rem;\n  line-height: 0.5rem;\n}\n\n/*# sourceMappingURL=TooltipInfo.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__ = "data-v-75cb0c80";
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

var components = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MovMapVis: __vue_component__$5,
    MovDeck: __vue_component__$7,
    MovAction: __vue_component__$4,
    MovActionBar: __vue_component__$3,
    MovActionMenu: __vue_component__$2,
    MovLanguagePicker: __vue_component__$1,
    MovTooltipInfo: __vue_component__
});

function successMessage(message) {
    openSnackbar({
        message: message,
        type: 'is-success',
        duration: 3000
    });
}
function failMessage(message) {
    openSnackbar({
        message: message,
        type: 'is-danger',
        duration: 60000
    });
}
function openSnackbar(message) {
    buefy.SnackbarProgrammatic.open({
        type: 'is-success',
        position: 'is-top',
        queue: false,
        ...message
    });
}
var MovSnackBarProgramatic = {
    successMessage,
    failMessage
};

const registerComponent = (Vue, component) => {
    Vue.component(component.name, component);
};
const registerComponentProgrammatic = (Vue, property, component) => {
    if (!Vue.prototype.$flow)
        Vue.prototype.$flow = {};
    Vue.prototype.$flow[property] = component;
};

/*
Adapted from https://github.com/bernawil/axios-concurrency

Copyright (C) 2019 Bernardo Wilberger

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */
const ConcurrencyManager = (axios, MAX_CONCURRENT = 10) => {
    if (MAX_CONCURRENT < 1)
        throw 'Concurrency Manager Error: minimun concurrent requests is 1';
    const instance = {
        queue: [],
        running: [],
        shiftInitial: () => {
            setTimeout(() => {
                if (instance.running.length < MAX_CONCURRENT) {
                    instance.shift();
                }
            }, 0);
        },
        push: (reqHandler) => {
            instance.queue.push(reqHandler);
            instance.shiftInitial();
        },
        shift: () => {
            if (instance.queue.length) {
                const queued = instance.queue.shift();
                if (queued) {
                    queued.resolver(queued.request);
                    instance.running.push(queued);
                }
            }
        },
        // Use as interceptor. Queue outgoing requests
        requestHandler: (req) => {
            return new Promise(resolve => {
                instance.push({ request: req, resolver: resolve });
                return req;
            });
        },
        // Use as interceptor. Execute queued request upon receiving a response
        responseHandler: (res) => {
            instance.running.shift();
            instance.shift();
            return res;
        },
        responseErrorHandler: (res) => {
            return Promise.reject(instance.responseHandler(res));
        },
        interceptors: {
            request: -1,
            response: -1
        },
        detach: () => {
            axios.interceptors.request.eject(instance.interceptors.request);
            axios.interceptors.response.eject(instance.interceptors.response);
        }
    };
    // queue concurrent requests
    instance.interceptors.request = axios.interceptors.request.use(instance.requestHandler);
    instance.interceptors.response = axios.interceptors.response.use(instance.responseHandler, instance.responseErrorHandler);
    return instance;
};

class Client {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.apiToken = config.apiToken || null;
        this.http = axios__default["default"].create();
        this.onError = config.defaultCallbacks ?? {};
        if (config.concurrency) {
            ConcurrencyManager(this.http, config.concurrency);
        }
    }
    downloadAsFile(data, filename) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
    async request(request, onError) {
        try {
            const resp = await this.http.request(request.generateConfig(this));
            return request.makeResponse(resp);
        }
        catch (e) {
            this.handleError(e, onError || {});
            return null;
        }
    }
    handleError(e, onError) {
        const handlers = { ...this.onError, ...onError };
        if (axios__default["default"].isAxiosError(e)) {
            const payload = parseHTTPError(e);
            if (payload.status && handlers[payload.status]) {
                return handlers[payload.status](payload);
            }
            if (handlers.http) {
                return handlers.http(payload);
            }
        }
        if (handlers.all) {
            return handlers.all(e);
        }
        throw e;
    }
}
const HTTPS_STATUS_CODES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
    502: 'Bad Gateway'
};
function parseHTTPError(err) {
    let status = undefined;
    let message = '';
    if (err.response) {
        status = err.response.status;
        message = JSON.stringify(err.response.data.message);
    }
    if (!message) {
        message = status ? HTTPS_STATUS_CODES[status] : 'Unknown Error';
    }
    return { status, message };
}

class BaseRequest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateConfig(client) {
        return this.makeRequest();
    }
    makeResponse(resp) {
        return resp.data;
    }
}
class Request extends BaseRequest {
    generateConfig(client) {
        const baseURL = client.baseURL, request = this.makeRequest();
        return {
            baseURL,
            headers: client.apiToken ? { Authorization: client.apiToken } : {},
            ...request
        };
    }
}

const dataEngineBase = '/data-engine/v4';
const geocodeBase = '/geocoder/v1';
var uri = {
    activate: '/user/activate',
    activityLogs: '/activity_logs',
    autocomplete: '/autocomplete',
    analysisPlot: '/analysis/plot',
    control: '/control',
    data: '/data',
    datasets: '/datasets',
    dataset_types: '/dataset_types',
    entity_types: '/entity_types',
    feedback_form: '/feedback/submit',
    forgotpassword: '/user/forgot-password',
    generate: '/generate',
    generators: '/generators',
    initdata: '/init_data',
    invite: '/invite',
    login: '/user/login',
    logout: '/user/logout',
    logs: '/logs',
    map: '/map',
    modelTypes: '/model_types',
    organisations: '/organisations',
    projects: '/projects',
    profile: '/user/profile',
    property_types: '/property_types',
    resetpassword: '/user/reset-password',
    results: '/results',
    reverseSearch: '/reverse_search',
    roles: '/roles',
    runSimulation: '/run-simulation',
    scenarios: '/scenarios',
    schema: '/schema',
    scopes: '/scopes',
    search: '/search',
    simulations: '/simulations',
    state: '/state',
    summary: '/summary',
    timeline: '/timeline',
    updates: '/updates',
    users: '/users',
    validateAuth: '/auth',
    views: '/views',
    workloads: '/workloads'
};

class GetDatasets extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`
        };
    }
    makeResponse(resp) {
        return resp.data.datasets.map((d) => new Dataset(d));
    }
}
class GetDataset extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
}
class AddDataset extends Request {
    constructor(projectUUID, dataset) {
        super();
        this.projectUUID = projectUUID;
        this.dataset = dataset;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`,
            data: this.dataset
        };
    }
}
class UpdateDataset extends Request {
    constructor(datasetUUID, dataset) {
        super();
        this.datasetUUID = datasetUUID;
        this.dataset = dataset;
    }
    makeRequest() {
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`,
            data: {
                name: this.dataset.name,
                type: this.dataset.type
            }
        };
    }
}
class DeleteDataset extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
        };
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class GetDatasetData extends Request {
    constructor(datasetUUID, entityGroup, properties) {
        super();
        this.datasetUUID = datasetUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties)
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
}
class GetDatasetDataAsBlob extends Request {
    constructor(datasetUUID, entityGroup, properties) {
        super();
        this.datasetUUID = datasetUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties),
            responseType: 'blob'
        };
    }
    makeResponse(resp) {
        return {
            data: resp.data,
            contentType: resp.headers['content-type']
        };
    }
}
class AddDatasetData extends Request {
    constructor(datasetUUID, file, onProgress) {
        super();
        this.datasetUUID = datasetUUID;
        this.file = file;
        this.onProgress = onProgress;
    }
    makeRequest() {
        const form = new FormData();
        form.append('data', this.file);
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}/data`,
            data: form,
            onUploadProgress: this.onProgress
        };
    }
}
class DeleteDatasetData extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}/data`
        };
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class GetScenarioState extends Request {
    constructor(datasetUUID, scenarioUUID, entityGroup, properties, timestamp) {
        super();
        this.datasetUUID = datasetUUID;
        this.scenarioUUID = scenarioUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
        this.timestamp = timestamp;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.state}`,
            params: this.getStateFilterParams()
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
    getStateFilterParams() {
        const params = getDatasetFilterParams(this.entityGroup, this.properties);
        params.dataset_uuid = this.datasetUUID;
        if (this.timestamp !== undefined) {
            params.timestamp = this.timestamp;
        }
        return params;
    }
}
function getDatasetFilterParams(entityGroup, properties) {
    if (!entityGroup) {
        return {};
    }
    if (!properties?.length) {
        return {
            entity_group: entityGroup
        };
    }
    const components = new Set();
    const props = new Set();
    properties.forEach(p => {
        if (p.component) {
            components.add(p.component);
        }
        props.add(p.name);
    });
    return {
        entity_group: entityGroup,
        properties: Array.from(props).join(','),
        components: components.size ? Array.from(components).join(',') : undefined
    };
}
class GetDatasetMapThumbnail extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
            params: { thumbnail: 'true' },
            responseType: 'arraybuffer'
        };
    }
}
class GetDatasetMap extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
            params: { thumbnail: 'false' },
            responseType: 'arraybuffer'
        };
    }
    makeResponse(resp) {
        return {
            data: resp.data,
            contentType: resp.headers['content-type']
        };
    }
}

class GetGeocodeSuggestions extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.autocomplete}`,
            data: this.query
        };
    }
    makeResponse(resp) {
        return resp.data.results;
    }
}
class GetGeocodeResults extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.search}`,
            data: this.query
        };
    }
    makeResponse(resp) {
        return resp.data.results;
    }
}
class GetGeocodeResult extends Request {
    constructor(resultUUID) {
        super();
        this.resultUUID = resultUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${geocodeBase}${uri.results}/${this.resultUUID}`
        };
    }
    makeResponse(resp) {
        return resp.data;
    }
}
class GetGeocodeAddress extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.reverseSearch}`,
            data: this.query
        };
    }
}

class GetProjects extends Request {
    constructor() {
        super();
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}`
        };
    }
    makeResponse(resp) {
        return resp.data.projects;
    }
}
class GetProject extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
        };
    }
}
class AddProject extends Request {
    constructor(payload) {
        super();
        this.payload = payload;
    }
    makeRequest() {
        delete this.payload.uuid;
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}`,
            data: this.payload
        };
    }
}
class UpdateProject extends Request {
    constructor(projectUUID, payload) {
        super();
        this.payload = payload;
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`,
            data: { display_name: this.payload.display_name }
        };
    }
}
class DeleteProject extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
        };
    }
}

class GetScenarios extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`
        };
    }
    makeResponse(resp) {
        return resp.data.scenarios;
    }
}
class GetScenario extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
        };
    }
    makeResponse(resp) {
        const data = resp.data;
        data.has_simulation = data.has_simulation ? data.has_simulation : false;
        return data;
    }
}
class AddScenario extends Request {
    constructor(projectUUID, payload) {
        super();
        this.payload = payload;
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        delete this.payload.has_simulation;
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`,
            data: this.payload
        };
    }
}
class UpdateScenario extends Request {
    constructor(scenarioUUID, payload) {
        super();
        this.payload = payload;
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        delete this.payload.has_simulation;
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`,
            data: this.payload
        };
    }
}
class DeleteScenario extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
        };
    }
}
class GetTimelineInfo extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
        };
    }
}
class DeleteTimeline extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
        };
    }
}

class GetDatasetSummary extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.summary}`
        };
    }
}
class GetScenarioSummary extends Request {
    constructor(scenarioUUID, datasetUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.summary}`,
            params: {
                dataset_uuid: this.datasetUUID
            }
        };
    }
}
class GetUpdateSummary extends Request {
    constructor(updateUUID) {
        super();
        this.updateUUID = updateUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.updates}/${this.updateUUID}${uri.summary}`
        };
    }
}

class GetUpdates extends Request {
    constructor(scenarioUUID, filter) {
        super();
        this.scenarioUUID = scenarioUUID;
        this.timelineFilter = filter ?? {};
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.updates}`,
            params: this.timelineFilter
        };
    }
    makeResponse(resp) {
        return resp.data.updates;
    }
}
class GetUpdateWithData extends Request {
    constructor(updateUUID, entityGroup, properties) {
        super();
        this.updateUUID = updateUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties)
        };
    }
}
class GetUpdateAsBlob extends Request {
    constructor(updateUUID, entityGroup, properties) {
        super();
        this.updateUUID = updateUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties),
            responseType: 'blob'
        };
    }
}

class GetViews extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.views}`
        };
    }
    makeResponse(resp) {
        return resp.data.views;
    }
}
class GetView extends Request {
    constructor(viewUUID) {
        super();
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`
        };
    }
}
class AddView extends Request {
    constructor(scenarioUUID, payload) {
        super();
        this.payload = payload;
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.views}`,
            data: this.payload
        };
    }
}
class UpdateView extends Request {
    constructor(viewUUID, payload) {
        super();
        this.payload = payload;
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`,
            data: this.payload
        };
    }
}
class DeleteView extends Request {
    constructor(viewUUID) {
        super();
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`
        };
    }
}

function getFlowRoutes(baseURL) {
    return [
        {
            path: baseURL,
            name: 'FlowMain',
            redirect: { name: 'FlowProjects' },
            component: FlowMain__default["default"],
            children: [
                {
                    path: 'workspace',
                    name: 'FlowProjects',
                    component: FlowProjects__default["default"],
                    props: (route) => {
                        const { project } = route.query;
                        return { currentProjectName: project };
                    }
                },
                {
                    path: 'datasets',
                    name: 'FlowDatasets',
                    component: FlowDatasets__default["default"],
                    props: (route) => {
                        const { project } = route.query;
                        return { currentProjectName: project };
                    }
                },
                {
                    path: 'scenario',
                    name: 'FlowScenario',
                    component: FlowScenario__default["default"],
                    props: (route) => {
                        const { project, scenario } = route.query;
                        return { currentProjectName: project, currentScenarioName: scenario };
                    }
                },
                {
                    path: 'visualization',
                    name: 'FlowVisualization',
                    component: FlowVisualization__default["default"],
                    props: (route) => {
                        const { project, scenario, view } = route.query;
                        return {
                            currentProjectName: project,
                            currentScenarioName: scenario,
                            currentViewUUID: view
                        };
                    }
                },
                {
                    path: 'export',
                    name: 'FlowExport',
                    component: FlowExport__default["default"],
                    props: (route) => {
                        const { project, scenario, view } = route.query;
                        return {
                            currentProjectName: project,
                            currentScenarioName: scenario,
                            currentViewUUID: view
                        };
                    }
                }
            ]
        }
    ];
}

var locales = require.context('.', true, /[A-Za-z0-9-_,\s]+\.json$/i);

Vue__default["default"].use(VueI18n__default["default"]);
function loadLocaleMessages() {
    const messages = {};
    locales.keys().forEach(key => {
        const matched = key.match(/([A-Za-z0-9-_]+)\./i);
        if (matched && matched.length > 1) {
            const locale = matched[1];
            messages[locale] = locales(key);
        }
    });
    return messages;
}
new VueI18n__default["default"]({
    locale: process.env.VUE_APP_I18N_LOCALE || 'en',
    fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
    messages: loadLocaleMessages()
});

var main = (() => {
    const Flow_ = {
        install(Vue) {
            // Options
            // setOptions(merge(config, options, true))
            // Components
            Object.values(components).forEach(component => {
                registerComponent(Vue, component);
            });
            registerComponentProgrammatic(Vue, 'snackbar', MovSnackBarProgramatic);
        }
    };
    return Flow_;
})();

exports.ActiveEntityLayerSettings = ActiveEntityLayerSettings;
exports.AddDataset = AddDataset;
exports.AddDatasetData = AddDatasetData;
exports.AddProject = AddProject;
exports.AddScenario = AddScenario;
exports.AddView = AddView;
exports.BaseRequest = BaseRequest;
exports.Client = Client;
exports.ColorByValueLegendItem = ColorByValueLegendItem;
exports.ColorLegendItem = ColorLegendItem;
exports.ColorMapLayerSettings = ColorMapLayerSettings;
exports.ColorStaticLegendItem = ColorStaticLegendItem;
exports.Dataset = Dataset;
exports.DatasetWithData = DatasetWithData;
exports.DeleteDataset = DeleteDataset;
exports.DeleteDatasetData = DeleteDatasetData;
exports.DeleteProject = DeleteProject;
exports.DeleteScenario = DeleteScenario;
exports.DeleteTimeline = DeleteTimeline;
exports.DeleteView = DeleteView;
exports.GetDataset = GetDataset;
exports.GetDatasetData = GetDatasetData;
exports.GetDatasetDataAsBlob = GetDatasetDataAsBlob;
exports.GetDatasetMap = GetDatasetMap;
exports.GetDatasetMapThumbnail = GetDatasetMapThumbnail;
exports.GetDatasetSummary = GetDatasetSummary;
exports.GetDatasets = GetDatasets;
exports.GetGeocodeAddress = GetGeocodeAddress;
exports.GetGeocodeResult = GetGeocodeResult;
exports.GetGeocodeResults = GetGeocodeResults;
exports.GetGeocodeSuggestions = GetGeocodeSuggestions;
exports.GetProject = GetProject;
exports.GetProjects = GetProjects;
exports.GetScenario = GetScenario;
exports.GetScenarioState = GetScenarioState;
exports.GetScenarioSummary = GetScenarioSummary;
exports.GetScenarios = GetScenarios;
exports.GetTimelineInfo = GetTimelineInfo;
exports.GetUpdateAsBlob = GetUpdateAsBlob;
exports.GetUpdateSummary = GetUpdateSummary;
exports.GetUpdateWithData = GetUpdateWithData;
exports.GetUpdates = GetUpdates;
exports.GetView = GetView;
exports.GetViews = GetViews;
exports.HeatmapLayerSettings = HeatmapLayerSettings;
exports.MovAction = __vue_component__$4;
exports.MovActionBar = __vue_component__$3;
exports.MovActionMenu = __vue_component__$2;
exports.MovDeck = __vue_component__$7;
exports.MovLanguagePicker = __vue_component__$1;
exports.MovMapVis = __vue_component__$5;
exports.MovTooltipInfo = __vue_component__;
exports.MoviciError = MoviciError;
exports.Request = Request;
exports.Scope = Scope;
exports.ScopeCollection = ScopeCollection;
exports.StaticColorLayerSettings = StaticColorLayerSettings;
exports.UnknownLayerSettings = UnknownLayerSettings;
exports.UpdateDataset = UpdateDataset;
exports.UpdateProject = UpdateProject;
exports.UpdateScenario = UpdateScenario;
exports.UpdateView = UpdateView;
exports.ValidationError = ValidationError;
exports.copyToClipboard = copyToClipboard;
exports["default"] = main;
exports.getBaseURL = getBaseURL;
exports.getClassFromStatus = getClassFromStatus;
exports.getDatasetFilterParams = getDatasetFilterParams;
exports.getEntitySummary = getEntitySummary;
exports.getFlowRoutes = getFlowRoutes;
exports.getStatusFromScenarioAndSimulation = getStatusFromScenarioAndSimulation;
exports.hasOwnProperty = hasOwnProperty;
exports.parsePropertyString = parsePropertyString;
exports.propertyString = propertyString;
exports.reverseTransform = reverseTransform;
exports.transform = transform;
exports.transformArray = transformArray;
exports.transformGeoJsonToCRS = transformGeoJsonToCRS;
//# sourceMappingURL=index.js.map
