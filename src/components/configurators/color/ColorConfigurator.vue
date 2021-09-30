<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
          {{ $t('flow.visualization.static') }}</b-radio
        >
        <b-radio v-model="clauseType" native-value="byValue" size="is-small">
          {{ $t('flow.visualization.byValue') }}
        </b-radio>
      </div>
      <div class="column is-one-third-desktop">
        <b-checkbox :value="showLegend" @input="updateShowLegend" size="is-small">
          {{ $t('flow.visualization.showLegend') }}
        </b-checkbox>
      </div>
    </div>
    <div v-if="clauseType">
      <ColorStaticConfigurator
        v-if="clauseType === 'static'"
        :value="staticSettings"
        @input="updateSettings($event)"
        size="is-small"
      >
        <template v-slot:legend-title v-if="showLegend">
          <b-field :label="$t('flow.visualization.legendTitle')">
            <b-input
              :value="legend.title"
              @input="updateLegend({ title: $event })"
              size="is-small"
            ></b-input>
          </b-field>
        </template>
      </ColorStaticConfigurator>
      <ColorByValueConfigurator
        v-else-if="clauseType === 'byValue'"
        :value="byValueSettings"
        :entityProps="entityProps"
        @input="updateSettings($event)"
      >
        <template v-slot:legend-title v-if="showLegend">
          <b-field :label="$t('flow.visualization.legendTitle')">
            <b-input
              :value="legend.title"
              @input="updateLegend({ title: $event })"
              size="is-small"
            ></b-input>
          </b-field>
        </template>
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
    </div>
  </div>
</template>

<script lang="ts">
import {
  ByValueColorClause,
  ColorClause,
  LegendOptions,
  PropertyType,
  StaticColorClause
} from '@/flow/src/types';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ColorStaticConfigurator from './ColorStaticConfigurator.vue';
import ColorByValueConfigurator from './ColorByValueConfigurator.vue';
import ColorLegendLabelsConfigurator from '@/flow/src/components/configurators/color/ColorLegendLabelsConfigurator.vue';
import {
  getLegendPlaceholders,
  PlaceholderType
} from '@/flow/src/components/configurators/helpers';

@Component({
  components: {
    ColorLegendLabelsConfigurator,
    ColorStaticConfigurator,
    ColorByValueConfigurator
  }
})
export default class ColorConfigurator extends Vue {
  @Prop({ default: () => ({}) })
  value!: ColorClause;
  @Prop({ default: () => [] })
  entityProps!: PropertyType[];
  currentClause: ColorClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
  };

  get staticSettings(): Partial<StaticColorClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueColorClause> {
    return this.currentClause.byValue ?? { type: 'buckets', colors: [] };
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

  // Saves the old configuration if the user is changing between the kinds
  @Watch('clauseType')
  kindUpdated() {
    if (!this.clauseType) return;
    this.updateSettings({ [this.clauseType]: this.currentClause[this.clauseType] ?? {} });
  }

  @Watch('value', { immediate: true })
  updateLocal() {
    if (this.value) {
      if (this.value?.legend) {
        this.showLegend = true;
        this.legend = this.value.legend;
      }
      this.clauseType = this.value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, this.value);
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
