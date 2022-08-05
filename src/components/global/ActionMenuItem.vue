<template>
  <a
    :focusable="false"
    :disabled="value.isDisabled"
    :class="itemClass(value)"
    @click="emit(value.event, $event)"
    class="dropdown-item action-menu-item"
  >
    <b-icon :icon="value.icon" :pack="value.iconPack || 'far'" class="mr-2"></b-icon>
    <span>
      {{ value.label }}
    </span>
  </a>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ActionMenuItem } from '@movici-flow-common/types';

@Component({ name: 'MovActionMenuItem' })
export default class MovActionMenuItem extends Vue {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: ActionMenuItem | null;

  itemClass(item: ActionMenuItem) {
    const rv = [item.colorScheme];
    if (item.isDisabled) rv.push('is-disabled');
    return rv;
  }

  emit(event: string, value: unknown) {
    this.$emit('emitAndClose', { event, value });
  }
}
</script>

<style scoped lang="scss">
a.action-menu-item {
  color: $black;
  font-size: 0.8rem;
  font-weight: 300;
  &:hover {
    background-color: $primary-invert;
    color: $primary;
  }
  &.is-danger {
    &:hover {
      background-color: $danger-invert;
      color: $danger;
    }
  }
  &.is-warning {
    &:hover {
      background-color: $warning-invert;
      color: $warning;
    }
  }
}
</style>
