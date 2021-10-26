<template>
  <div class="popup-fixed">
    <div class="data-viewer box">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'StaticDataView'
})
export default class StaticDataView extends Vue {}
</script>

<style scoped lang="scss">
.data-viewer {
  min-width: 250px;
  max-width: 500px;
  padding: 0.75rem;
}
.header {
  min-height: 1.5rem;
  .label {
    margin: 0;
  }
}
.attributes {
  color: $black;
  .value {
    min-width: 50px;
    text-align: right;
  }
}
</style>
