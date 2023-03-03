<template>
  <div>
    <div class="columns mt-2 mb-0 is-multiline" v-if="units === 'meters'">
      <div class="column pb-0 is-flex is-two-thirds-desktop is-full-tablet min-max-px">
        <o-field
          class="mr-4 mb-0"
          :label="$t('flow.visualization.sizeConfig.minPixels')"
          :variant="errors['minPixels'] && 'danger'"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <MovNumberinput v-model="minPixels_" size="small" />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </o-field>
        <o-field
          class="mb-0"
          :label="$t('flow.visualization.sizeConfig.maxPixels')"
          :variant="errors['maxPixels'] && 'danger'"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <MovNumberinput v-model="maxPixels_" size="small" />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </o-field>
      </div>
    </div>
    <div class="errors">
      <p class="has-text-danger is-size-7 mt-1" v-for="(error, key) in errors" :key="key">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator, { isPositive } from '@movici-flow-common/utils/FormValidator';

@Component({ name: 'MinMaxPixels' })
export default class MinMaxPixels extends Mixins(ValidationProvider) {
  @Prop({ type: Number, default: null }) readonly minPixels!: number | null;
  @Prop({ type: Number, default: null }) readonly maxPixels!: number | null;
  @Prop({ type: String }) readonly units!: string;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;

  get minPixels_() {
    return this.minPixels;
  }

  set minPixels_(val: number | null) {
    this.validator?.touch('minPixels');
    this.$emit('update:minPixels', val);
  }

  get maxPixels_() {
    return this.maxPixels;
  }

  set maxPixels_(val: number | null) {
    this.validator?.touch('maxPixels');
    this.$emit('update:maxPixels', val);
  }

  @Watch('units')
  afterUnits(curr: 'pixels' | 'meters', old: 'pixels' | 'meters') {
    if (curr !== old) {
      this.validator?.touch('minPixels');
      this.validator?.touch('maxPixels');
    }
  }

  setupValidator() {
    this.validator?.configure({
      validators: {
        minPixels: () => {
          if (this.units === 'pixels') return;
          return isPositive(this.minPixels, 'Min size');
        },

        maxPixels: () => {
          if (this.units === 'pixels') return;
          return isPositive(this.maxPixels, 'Max size');
        },

        minMaxPixels: {
          depends: ['minPixels', 'maxPixels'],
          validator: () => {
            if (this.units === 'pixels') return;
            if (
              this.minPixels != undefined &&
              this.maxPixels != undefined &&
              this.minPixels > this.maxPixels
            )
              return 'Max size must be at least min size.';
          }
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  created() {
    this.setupValidator();
  }

  beforeDestroy() {
    this.destroyValidator();
  }
}
</script>

<style scoped lang="scss">
::v-deep {
  .numberinput {
    max-width: 4.5rem;
  }
  .field {
    .field {
      margin-bottom: 0;
    }
  }
}
</style>
