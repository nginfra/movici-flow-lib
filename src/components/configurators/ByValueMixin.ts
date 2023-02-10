import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import { DatasetSummary, PropertySummary } from '@movici-flow-common/types';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import { Component, Mixins, Prop } from 'vue-property-decorator';

@Component
export default class ByValueMixin<D> extends Mixins(ValidationProvider) {
  @Prop({ type: Object }) readonly value?: D;

  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  @Prop({ type: Object, default: null }) readonly selectedAttribute!: PropertySummary | null;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;

  emitClause(byValue: D) {
    this.$emit('input', byValue);
  }
}
