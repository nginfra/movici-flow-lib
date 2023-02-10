<template>
  <div>
    <div v-if="value">
      <span class="is-flex">
        <label class="label is-flex-grow-1">{{ $t('flow.visualization.legendLabel') }}</label>
        <MovKebabMenu :value="actions" @resetLegends="resetLegends" @clearLegends="clearLegends" />
      </span>
      <b-field v-for="[index, item] in labelEntries" :key="index">
        <b-input :value="item" @input="updateItem(index, $event)" size="is-small" />
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ActionMenuItem, LegendOptions } from '@movici-flow-common/types';

@Component({ name: 'LegendLabelsConfigurator' })
export default class LegendLabelsConfigurator extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: LegendOptions | null;
  @Prop({ type: Array, default: () => [] }) readonly placeholders!: string[];
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;

  actions: ActionMenuItem[] = [
    {
      label: '' + this.$t('flow.visualization.legendsConfig.reset'),
      icon: 'undo',
      iconPack: 'far',
      event: 'resetLegends'
    },
    {
      label: '' + this.$t('actions.clear'),
      icon: 'trash',
      iconPack: 'far',
      event: 'clearLegends',
      colorScheme: 'is-danger'
    }
  ];

  get labels(): string[] {
    return this.value?.labels ?? [];
  }

  get labelEntries(): [number, string][] {
    const entries = Array.from(this.labels.entries());
    return this.reversed ? entries.reverse() : entries;
  }

  get nItems() {
    return this.placeholders.length;
  }
  resetLegends() {
    this.emitLabels(this.placeholders);
  }

  clearLegends() {
    this.emitLabels(new Array(this.placeholders.length).fill(''));
  }

  updateItem(idx: number, val: string) {
    this.emitLabels(
      this.labels.map((label, arrayIdx) => {
        return arrayIdx === idx ? val : label;
      })
    );
  }

  emitLabels(labels: string[]) {
    this.$emit('input', { labels } as LegendOptions);
  }

  @Watch('nItems', { immediate: true })
  updateLabelsLength() {
    this.emitLabels(
      Array(this.nItems)
        .fill('')
        .map((val, idx) => this.labels?.[idx] ?? val)
    );
  }
}
</script>

<style scoped lang="scss"></style>
