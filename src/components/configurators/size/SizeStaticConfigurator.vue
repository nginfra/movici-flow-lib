<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column pb-0 is-half-desktop is-full-tablet size">
        <div class="is-flex">
          <b-field
            class="mb-0"
            :label="$t('flow.visualization.sizeConfig.size')"
            :type="{ 'is-danger': errors['size'] }"
          >
            <b-numberinput
              :value="size"
              @input="validated('size', $event)"
              :controls="false"
              size="is-small"
              :min-step="1e-15"
              step="1"
            />
          </b-field>
          <b-field class="is-flex-grow-1 ml-4" :label="$t('flow.visualization.displayAs')">
            <b-radio
              :value="units"
              @input="validated('units', $event)"
              native-value="meters"
              size="is-small"
              class="mr-4"
            >
              {{ $t('units.meters') }}
            </b-radio>
            <b-radio
              :value="units"
              @input="validated('units', $event)"
              native-value="pixels"
              size="is-small"
            >
              {{ $t('units.pixels') }}
            </b-radio>
          </b-field>
        </div>
        <p class="has-text-danger is-size-7 my-1" v-if="errors.size">{{ errors.size }}</p>
      </div>
    </div>
    <div class="columns mb-0 is-multiline" v-if="currentClause.units === 'meters'">
      <div class="column pb-0 is-flex is-half-desktop is-full-tablet min-max-px">
        <b-field
          class="mr-4 mb-0"
          :label="$t('flow.visualization.sizeConfig.minPixels')"
          :type="{ 'is-danger': errors['minPixels'] }"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <b-numberinput
              :value="minPixels"
              @input="validated('minPixels', $event)"
              :controls="false"
              size="is-small"
            />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </b-field>
        <b-field
          :label="$t('flow.visualization.sizeConfig.maxPixels')"
          :type="{ 'is-danger': errors['maxPixels'] }"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <b-numberinput
              :value="maxPixels"
              @input="validated('maxPixels', $event)"
              :controls="false"
              size="is-small"
            />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </b-field>
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
import { StaticSizeClause, SizeClause, FlowVisualizerType } from '@movici-flow-common/types';
import { STATIC_DEFAULT_SIZES } from './defaults';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator, { isPositive } from '@movici-flow-common/utils/FormValidator';

@Component({ name: 'SizeStaticConfigurator' })
export default class SizeStaticConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: SizeClause;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  size = 2;
  units: 'pixels' | 'meters' = 'pixels';
  minPixels: number | null = null;
  maxPixels: number | null = null;

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
    return STATIC_DEFAULT_SIZES[this.geometry];
  }

  @Watch('units')
  afterUnits(curr: 'pixels' | 'meters', old: 'pixels' | 'meters') {
    if (curr !== old) {
      this.validator.touch('minPixels');
      this.validator.touch('maxPixels');
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
        size: () => isPositive(this.currentClause.size, 'Size'),
        minPixels: () => {
          if (this.currentClause.units === 'pixels') return;
          return isPositive(this.currentClause.minPixels, 'Min size');
        },

        maxPixels: () => {
          if (this.currentClause.units === 'pixels') return;
          return isPositive(this.currentClause.maxPixels, 'Max size');
        },

        minMaxPixels: {
          depends: ['minPixels', 'maxPixels'],
          validator: () => {
            if (this.currentClause.units === 'pixels') return;
            if (
              this.currentClause.minPixels !== undefined &&
              this.currentClause.maxPixels !== undefined &&
              this.currentClause.minPixels > this.currentClause.maxPixels
            )
              return 'Max size must be at least min size.';
          }
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    const localValue: StaticSizeClause = Object.assign({}, this.defaults, this.value.static);

    this.size = localValue.size;
    this.units = localValue.units;
    this.minPixels = localValue.minPixels ?? null;
    this.maxPixels = localValue.maxPixels ?? null;

    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
.size,
.min-max-px {
  ::v-deep {
    .b-numberinput {
      max-width: 4.5rem;
    }
  }
}
</style>
