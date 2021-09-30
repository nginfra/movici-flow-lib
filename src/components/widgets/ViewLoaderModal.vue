<template>
  <Modal @close="$emit('close')" :can-cancel="['escape', 'outside']" active>
    <template #header>
      <span class="is-size-6">
        {{
          views.length
            ? $t('flow.visualization.dialogs.selectView')
            : $t('flow.visualization.dialogs.noViewsForScenario')
        }}
      </span>
    </template>
    <template #content>
      <b-field v-if="views.length">
        <b-select v-model="selectedView" size="is-small" expanded>
          <option v-for="(view, index) in views" :value="view" :key="index">
            {{ view.name }}
          </option>
        </b-select>
      </b-field>
    </template>
    <template #footer>
      <div class="is-flex is-flex-grow-1 is-justify-content-flex-end">
        <b-button size="is-small" @click="$emit('close')">
          {{ views.length ? $t('actions.cancel') : $t('actions.back') }}
        </b-button>
        <b-button v-if="views.length" size="is-small" @click="emitAndClose" type="is-primary">
          {{ $t('flow.visualization.dialogs.loadView') }}
        </b-button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import View from '@deck.gl/core/views/view';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Modal from '@/flow/src/components/global/Modal.vue';

@Component({
  name: 'ViewLoaderModal',
  components: { Modal }
})
export default class ViewLoaderModal extends Vue {
  @Prop({ type: Array, default: () => [] }) views!: View[];

  selectedView: View | null = null;

  @Watch('views', { immediate: true })
  selectFirstView() {
    if (this.views.length) {
      this.selectedView = this.views[0];
    }
  }

  emitAndClose() {
    this.$emit('input', this.selectedView);
    this.$emit('close');
  }
}
</script>

<style scoped lang="scss">
.modal {
  ::v-deep {
    .modal-card {
      width: inherit;
      min-width: 400px;
      .modal-card-body {
        padding: 10px 20px;
      }
      .modal-card-head,
      .modal-card-foot {
        border: 0;
      }
      .modal-card-head {
        padding-bottom: 0;
      }
      .modal-card-foot {
        padding-top: 0;
      }
    }
    // may come back to dropdown eventually
    // .dropdown {
    //   &.is-active {
    //     border-color: $primary;
    //     box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
    //   }

    //   .dropdown-trigger {
    //     padding: 0.25rem 4rem 0.25rem 0.5rem;
    //     @include border-radius;
    //     cursor: pointer;
    //     border: 2px solid $white-ter;
    //     line-height: unset;
    //     background-color: $white;
    //     user-select: none;
    //     &:hover {
    //       border-color: $grey-light;
    //       &::after {
    //         border-color: $grey-darker;
    //       }
    //     }
    //   }
    // }
  }
}
</style>
