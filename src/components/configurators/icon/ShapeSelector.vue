<template>
  <b-field :label="$t('flow.visualization.iconConfig.selectShape')">
    <b-button
      title="Empty"
      size="is-small"
      @click="$emit('input', null)"
      :class="{ 'is-primary': isSelected(null) }"
    />
    <b-button
      size="is-small"
      :title="shape | upperFirst"
      v-for="shape in shapes"
      :key="shape"
      :icon-left="shape"
      @click="$emit('input', shape)"
      :class="{ 'is-primary': isSelected(shape) }"
    />
  </b-field>
</template>

<script lang="ts">
import { MAPPED_ICONS } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'ShapeSelector' })
export default class ShapeSelector extends Vue {
  @Prop({ type: String, default: null }) readonly value!: string | null;

  get shapes() {
    return Object.keys(MAPPED_ICONS.shapes);
  }

  isSelected(shape: string | null) {
    return shape === this.value;
  }
}
</script>

<style scoped lang="scss"></style>
