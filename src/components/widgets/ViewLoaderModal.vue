<template>
  <MovModal @close="$emit('close')" :can-cancel="['escape', 'outside']" active>
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
      <o-field v-if="views.length">
        <o-select v-model="selectedView" size="small" expanded>
          <option v-for="(view, index) in views" :value="view" :key="index">
            {{ view.name }}
          </option>
        </o-select>
      </o-field>
    </template>
    <template #footer>
      <div class="is-flex is-flex-grow-1 is-justify-content-flex-end">
        <o-button size="small" @click="$emit('close')">
          {{ views.length ? $t('actions.cancel') : $t('actions.back') }}
        </o-button>
        <o-button v-if="views.length" size="small" @click="emitAndClose" variant="primary">
          {{ $t('flow.visualization.dialogs.loadView') }}
        </o-button>
      </div>
    </template>
  </MovModal>
</template>

<script lang="ts">
import View from '@deck.gl/core/views/view';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({ name: 'ViewLoaderModal' })
export default class ViewLoaderModal extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly views!: View[];

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
