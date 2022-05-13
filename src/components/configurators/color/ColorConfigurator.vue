<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <b-field>
          <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
            {{ $t('flow.visualization.static') }}</b-radio
          >
          <b-radio v-model="clauseType" native-value="byValue" size="is-small">
            {{ $t('flow.visualization.byValue') }}
          </b-radio>
        </b-field>
      </div>
      <div class="column is-one-third-desktop">
        <b-field>
          <b-checkbox :value="showLegend" @input="updateShowLegend" size="is-small">
            {{ $t('flow.visualization.showLegend') }}
          </b-checkbox>
        </b-field>
      </div>
    </div>
    <template v-if="clauseType">
      <ColorStaticConfigurator
        v-if="clauseType === 'static'"
        :name="name"
        :value="currentClause"
        :validator="validator"
        @input="updateSettings"
        size="is-small"
      >
      </ColorStaticConfigurator>
      <ColorByValueConfigurator
        v-else-if="clauseType === 'byValue'"
        :name="name"
        :value="currentClause"
        :validator="validator"
        :entityProps="entityProps"
        @input="updateSettings"
      >
        <template v-slot:legend-labels v-if="showLegend">
          <ColorLegendLabelsConfigurator
            :value="legend"
            @input="updateLegend($event)"
            :placeholders="legendPlaceholders"
            :nItems="nSteps"
            reversed
          />
        </template>
      </ColorByValueConfigurator>
      <hr />
      <ColorAdvSettingsConfigurator
        :value="advancedSettings"
        :geometry="geometry"
        :fillType="fillType"
        :clauseType="clauseType"
        @input="updateAdvancedSettings($event)"
      >
        <template v-slot:legend-labels v-if="showLegend">
          <ColorLegendLabelsConfigurator
            v-model="advLegend"
            :nItems="2"
            :placeholders="['Special', 'Undefined']"
          />
        </template>
      </ColorAdvSettingsConfigurator>
    </template>
  </div>
</template>

<script lang="ts">
import {
  ByValueColorClause,
  AdvancedColorSettings,
  ColorClause,
  FlowVisualizerType,
  LegendOptions,
  PropertySummary,
  StaticColorClause
} from '@movici-flow-common/types';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ColorStaticConfigurator from './ColorStaticConfigurator.vue';
import ColorByValueConfigurator from './ColorByValueConfigurator.vue';
import ColorLegendLabelsConfigurator from './ColorLegendLabelsConfigurator.vue';
import ColorAdvSettingsConfigurator from './ColorAdvSettingsConfigurator.vue';
import { getLegendPlaceholders, PlaceholderType } from '../helpers';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import isEqual from 'lodash/isEqual';

@Component({
  components: {
    ColorLegendLabelsConfigurator,
    ColorStaticConfigurator,
    ColorByValueConfigurator,
    ColorAdvSettingsConfigurator
  }
})
export default class ColorConfigurator extends Mixins(ValidationProvider) {
  @Prop([Object]) value!: ColorClause;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop([String]) readonly geometry!: FlowVisualizerType;
  @Prop([Object]) declare validator: FormValidator;
  currentClause: ColorClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  advancedSettings: AdvancedColorSettings | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
  };
  advLegend: LegendOptions = {
    labels: ['Special', 'Undefined']
  };

  get staticSettings(): Partial<StaticColorClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueColorClause> {
    return this.currentClause.byValue ?? { type: 'buckets', colors: [] };
  }

  get fillType(): 'buckets' | 'gradient' | null {
    return this.currentClause?.byValue?.type || null;
  }

  get nSteps(): number {
    if (this.clauseType === 'static') return 1;
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

  updateSettings(updatedClause: { static?: StaticColorClause; byValue?: ByValueColorClause }) {
    this.currentClause = Object.assign({}, this.currentClause, updatedClause);
    this.emitClause();
  }

  updateAdvancedSettings(settings: AdvancedColorSettings) {
    this.advancedSettings = settings;
    this.emitClause();
  }

  updateLegend(legend: Partial<LegendOptions>) {
    this.legend = Object.assign({}, this.legend, legend);
    this.emitClause();
  }

  updateShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;
    this.emitClause();
  }

  emitClause() {
    const toEmit: ColorClause = {};

    if (this.advancedSettings) {
      toEmit.advanced = this.advancedSettings;
    }

    if (this.showLegend) {
      toEmit.legend = this.legend;
    }

    if (this.clauseType === 'static') {
      toEmit.static = this.currentClause.static;
    } else {
      toEmit.byValue = this.currentClause.byValue;
    }

    this.$emit('input', toEmit);
  }

  @Watch('entityProps')
  afterEntityProps(value: PropertySummary[], old?: PropertySummary[]) {
    if (!isEqual(value, old)) {
      delete this.currentClause.static;
      delete this.currentClause.byValue;
      this.clauseType = 'static';
    }
  }

  // Saves the old configuration if the user is changing between the kinds
  @Watch('clauseType')
  kindUpdated() {
    if (!this.clauseType) return;
    this.updateSettings({ [this.clauseType]: this.currentClause[this.clauseType] ?? {} });
  }

  @Watch('value', { immediate: true })
  updateLocal(value: ColorClause) {
    if (value) {
      if (value?.legend) {
        this.showLegend = true;
        this.legend = value.legend;
      }
      this.clauseType = value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, value);
      this.advancedSettings = value.advanced ?? null;
    } else {
      this.clauseType = 'static';
    }
  }
}
</script>

<style lang="scss">
.color-item {
  position: relative;
  .color-wrap {
    @include border-radius;
    cursor: pointer;
    border: 2px solid $white-ter;
    min-width: 30px;
    height: 30px;
    line-height: unset;
    &:hover {
      border-color: $grey-light;
    }
    &.active {
      border-color: $primary;
      box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
    }
  }
}
</style>
