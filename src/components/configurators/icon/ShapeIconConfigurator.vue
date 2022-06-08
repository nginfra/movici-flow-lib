<template>
  <div>
    <span v-if="errors['shapeOrIcon']" class="error is-block is-size-7 has-text-danger mb-2">
      {{ errors['shapeOrIcon'] }}
    </span>
    <ShapeConfigurator class="mt-2" v-model="shapeSettings" :entityProps="entityProps" />
    <hr />
    <IconConfigurator class="mt-2" v-model="iconSettings" :entityProps="entityProps" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';
import IconConfigurator from './IconConfigurator.vue';
import ShapeConfigurator from './ShapeConfigurator.vue';
import { IconClause, PropertySummary } from '@movici-flow-common/types';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator from '@movici-flow-common/utils/FormValidator';

@Component({
  name: 'ShapeIconConfigurator',
  components: {
    IconConfigurator,
    ShapeConfigurator
  }
})
export default class ShapeIconConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: null }) readonly shapeClause!: IconClause | null;
  @Prop({ type: Object, default: null }) readonly iconClause!: IconClause | null;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;

  get shapeSettings() {
    return this.shapeClause;
  }

  set shapeSettings(shape: IconClause | null) {
    this.validator.touch('shapeOrIcon');
    this.$emit('input', { shape, icon: this.iconClause });
  }

  get iconSettings() {
    return this.iconClause;
  }

  set iconSettings(icon: IconClause | null) {
    this.validator.touch('shapeOrIcon');
    this.$emit('input', { shape: this.shapeClause, icon });
  }

  get hasShape() {
    return !!(this.shapeClause?.static ?? this.shapeClause?.byValue);
  }

  get hasIcon() {
    return !!(this.iconClause?.static ?? this.iconClause?.byValue);
  }

  setupValidator() {
    this.validator?.configure({
      validators: {
        shapeOrIcon: () => {
          if (!this.hasShape && !this.hasIcon) {
            return 'You need to pick at least one icon, shape or a combination of both.';
          }
        }
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  mounted() {
    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
hr {
  margin: 1rem 0;
}
</style>
