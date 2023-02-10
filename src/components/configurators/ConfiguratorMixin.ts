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
export default class AttributeMixin<T> extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: T;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  selectedAttribute: PropertySummary | null = null;
  allowedPropertyTypes!: string[];

  get filteredEntityProps() {
    return this.entityProps.filter(this.filterProp);
  }

  ensureProp(prop: PropertySummary) {
    const found = this.filteredEntityProps.find(entityProp => prop.name === entityProp.name);
    if (found) {
      this.validated('selectedAttribute', found);
    } else {
      throw new MoviciError('Invalid attribute selected');
    }
  }

  filterProp(prop: PropertyType) {
    return this.allowedPropertyTypes.indexOf(prop.data_type) !== -1;
  }

  /**
   * Makes sure attribute coming from value is on the filtered entity props and sets to selectedAttribute
   * @param attributeFromValue query attribute
   */
  pickSelectedEntityProp(attributeFromValue: PropertySummary | null) {
    this.selectedAttribute =
      this.filteredEntityProps.find(attr => {
        return (
          attr.component == attributeFromValue?.component && attr.name == attributeFromValue?.name
        );
      }) ?? null;
  }
}
