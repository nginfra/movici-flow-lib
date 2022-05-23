<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <IconSelector :value="currentIcon" pack="fas" @input="updateIcon($event)" />
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IconClause } from '@movici-flow-common/types';
import IconSelector from './IconSelector.vue';

@Component({
  name: 'IconStaticConfigurator',
  components: {
    IconSelector
  }
})
export default class IconStaticConfigurator extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: IconClause | null;

  get currentIcon() {
    return this.value?.static?.icon ?? null;
  }

  updateIcon(icon: string | null) {
    this.updateSettings(!icon ? {} : { static: { icon } });
  }

  updateSettings(updatedClause: IconClause) {
    this.$emit('input', updatedClause as IconClause);
  }
}
</script>

<style scoped lang="scss"></style>
