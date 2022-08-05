<template>
  <div class="dropdown-menu action-menu">
    <div class="dropdown-content action-menu-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'MovActionMenu' })
export default class MovActionMenu extends Vue {}
</script>

<style scoped lang="scss">
.action-menu {
  display: block;
  position: unset;
  padding: 0;
}
</style>
