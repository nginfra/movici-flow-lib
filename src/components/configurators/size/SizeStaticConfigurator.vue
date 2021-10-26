<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column pb-0 is-half-desktop is-full-tablet size">
        <div class="is-flex">
          <b-field class="is-flex-shrink-1" :label="$t('flow.visualization.sizeConfig.size')">
            <b-numberinput
              :value="currentClause.size"
              @input="updateValue({ size: Number($event) })"
              :controls="false"
              size="is-small"
              :min-step="1e-15"
              step="1"
            />
          </b-field>

          <b-field class="is-flex-grow-1 ml-4" :label="$t('flow.visualization.displayAs')">
            <b-radio
              :value="currentClause.units"
              @input="updateValue({ units: $event })"
              native-value="meters"
              size="is-small"
              class="mr-4"
            >
              {{ $t('units.meters') }}
            </b-radio>
            <b-radio
              :value="currentClause.units"
              @input="updateValue({ units: $event })"
              native-value="pixels"
              size="is-small"
            >
              {{ $t('units.pixels') }}
            </b-radio>
          </b-field>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline" v-if="currentClause.units === 'meters'">
      <div class="column pb-0 is-flex is-half-desktop is-full-tablet min-max-px">
        <b-field class="mr-4" :label="$t('flow.visualization.sizeConfig.minPixels')">
          <b-numberinput
            :value="currentClause.minPixels"
            @input="updateValue({ minPixels: Number($event) })"
            :controls="false"
            size="is-small"
          />
          <span class="ml-2 is-size-7">px</span>
        </b-field>
        <b-field :label="$t('flow.visualization.sizeConfig.maxPixels')">
          <b-numberinput
            :value="currentClause.maxPixels"
            @input="updateValue({ maxPixels: Number($event) })"
            :controls="false"
            size="is-small"
          /><span class="ml-2 is-size-7">px</span>
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StaticSizeClause, SizeClause } from '@/flow/types';
import FlowColorPicker from '@/flow/components/configurators/color/FlowColorPicker.vue';

@Component({
  components: {
    FlowColorPicker
  }
})
export default class SizeStaticConfigurator extends Vue {
  @Prop() value!: SizeClause | null;

  updateValue(props: Partial<StaticSizeClause>) {
    // check for this.value (is it a valid object?)
    const clause = Object.assign({}, this.currentClause, props);

    if (clause.units === 'pixels') {
      delete clause.minPixels;
      delete clause.maxPixels;
    }

    this.$emit('input', { static: clause });
  }

  get defaults() {
    return {
      size: 2,
      units: 'pixels',
      minPixels: 2,
      maxPixels: 5
    };
  }

  get currentClause(): StaticSizeClause {
    return Object.assign({}, this.defaults, this.value?.static);
  }

  // TODO: create validator according to color length
  setupValidator() {}

  mounted() {
    this.updateValue({});
    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
.size,
.min-max-px {
  ::v-deep {
    .b-numberinput {
      width: 3.5rem;
    }
  }
}
</style>
