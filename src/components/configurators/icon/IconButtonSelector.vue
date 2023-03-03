<template>
  <o-field :label="label">
    <o-button
      v-if="allowEmpty"
      title="Empty"
      size="small"
      @click="$emit('input', null)"
      :class="{ 'is-primary': isSelected(null) }"
    />
    <o-button
      size="small"
      :title="icon | upperFirst"
      v-for="icon in icons"
      :key="icon"
      :icon-left="icon"
      @click="$emit('input', icon)"
      :class="{ 'is-primary': isSelected(icon) }"
    />
  </o-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IconMapping } from '@deck.gl/layers/icon-layer/icon-layer';

@Component({ name: 'IconButtonSelector' })
export default class IconButtonSelector extends Vue {
  @Prop({ type: String, default: null }) readonly value!: string | null;
  @Prop({ type: String, default: 'fas' }) readonly pack!: string;
  @Prop({ type: Object, default: () => Object() }) readonly iconOptions!: IconMapping;
  @Prop({ type: Boolean, default: false }) readonly allowEmpty!: boolean;
  @Prop({ type: String, default: '' }) readonly label!: string;

  get icons(): string[] {
    return Object.keys(this.iconOptions);
  }
  isSelected(shape: string | null) {
    return shape === this.value;
  }
}
</script>

<style scoped lang="scss"></style>
