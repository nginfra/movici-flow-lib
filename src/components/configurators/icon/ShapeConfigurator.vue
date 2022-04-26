<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <b-field>
          <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
            {{ $t('flow.visualization.static') }}
          </b-radio>
          <b-radio v-model="clauseType" native-value="byValue" size="is-small" disabled>
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
      <ShapeStaticConfigurator
        v-if="clauseType === 'static'"
        :value="staticSettings"
        @input="updateSettings($event)"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ShapeStaticConfigurator from './ShapeStaticConfigurator.vue';
import {
  ByValueIconClause,
  IconClause,
  LegendOptions,
  PropertyType,
  StaticIconClause
} from '@movici-flow-common/types';

@Component({
  name: 'ShapeConfigurator',
  components: {
    ShapeStaticConfigurator
  }
})
export default class ShapeConfigurator extends Vue {
  @Prop() readonly value!: IconClause;
  @Prop() entityProps!: PropertyType[];
  currentClause: IconClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
  };
  advLegend: LegendOptions = {
    labels: ['Special', 'Undefined']
  };

  get staticSettings(): Partial<StaticIconClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueIconClause> {
    return this.currentClause.byValue ?? { icons: [] };
  }

  updateSettings(updatedClause: IconClause) {
    this.currentClause = updatedClause;
    this.emitClause();
  }

  updateShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;
    this.emitClause();
  }

  updateLegend(legend: Partial<LegendOptions>) {
    this.legend = Object.assign({}, this.legend, legend);
    this.emitClause();
  }

  emitClause() {
    const toEmit: IconClause = {};

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

<style scoped lang="scss"></style>
