<template>
  <div>
    <div v-if="value">
      <span class="is-flex">
        <label class="label is-flex-grow-1">{{ $t('flow.visualization.legendLabel') }}</label>
        <MovActionMenu :value="actions" @resetLegends="resetLegends" @clearLegends="clearLegends" />
      </span>
      <b-field v-for="(item, index) in orderedItems" :key="index">
        <b-input :value="item" @input="updateItem(index, $event)" size="is-small"></b-input>
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ActionMenuItem, LegendOptions } from '@movici-flow-common/types';

@Component({
  name: 'ColorLegendLabelsConfigurator'
})
export default class ColorLegendLabelsConfigurator extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: LegendOptions | null;
  @Prop({ type: Number, required: true }) readonly nItems!: number;
  @Prop({ type: Array, default: null }) readonly placeholders!: string[] | null;
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
      colorScheme: 'danger'
    }
  ];

  get labels(): string[] | null {
    return this.value?.labels ?? null;
  }

  resetLegends() {
    let labels = new Array(this.labels?.length).fill('');
    if (this.placeholders) {
      labels = this.placeholders;
    }

    this.emitLabels(labels);
  }

  clearLegends() {
    this.emitLabels(new Array(this.labels?.length).fill(''));
  }

  get orderedItems(): string[] | null {
    if (this.labels) {
      return this.reversed ? this.labels.slice().reverse() : this.labels;
    }

    if (this.placeholders) {
      return Array(this.placeholders.length).fill('');
    }
    return null;
  }

  orderedIndex(idx: number): number | null {
    if (!this.labels) return null;
    return this.reversed ? this.labels.length - 1 - idx : idx;
  }

  updateItem(idx: number, val: string) {
    const orderedIndex = this.orderedIndex(idx);
    if (!this.labels || orderedIndex === null) return;
    this.emitLabels(
      this.labels.map((label, arrayIdx) => {
        return arrayIdx === orderedIndex ? val : label;
      })
    );
  }

  emitLabels(labels: string[]) {
    this.$emit('input', { labels } as LegendOptions);
  }

  @Watch('nItems', { immediate: true })
  updateLabelsLength() {
    if (!this.labels?.length) {
      this.emitLabels(Array(this.nItems).fill(''));
      return;
    }
    const currentLength = this.labels.length;
    if (currentLength == this.nItems) {
      return;
    } else if (currentLength < this.nItems) {
      this.emitLabels([...this.labels, ...Array(this.nItems - currentLength).fill('')]);
    } else {
      this.emitLabels(this.labels?.slice(0, this.nItems));
    }
  }
}
</script>

<style scoped lang="scss"></style>
