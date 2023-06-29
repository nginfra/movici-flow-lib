import type {
  AttributeSummary,
  DatasetSummary,
  FlowVisualizerOptions,
  FlowVisualizerType,
  ScenarioDataset,
} from "@movici-flow-lib/types";
import type { IFormValidator } from "@movici-flow-lib/utils/FormValidator";
import type { InjectionKey, Ref } from "vue";

type ReactiveInjectionKey<T> = InjectionKey<Ref<T>>;

export const attributesInjection = Symbol("attributes") as ReactiveInjectionKey<
  AttributeSummary[] | undefined
>;
export const datasetsInjection = Symbol("datasets") as ReactiveInjectionKey<ScenarioDataset[]>;
export const geometryInjection = Symbol("geometry") as ReactiveInjectionKey<FlowVisualizerType>;
export const settingsInjection = Symbol(
  "settings"
) as ReactiveInjectionKey<FlowVisualizerOptions | null>;
export const summaryInjection = Symbol("summary") as ReactiveInjectionKey<DatasetSummary>;
export const validatorInjection = Symbol("validator") as InjectionKey<IFormValidator>;
