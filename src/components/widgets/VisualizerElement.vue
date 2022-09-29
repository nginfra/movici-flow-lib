<template>
  <div class="group-picker visualizer-element is-flex is-flex-direction-column is-relative">
    <div class="header">
      <slot name="header" v-bind="{ toggleSummary, isOpen }"></slot>
      <template v-if="value">
        <span class="grip mr-1" v-if="showOnHeader('grip')">
          <span class="icon is-small fa-stack">
            <i class="far fa-ellipsis-v"></i>
            <i class="far fa-ellipsis-v"></i>
          </span>
        </span>
        <label
          v-if="showOnHeader('label')"
          class="is-flex-grow-1 label"
          @click="toggleSummary"
          :class="{ 'not-ready': progress < 100 }"
        >
          <span class="is-block is-size-6-half text-ellipsis">{{ value.name }}</span>
        </label>
        <span v-if="showOnHeader('errors') && errors.length" class="errors mr-2">
          <b-icon
            :title="errors.join('\n')"
            :type="errorColor"
            size="is-small"
            pack="far"
            icon="exclamation-triangle"
          />
        </span>
        <span
          v-if="showOnHeader('visibility')"
          @click="toggleVisibility()"
          class="visibility mr-1"
          :class="{ enabled: value.visible }"
        >
          <b-icon
            size="is-small"
            pack="fak"
            :icon="value.visible ? 'fa-visibility' : 'fa-visibility-off'"
          ></b-icon>
        </span>
      </template>
      <MovKebabMenu
        v-if="showOnHeader('more')"
        :value="filteredActions"
        @edit="$emit('edit')"
        @export="$emit('export')"
        @delete="handleEvent('delete')"
        @reload="$emit('reload')"
      />
    </div>
    <VisualizerSummary v-if="value" :value="value" :progress="progress" :show="isOpen" />
    <b-progress v-if="showLoader" :class="{ fade: progress >= 100 }" :value="progress" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { ActionMenuItem } from '@movici-flow-common/types';
import StatusTracker from '@movici-flow-common/utils/StatusTracker';
import VisualizerSummary from './VisualizerSummary.vue';

@Component({
  name: 'VisualizerElement',
  components: {
    VisualizerSummary
  }
})
export default class VisualizerElement extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: ComposableVisualizerInfo | null;
  @Prop({ type: Array, default: () => [] }) readonly headerButtons!: string[];
  @Prop({ type: Array, default: () => [] }) readonly actionButtons!: string[];
  @Prop({ type: String, default: 'is-bottom' }) readonly tooltipPosition!: string;
  @Prop({ type: Boolean, default: false }) readonly tooltipActive!: boolean;
  progress: number | null = null;
  isOpen = false;
  actions: ActionMenuItem[] = [
    {
      icon: 'edit',
      iconPack: 'far',
      label: 'Edit',
      event: 'edit'
    },
    {
      icon: 'file-download',
      iconPack: 'far',
      label: 'Export',
      event: 'export'
    },
    {
      icon: 'trash',
      iconPack: 'far',
      label: 'Delete',
      event: 'delete',
      colorScheme: 'is-danger'
    },
    {
      icon: 'redo',
      iconPack: 'fas',
      label: 'Reload',
      event: 'reload',
      colorScheme: 'is-danger'
    }
  ];

  get filteredActions() {
    return this.actions.filter(action => {
      return this.actionButtons.includes(action.event);
    });
  }

  get showLoader() {
    return !this.errors.length && typeof this.progress === 'number';
  }

  get errors() {
    return this.value ? Object.values(this.value.errors) : [];
  }

  get errorColor() {
    // should we classify error by colors?
    return 'is-warning';
  }

  toggleSummary() {
    this.isOpen = !this.isOpen;
  }

  handleEvent(name: string) {
    this.$emit(name);
    this.$emit('close-editor');
  }

  toggleVisibility(force?: boolean) {
    if (this.value)
      this.$emit(
        'input',
        Object.assign(new ComposableVisualizerInfo(this.value), {
          visible: force ?? !this.value?.visible
        })
      );
  }

  showOnHeader(button: string) {
    return this.headerButtons.includes(button);
  }

  @Watch('value', { immediate: true })
  setupTracking() {
    if (this.value) {
      if (this.value.status) {
        this.value.status.onProgress = val => (this.progress = val);
      } else {
        this.value.status = new StatusTracker({
          tasks: {
            initData: 20,
            updates: 80
          },
          onProgress: val => (this.progress = val)
        });
      }
    }
  }
}
</script>

<style scoped lang="scss">
$summary-bg: $white;
$container-bg: $white-ter;
.visualizer-element {
  background-color: $container-bg;
  .header {
    background-color: $container-bg;
    width: 100%;
    .label {
      span {
        max-width: 155px;
      }
      &.not-ready {
        font-style: italic;
        font-weight: bold;
        color: $grey-dark !important;
      }
      cursor: pointer;
      font-size: 16px;
      color: $black;
    }
    & > span {
      display: flex;
      align-items: center;
      margin: 4px 0;
      &.visibility {
        font-size: 20px;
        color: $grey;
        &.enabled {
          color: $primary;
        }
      }
      &.edit,
      &.open,
      &.export,
      &.visibility {
        cursor: pointer;
      }
    }
  }
  ::v-deep {
    .progress-wrapper {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      &.fade {
        transition: all 0.5s;
        transition-delay: 0.5s;
        opacity: 0;
      }
      .progress {
        height: 0.25em;
      }
    }
  }
}
</style>
