import type {
  AttributeSummary,
  DatasetSummary,
  FlowVisualizerType,
} from "@movici-flow-lib/types";
import type { FormValidator } from "@movici-flow-lib/utils/FormValidator";

export interface VisualizerConfiguratorProps<T> {
  modelValue?: T;
  geometry: FlowVisualizerType;
  validator: FormValidator;
  attributes: AttributeSummary[];
  summary: DatasetSummary;
}
