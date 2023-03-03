<template>
  <o-modal
    :active="active"
    @close="$emit('close')"
    trap-focus
    aria-role="dialog"
    aria-modal
    :can-cancel="cancelOpts"
    :width="width"
  >
    <template>
      <ModalContent :title="title" :hasCancelX="hasCancelX" @close="$emit('close')">
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
  </o-modal>
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

  get hasCancelX() {
    return typeof this.canCancel === 'boolean' || this.canCancel.includes('x');
  }
  get cancelOpts() {
    if (Array.isArray(this.canCancel)) {
      return this.canCancel.filter(v => v !== 'x');
    }
    return this.canCancel;
  }
}
</script>

<style scoped></style>
