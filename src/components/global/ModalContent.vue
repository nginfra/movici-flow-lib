<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <slot name="header">
        <p class="modal-card-title">{{ title }}</p>
        <button type="button" class="delete" @click="$emit('close')" />
      </slot>
    </header>
    <section class="modal-card-body" :class="{ 'border-round': !hasFooter }">
      <slot name="content" />
    </section>
    <footer class="modal-card-foot" v-if="hasFooter">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'ModalContent'
})
export default class ModalContent extends Vue {
  @Prop([String]) title?: string;

  get hasFooter() {
    return !!this.$slots.footer;
  }
}
</script>

<style scoped lang="scss">
.modal-card {
  max-width: inherit;
  .modal-card-body {
    &.border-round {
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
}
</style>
