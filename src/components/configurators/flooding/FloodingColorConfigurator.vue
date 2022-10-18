<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field
          required
          :label="$t('flow.visualization.basedOn')"
          :message="errors['selectedEntityProp']"
          :type="{ 'is-danger': errors['selectedEntityProp'] }"
        >
          <AttributeSelector
            :value="selectedEntityProp"
            :entity-props="entityProps"
            :filter-prop="filterProp"
            @input="updateAttribute"
          />
        </b-field>
      </div>
    </div>
    <ColorByValueConfigurator
      :value="currentClause"
      :validator="validator"
      :entityProps="entityProps"
      :selectedEntityProp="selectedEntityProp"
      :summary="summary"
      @input="updateSettings"
      :initialOpts="opts"
    >
      <template #legend-labels="{ entityEnums }">
        <ColorLegendLabelsConfigurator
          v-if="showLegend"
          :value="legend"
          @input="updateLegend($event)"
          :placeholders="legendPlaceholders"
          :nItems="nSteps"
          :entityEnums="entityEnums"
          reversed
        />
      </template>
    </ColorByValueConfigurator>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ColorByValueConfigurator from '../color/ColorByValueConfigurator.vue';
import ColorLegendLabelsConfigurator from '../color/ColorLegendLabelsConfigurator.vue';
import { getLegendPlaceholders, PlaceholderType } from '../helpers';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import {
  ByValueColorClause,
  ColorClause,
  LegendOptions,
  PropertySummary
} from '@movici-flow-common/types';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import AttributeMixin from '../AttributeMixin';

@Component({
  name: 'FloodingColorConfigurator',
  components: {
    AttributeSelector,
    ColorByValueConfigurator,
    ColorLegendLabelsConfigurator
  }
})
export default class FloodingColorConfigurator extends Mixins(AttributeMixin) {
  @Prop({ type: Object }) readonly value?: ColorClause;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  @Prop({ type: Boolean, default: false }) readonly showLegend!: boolean;
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: ColorClause = {};
  legend: LegendOptions = {
    title: ''
  };

  get opts() {
    return {
      allowedPropertyTypes: ['DOUBLE'],
      selectedColorType: 'Flooding',
      nSteps: 3,
      maxValue: 1
    };
  }

  get nSteps(): number {
    return this.currentClause.byValue?.colors?.length ?? 0;
  }

  get legendPlaceholders(): string[] {
    if (this.currentClause.byValue) {
      const byValue = this.currentClause.byValue;
      const mappingValues = byValue.colors?.map(val => val[0]);
      if (!mappingValues) return [];

      const maxValue = byValue.maxValue ?? 1;
      const type: PlaceholderType = byValue.type === 'gradient' ? 'single' : 'range';
      return getLegendPlaceholders(mappingValues, type, maxValue);
    }
    return [];
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
