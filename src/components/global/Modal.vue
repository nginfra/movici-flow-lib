<template>
  <b-modal
    :active="active"
    @close="$emit('close')"
    has-modal-card
    trap-focus
    aria-role="dialog"
    aria-modal
    :can-cancel="canCancel"
    :width="width"
  >
    <template v-slot="{ close }">
      <ModalContent :title="title" @close="close">
        <template v-slot:header>
          <slot name="header" />
        </template>
        <template v-slot:content>
          <slot name="content" />
        </template>
        <template v-if="$slots.footer" v-slot:footer>
          <slot name="footer" />
        </template>
      </ModalContent>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalContent from './ModalContent.vue';

@Component({
  name: 'MovModal',
  components: { ModalContent }
})
export default class Modal extends Vue {
  @Prop({ type: String, default: '' }) readonly title!: string;
  @Prop({ type: Boolean, default: false }) readonly active!: boolean;
  @Prop({ type: Number, default: 800 }) readonly width!: number;
  @Prop({ type: [Array, Boolean], default: () => ['escape', 'x', 'outside', 'button'] })
  readonly canCancel!: boolean | string[];
}
</script>

<style scoped></style>
