<template>
  <div>
    <div v-if="value">
      <label class="label">{{ $t('flow.visualization.legendLabel') }}</label>
      <b-field v-for="(item, index) in orderedItems" :key="index">
        <b-input
          :value="item"
          @input="updateItem(index, $event)"
          :placeholder="getPlaceholder(index)"
          size="is-small"
        ></b-input>
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { LegendOptions } from '@/types';

@Component({
  name: 'ColorLegendLabelsConfigurator'
})
export default class ColorLegendLabelsConfigurator extends Vue {
  @Prop({
    type: Object,
    default: null
  })
  readonly value!: LegendOptions | null;

  @Prop({
    type: Number,
    required: true
  })
  readonly nItems!: number;

  @Prop({
    type: Array,
    default: null
  })
  readonly placeholders!: string[] | null;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly reversed!: boolean;

  get labels(): string[] | null {
    return this.value?.labels ?? null;
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

  getPlaceholder(idx: number): string {
    return this.placeholders?.[this.orderedIndex(idx) ?? -1] ?? '';
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
    this.$emit('input', {
      title: this.value?.title || '',
      labels: labels
    } as LegendOptions);
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

  @Watch('value')
  @Watch('placeholders')
  initializeValue() {
    if (!this.labels && this.placeholders) {
      this.emitLabels(Array(this.placeholders.length).fill(''));
    }
  }
}
</script>

<style scoped lang="scss"></style>
