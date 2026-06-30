import type { ViewState } from "@movici-flow-lib/types";
import merge from "lodash/merge";
import { reactive } from "vue";
import type { RouteLocationRaw } from "vue-router";

interface MoviciSettings {
  homeRoute: RouteLocationRaw;
  defaultViewState: ViewState;
  defaultViewName: string;
  mapboxToken: string;
}
const settings: MoviciSettings = reactive<MoviciSettings>({
  homeRoute: "/",
  mapboxToken: "",
  defaultViewState: {
    latitude: 52.18,
    longitude: 5.2,
    zoom: 6.75,
    bearing: 0,
    pitch: 0,
  },
  defaultViewName: "Untitled",
});

export function useMoviciSettings() {
  function updateSettings(obj: Partial<MoviciSettings>) {
    merge(settings, obj);
  }
  return { settings, updateSettings };
}
