<template>
  <div>
    <div class="modal-card">
      <header class="modal-card-head">
        <slot name="header">
          <p class="modal-card-title">{{ title }}</p>
          <button type="button" class="delete" @click="$emit('close')" />
        </slot>
      </header>
      <section class="modal-card-body">
        <slot name="content" />
      </section>
      <footer class="modal-card-foot">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'ModalContent'
})
export default class ModalContent extends Vue {
  @Prop([String]) title?: string;
}
</script>

<style scoped></style>
