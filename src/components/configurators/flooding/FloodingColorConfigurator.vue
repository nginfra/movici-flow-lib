<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field
          required
          :label="$t('flow.visualization.basedOn')"
          :message="errors['selectedAttribute']"
          :type="{ 'is-danger': errors['selectedAttribute'] }"
        >
          <AttributeSelector
            :value="selectedAttribute"
            :entity-props="entityProps"
            :filter-prop="filterProp"
            @input="updateAttribute"
          />
        </b-field>
      </div>
    </div>
    <ColorByValueConfigurator
      :value="currentClause"
      :strategy="strategy"
      :validator="validator"
      :selectedAttribute="selectedAttribute"
      :summary="summary"
      @input="updateSettings"
    >
      <template #legend-labels="{ placeholders }">
        <LegendLabelsConfigurator
          v-if="showLegend"
          :value="legend"
          @input="updateLegend($event)"
          :placeholders="placeholders"
          :nItems="nSteps"
          reversed
        />
      </template>
    </ColorByValueConfigurator>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ColorByValueConfigurator from '../color/ColorByValueConfigurator.vue';
import LegendLabelsConfigurator from '../shared/LegendLabelsConfigurator.vue';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import {
  ByValueColorClause,
  ColorClause,
  LegendOptions,
  PropertySummary,
  RGBAColor
} from '@movici-flow-common/types';
import ConfiguratorMixin from '../ConfiguratorMixin';

import { ColorMappingStrategy } from '../color/ColorByValueConfigurator.vue';
import { ValueMapping, ValueMappingHelper } from '../shared/ValueMappingHelper';
import { DEFAULT_COLOR_PALETTES } from '../color/colorPalettes';

class FloodingColorMappingStrategy extends ColorMappingStrategy {
  defaultMapping(_: ValueMapping<RGBAColor>, helper: ValueMappingHelper<RGBAColor>) {
    return helper.recalculateMapping({
      mapping: [
        [0, this.defaultOutput()],
        [helper.getMaxValue() ?? 0, this.defaultOutput()]
      ],
      nSteps: this.defaultStepCount(),
      forceRecalculateValues: true
    });
  }
  defaultStepCount() {
    return 3;
  }
}

@Component({
  name: 'FloodingColorConfigurator',
  components: {
    AttributeSelector,
    ColorByValueConfigurator,
    LegendLabelsConfigurator
  }
})
export default class FloodingColorConfigurator extends Mixins<ConfiguratorMixin<ColorClause>>(
  ConfiguratorMixin
) {
  @Prop({ type: Boolean, default: false }) readonly showLegend!: boolean;
  strategy = new FloodingColorMappingStrategy(DEFAULT_COLOR_PALETTES['Flooding'][0]);
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: ColorClause = {};
  legend: LegendOptions = {
    title: ''
  };

  get nSteps(): number {
    return this.currentClause.byValue?.colors?.length ?? 0;
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
    }
  }

  updateSettings(updatedClause: { byValue?: ByValueColorClause }) {
    this.currentClause = Object.assign({}, this.currentClause, updatedClause);
    this.emitClause();
  }

  updateLegend(legend: Partial<LegendOptions>) {
    this.legend = Object.assign({}, this.legend, legend);
    this.emitClause();
  }

  @Watch('showLegend')
  emitClause() {
    const toEmit: ColorClause = {
      byValue: this.currentClause.byValue
    };

    if (this.showLegend) {
      toEmit.legend = this.legend;
    }

    this.$emit('input', toEmit);
  }

  @Watch('value', { immediate: true })
  updateLocal(value: ColorClause) {
    if (value) {
      if (value?.legend) {
        this.$emit('update:showLegend', true);
        this.legend = value.legend;
      }
      this.currentClause = Object.assign({}, this.currentClause, value);
      if (this.value?.byValue?.attribute) {
        this.pickSelectedEntityProp(this.value.byValue.attribute);
      }
    }
  }
}
</script>
