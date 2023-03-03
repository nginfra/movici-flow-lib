<template>
  <div class="current-visualization is-flex is-align-items-flex-end">
    <ViewLoaderModal
      v-if="loadModal"
      @input="$emit('load-view', $event)"
      :views="views"
      @close="loadModal = false"
    ></ViewLoaderModal>
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t('flow.visualization.infoLabel') }}
      </label>
      <span class="is-flex is-align-items-center is-flex-grow-1">
        <o-input
          class="is-flex-grow-1 view-name-input is-size-6-half"
          :value="name"
          @input="updateVisualizationName"
        />
        <slot name="quickSave"></slot>
        <MovKebabMenu
          :value="actions"
          @loadViewDialog="loadViewDialog"
          @saveView="$emit('save-view')"
          @saveViewAsNew="$emit('save-view-as-new')"
          @deleteView="$emit('delete-view')"
          @close="openMenu = false"
        />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ActionMenuItem } from '@movici-flow-common/types';
import { flowStore, flowVisualizationStore } from '@movici-flow-common/store/store-accessor';
import ViewLoaderModal from '.././widgets/ViewLoaderModal.vue';

@Component({
  name: 'ViewInfoBox',
  components: { ViewLoaderModal }
})
export default class ViewInfoBox extends Vue {
  @Prop({ type: String })
  name!: string;
  openMenu = false;
  loadModal = false;
  actions: ActionMenuItem[] = [
    {
      label: this.$t('actions.addNew') + ' ' + this.$t('resources.view'),
      icon: 'file',
      iconPack: 'far',
      event: 'resetView'
    },
    {
      label: this.$t('actions.load') + ' ' + this.$t('resources.views') + '...',
      icon: 'map',
      iconPack: 'far',
      event: 'loadViewDialog'
    },
    {
      label: this.$t('actions.save') + ' ' + this.$t('resources.view'),
      icon: 'fa-mov-save',
      iconPack: 'fak',
      event: 'saveView'
    },
    {
      label: this.$t('actions.saveAsNew') + '...',
      icon: 'fa-mov-save',
      iconPack: 'fak',
      event: 'saveViewAsNew'
    },
    {
      label: '' + this.$t('actions.delete') + ' ' + this.$t('resources.view'),
      icon: 'trash',
      iconPack: 'far',
      event: 'deleteView',
      variant: 'danger'
    }
  ];

  get views() {
    return flowVisualizationStore.views;
  }

  async loadViewDialog() {
    await flowVisualizationStore.getViewsByScenario(flowStore.scenario?.uuid);
    this.loadModal = true;
  }

  handleEvent(name: string) {
    this.$emit(name);
  }

  updateVisualizationName(updatedName: string) {
    this.$emit('update:name', updatedName);
  }
}
</script>

<style scoped lang="scss">
.info {
  --height-name: 1.75rem;
  .view-name-input {
    height: var(--height-name);
    margin: 0 8px 0 0;
    ::v-deep input {
      height: var(--height-name);
      font-weight: 700;
      padding: 0.375rem;

      &:focus {
        font-weight: 300;
      }
    }
  }
}
</style>
