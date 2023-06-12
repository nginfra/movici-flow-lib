import type { App } from "vue";
import * as components from "./components";
import { useMoviciSettings } from "./baseComposables/useMoviciSettings";

import type { RouteLocationRaw } from "vue-router";
import orugaConfig from "./orugaConfig";

function registerComponent(Vue: App, component: typeof Vue, name: string) {
  Vue.component(name, component);
}

interface FlowPluginOptions {
  homeRoute: RouteLocationRaw;
}
export default {
  install(Vue: App, options?: Partial<FlowPluginOptions>) {
    Object.entries(components).forEach(([name, component]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerComponent(Vue, component as any, name);
    });
    options && useMoviciSettings().updateSettings(options);
  },
};

export { orugaConfig };
