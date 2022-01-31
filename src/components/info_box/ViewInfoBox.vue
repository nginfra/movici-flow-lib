<template>
  <div class="current-visualization is-flex is-align-items-flex-end">
    <ViewLoaderModal
      v-if="loadViewDialog"
      @input="$emit('load-view', $event)"
      :views="views"
      @close="loadViewDialog = false"
    ></ViewLoaderModal>
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t('flow.visualization.infoLabel') }}
      </label>
      <b-input
        class="view-name-input is-size-6-half"
        :value="name"
        @input="updateVisualizationName"
      ></b-input>
    </div>
    <MovActionMenu
      :value="actions"
      @loadViewDialog="startLoadingView"
      @saveView="$emit('save-view')"
      @saveViewAsNew="$emit('save-view-as-new')"
      @deleteView="$emit('delete-view')"
      @resetView="$emit('reset-view')"
      @close="openMenu = false"
    />
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

  actions: ActionMenuItem[] = [
    {
      label: 'New view',
      icon: 'file',
      iconPack: 'far',
      event: 'resetView'
    },
    {
      label: 'Load view',
      icon: 'map',
      iconPack: 'far',
      event: 'loadViewDialog'
    },
    {
      label: 'Save',
      icon: 'fa-mov-save',
      iconPack: 'fak',
      event: 'saveView'
    },
    {
      label: 'Save as new...',
      icon: 'fa-mov-save',
      iconPack: 'fak',
      event: 'saveViewAsNew'
    },
    {
      label: 'Delete',
      icon: 'trash',
      iconPack: 'far',
      event: 'deleteView',
      colorScheme: 'danger'
    }
  ];

  loadViewDialog = false;

  get views() {
    return flowVisualizationStore.views;
  }

  async startLoadingView() {
    await flowVisualizationStore.getViewsByScenario(flowStore.scenario?.uuid);
    this.loadViewDialog = true;
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
