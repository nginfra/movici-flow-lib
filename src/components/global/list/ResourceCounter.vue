<template>
  <span class="has-text-weight-bold is-flex">
    <slot></slot>
    <span class="count" :class="{ 'ml-5': $slots.default }">{{ checkedCount }}</span>
  </span>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'ResourceCounter'
})
export default class ResourceCounter extends Vue {
  @Prop({ type: Number }) readonly filteredLength!: number;
  @Prop({ type: Number }) readonly checkedLength!: number;

  get checkedCount() {
    return `${this.checkedLength} / ${this.filteredLength}`;
  }

  get allChecked() {
    return this.checkedLength === this.filteredLength && this.checkedLength > 0;
  }
}
</script>
<style scoped lang="scss"></style>
