<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column pb-0 is-half-desktop is-full-tablet size">
        <div class="is-flex">
          <o-field
            class="mb-0"
            :label="$t('flow.visualization.sizeConfig.size')"
            :variant="errors['size'] && 'danger'"
          >
            <MovNumberinput :value="size" @input="validated('size', $event)" size="small" />
          </o-field>
          <o-field class="is-flex-grow-1 ml-4" :label="$t('flow.visualization.displayAs')">
            <o-radio
              :value="units"
              @input="validated('units', $event)"
              native-value="meters"
              size="small"
              class="mr-4"
            >
              {{ $t('units.meters') }}
            </o-radio>
            <o-radio
              :value="units"
              @input="validated('units', $event)"
              native-value="pixels"
              size="small"
            >
              {{ $t('units.pixels') }}
            </o-radio>
          </o-field>
        </div>
        <p class="has-text-danger is-size-7 my-1" v-if="errors.size">{{ errors.size }}</p>
      </div>
    </div>
    <MinMaxPixels
      v-if="currentClause.units === 'meters'"
      :minPixels.sync="minPixels"
      :maxPixels.sync="maxPixels"
      :units="currentClause.units"
      :validator="minMaxPixelsValidator"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { StaticSizeClause, SizeClause, FlowVisualizerType } from '@movici-flow-common/types';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator, { isPositive } from '@movici-flow-common/utils/FormValidator';
import MinMaxPixels from './MinMaxPixels.vue';
@Component({
  name: 'SizeStaticConfigurator',
  components: {
    MinMaxPixels
  }
})
export default class SizeStaticConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: SizeClause;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  size = 2;
  units: 'pixels' | 'meters' = 'pixels';
  minPixels: number | null = null;
  maxPixels: number | null = null;

  get minMaxPixelsValidator() {
    return this.validator?.child('minMaxPixels');
  }

  get currentClause(): StaticSizeClause {
    const rv: StaticSizeClause = {
      size: this.size,
      units: this.units
    };

    if (this.minPixels !== null) {
      rv.minPixels = this.minPixels;
    }

    if (this.maxPixels !== null) {
      rv.maxPixels = this.maxPixels;
    }

    return rv;
  }

  get defaults() {
    switch (this.geometry) {
      case FlowVisualizerType.ICONS:
        return {
          size: 20,
          units: 'pixels',
          minPixels: 5,
          maxPixels: 100
        };
      default:
        return {
          size: 5,
          units: 'pixels',
          minPixels: 2,
          maxPixels: 5
        };
    }
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.$emit('input', { static: this.currentClause });
    }
  }

  setupValidator() {
    this.validator?.configure({
      validators: {
        size: () => isPositive(this.currentClause.size, 'Size')
      },
      onValidate: e => (this.errors = e)
    });
  }

  created() {
    const localValue: StaticSizeClause = Object.assign({}, this.defaults, this.value.static);

    this.size = localValue.size;
    this.units = localValue.units;
    this.minPixels = localValue.minPixels ?? null;
    this.maxPixels = localValue.maxPixels ?? null;

    this.setupValidator();
  }
}
</script>

<style scoped lang="scss"></style>
