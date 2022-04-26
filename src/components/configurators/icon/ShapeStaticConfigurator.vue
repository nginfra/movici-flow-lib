<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <ShapeSelector :value="currentShape" @input="updateStaticSettings($event)" />
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StaticIconClause } from '@movici-flow-common/types';
import ShapeSelector from './ShapeSelector.vue';

@Component({
  name: 'ShapeStaticConfigurator',
  components: {
    ShapeSelector
  }
})
export default class ShapeStaticConfigurator extends Vue {
  @Prop() readonly value!: StaticIconClause;

  get currentShape() {
    return this.value.icon ?? null;
  }

  updateStaticSettings(icon: string | null) {
    this.updateSettings(icon ? { static: { icon } } : {});
  }

  updateSettings(updatedClause: { static?: StaticIconClause }) {
    this.$emit('input', updatedClause);
  }
}
</script>

<style scoped lang="scss"></style>
