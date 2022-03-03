<template>
  <span class="count-container has-text-weight-bold ml-3 mr-1 is-flex">
    <slot></slot>
    <span class="count">{{ checkedCount }}</span>
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
<style scoped lang="scss">
.count-container {
  height: 20px;
  line-height: 16px;
  .count {
    line-height: inherit;
    min-width: 65px;
  }
}
</style>
