import { MoviciError } from '@movici-flow-common/errors';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import {
  DatasetSummary,
  FlowVisualizerType,
  PropertySummary,
  PropertyType
} from '@movici-flow-common/types';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import { Component, Mixins, Prop } from 'vue-property-decorator';

@Component
export default class ByValueMixin<D> extends Mixins(ValidationProvider) {
  @Prop({ type: Object }) readonly value?: D;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  selectedEntityProp: PropertySummary | null = null;
  allowedPropertyTypes: string[] = [];

  get filteredEntityProps() {
    return this.entityProps.filter(this.filterProp);
  }

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

  ensureProp(prop: PropertySummary) {
    const found = this.filteredEntityProps.find(entityProp => prop.name === entityProp.name);
    if (found) {
      this.validated('selectedEntityProp', found);
    } else {
      throw new MoviciError('Invalid attribute selected');
    }
  }

  filterProp(prop: PropertyType) {
    return this.allowedPropertyTypes.indexOf(prop.data_type) !== -1;
  }

  emitClause(byValue: D) {
    this.$emit('input', byValue);
  }

  /**
   * Makes sure attribute coming from value is on the filtered entity props and sets to selectedEntityProp
   * @param attributeFromValue query attribute
   */
  pickSelectedEntityProp(attributeFromValue: PropertySummary | null) {
    this.selectedEntityProp =
      this.filteredEntityProps.find(attr => {
        return (
          attr.component == attributeFromValue?.component && attr.name == attributeFromValue?.name
        );
      }) ?? null;
  }

  getAttributeValidator() {
    return {
      selectedEntityProp: () => {
        if (!this.filteredEntityProps?.length) {
          return '' + this.$t('flow.visualization.errorDisplayAs');
        }

        if (!this.selectedEntityProp) {
          return 'Please select an attribute for the configurator to be based on';
        }
      }
    };
  }
}
