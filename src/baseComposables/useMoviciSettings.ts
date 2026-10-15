import type { ViewState } from "@movici-flow-lib/types";
import mergeWith from "lodash/mergeWith";
import { reactive } from "vue";
import type { RouteLocationRaw } from "vue-router";

interface MoviciSettings {
  homeRoute: RouteLocationRaw;
  defaultViewState: ViewState;
  defaultViewName: string;
  restrictedAttributes: string[];
}

const settings: MoviciSettings = reactive<MoviciSettings>({
  homeRoute: "/",
  defaultViewState: {
    latitude: 52.18,
    longitude: 5.2,
    zoom: 6.75,
    bearing: 0,
    pitch: 0,
  },
  defaultViewName: "Untitled",
  restrictedAttributes: [],
});

export function useMoviciSettings() {
  function updateSettings(obj: Partial<MoviciSettings>) {
    mergeWith(settings, obj, (_target, source) => (Array.isArray(source) ? source : undefined));
  }
  return { settings, updateSettings };
}
