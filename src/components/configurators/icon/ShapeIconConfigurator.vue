<template>
  <div>
    <span v-if="errors['shape-or-icon']" class="error is-block is-size-7 has-text-danger mb-2">
      {{ errors['shape-or-icon'] }}
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

import { IconClause, PropertyType } from '@movici-flow-common/types';
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
  @Prop([Object]) readonly shapeClause!: IconClause | null;
  @Prop([Object]) readonly iconClause!: IconClause | null;
  @Prop([Array]) readonly entityProps!: PropertyType[];
  @Prop([String]) readonly name!: string;
  @Prop([Object]) declare validator: FormValidator;

  get shapeSettings() {
    return this.shapeClause;
  }

  set shapeSettings(toEmit: IconClause | null) {
    this.validator.touch('shape-or-icon', this.name);
    this.$emit('input', { shape: toEmit, icon: this.iconClause });
  }

  get iconSettings() {
    return this.iconClause;
  }

  set iconSettings(toEmit: IconClause | null) {
    this.validator.touch('shape-or-icon', this.name);
    this.$emit('input', { shape: this.shapeClause, icon: toEmit });
  }

  get hasShape() {
    return !!(this.shapeClause?.static ?? this.shapeClause?.byValue);
  }

  get hasIcon() {
    return !!(this.iconClause?.static ?? this.iconClause?.byValue);
  }

  setupValidator() {
    this.validator.addModule({
      name: this.name,
      validators: {
        'shape-or-icon': () => {
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
