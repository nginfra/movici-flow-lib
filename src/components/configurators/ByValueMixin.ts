import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import { DatasetSummary, FlowVisualizerType, PropertySummary } from '@movici-flow-common/types';
import { Component, Mixins, Prop } from 'vue-property-decorator';

@Component
export default class ByValueMixin<D> extends Mixins(ValidationProvider) {
  @Prop({ type: Object }) readonly value?: D;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  selectedEntityProp!: PropertySummary | null;

  get selectedDataType() {
    return this.selectedEntityProp?.data_type;
  }

  get minValue() {
    return this.selectedEntityProp?.min_val ?? 0;
  }

  get maxValue() {
    return this.selectedEntityProp?.max_val ?? 1;
  }

  get defaultDataTypeSteps(): number {
    switch (this.selectedDataType) {
      case 'BOOLEAN':
        return 2;
      case 'INT':
      case 'DOUBLE':
      default:
        return 4;
    }
  }

  emitClause(byValue: D) {
    this.$emit('input', byValue);
  }
}
