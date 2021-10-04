<template>
  <BModal
    :active="active"
    @close="$emit('close')"
    has-modal-card
    trap-focus
    aria-role="dialog"
    aria-modal
    :can-cancel="canCancel"
  >
    <template v-slot="{ close }">
      <ModalContent :title="title" @close="close">
        <template v-slot:header>
          <slot name="header" />
        </template>
        <template v-slot:content>
          <slot name="content" />
        </template>
        <template v-slot:footer>
          <slot name="footer" />
        </template>
      </ModalContent>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalContent from '@/components/global/ModalContent.vue';

@Component({
  name: 'Modal.vue',
  components: { ModalContent }
})
export default class Modal extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly active!: boolean;

  @Prop({
    type: [Array, Boolean],
    default() {
      return ['escape', 'x', 'outside', 'button'];
    }
  })
  readonly canCancel!: boolean | string[];

  @Prop({
    type: String,
    default: ''
  })
  readonly title!: string;
}
</script>

<style scoped></style>
