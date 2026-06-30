import type { App } from "vue";
import "./assets/sass/style.scss";
import "./assets/sass/helpers.scss";
import * as components from "./components";
import { useMoviciSettings } from "./baseComposables/useMoviciSettings";

import type { RouteLocationRaw } from "vue-router";
import Oruga, { OrugaComponentPlugins } from "@oruga-ui/oruga-next";
import { bulmaConfig } from "@oruga-ui/theme-bulma";
import merge from "lodash/merge";
import orugaConfig from "./orugaConfig";

function registerComponent(Vue: App, component: typeof Vue, name: string) {
  Vue.component(name, component);
}

interface FlowPluginOptions {
  homeRoute: RouteLocationRaw;
  mapboxToken: string;
}
export default {
  install(Vue: App, options?: Partial<FlowPluginOptions>) {
    // Oruga 0.13: install the config and every component plugin (this also wires
    // the programmatic API — oruga.modal / oruga.notification). The Flow plugin
    // owns the Oruga setup so consumers only need `app.use(Flow)`.
    Vue.use(Oruga, merge({}, bulmaConfig, orugaConfig));
    OrugaComponentPlugins.forEach((plugin) => Vue.use(plugin, { oruga: Oruga }));

    Object.entries(components).forEach(([name, component]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerComponent(Vue, component as any, name);
    });
    options && useMoviciSettings().updateSettings(options);
  },
};

export { orugaConfig };
