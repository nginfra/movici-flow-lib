<template>
  <div class="group-picker visualizer-element is-flex">
    <div class="header">
      <slot name="header"></slot>
      <span class="grip mr-1" v-if="showOnHeader('grip')">
        <span class="icon is-small fa-stack">
          <i class="far fa-ellipsis-v"></i>
          <i class="far fa-ellipsis-v"></i>
        </span>
      </span>
      <MovTooltipInfo
        v-if="showOnHeader('label')"
        class="label is-flex-grow-1 pl-1 pr-3"
        color="is-white"
        :active="tooltipActive"
        :position="tooltipPosition"
        :delay="500"
      >
        <label>
          <span class="is-block is-size-6-half text-ellipsis">{{ value.name }}</span>
        </label>
        <template #tooltip-content>
          <div class="is-flex is-flex-direction-column details" v-if="value">
            <span class="type is-size-7 text-ellipsis">
              <b-icon class="is-tiny mr-2" type="is-small" :icon="typeIcon" pack="fak" />
              {{ value.settings.type }}
            </span>
            <span class="dataset is-size-7 text-ellipsis">
              <b-icon class="is-tiny mr-2" type="is-small" icon="fa-dataset" pack="fak" />
              {{ value.datasetName }}
            </span>
            <span class="entityGroup is-size-7 text-ellipsis">
              <b-icon class="is-tiny mr-2" type="is-small" icon="object-group" pack="far" />
              {{ value.entityGroup }}
            </span>
            <span class="attribute is-size-7 text-ellipsis" v-if="colorByValue">
              <b-icon class="is-tiny mr-2" type="is-small" icon="file" pack="far" />
              {{ colorByValue.attribute.name }}
            </span>
            <span class="byValue buckets" v-if="colorByValue && colorByValue.type === 'buckets'">
              <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far"></b-icon>
              <span
                v-for="(color, index) in colorByValue.colors"
                :style="{ 'background-color': convertColor(color[1]) }"
                :key="index"
              />
            </span>
            <span class="byValue gradient" v-if="colorByValue && colorByValue.type === 'gradient'">
              <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far"></b-icon>
              <span
                :style="{
                  background: linearGradient,
                  width: colorByValue.colors.length * 12 + 'px'
                }"
              />
            </span>
            <span class="static" v-if="colorStatic">
              <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far"></b-icon>
              <span :style="{ 'background-color': convertColor(colorStatic.color) }" />
            </span>
          </div>
        </template>
      </MovTooltipInfo>
      <span
        v-if="showOnHeader('visibility')"
        @click="toggleVisibility()"
        class="visibility mr-1"
        :class="`has-text-${value.visible ? 'primary' : 'grey'}`"
      >
        <b-icon
          size="is-small"
          pack="fak"
          :icon="value.visible ? 'fa-visibility' : 'fa-visibility-off'"
        ></b-icon>
      </span>
      <MovActionMenu
        v-if="showOnHeader('more')"
        :value="filteredActions"
        @edit="$emit('edit')"
        @export="$emit('export')"
        @delete="handleEvent('delete')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import { colorTripleToHex } from '@/flow/src/visualizers/maps/colorMaps';
import { FlowVisualizerType, RGBAColor } from '@/flow/src/types';
import { ActionMenuItem } from '../global/ActionMenu.vue';

@Component({
  name: 'VisualizerElement'
})
export default class VisualizerElement extends Vue {
  @Prop([Object]) readonly value!: ComposableVisualizerInfo;
  @Prop({ type: Array, default: () => [] }) readonly headerButtons!: string[];
  @Prop({ type: Array, default: () => [] }) readonly actionButtons!: string[];
  @Prop({ type: String, default: 'is-bottom' }) readonly tooltipPosition!: string;
  @Prop({ type: Boolean, default: false }) tooltipActive!: boolean;
  showDetails = false;
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
      colorScheme: 'danger'
    }
  ];

  get filteredActions() {
    return this.actions.filter(action => {
      return this.actionButtons.includes(action.event);
    });
  }

  get popup() {
    return this.value?.settings?.popup;
  }

  get colorByValue() {
    return this.value?.settings?.color?.byValue;
  }

  get colorStatic() {
    return this.value?.settings?.color?.static;
  }

  get typeIcon() {
    let icon = '';
    if (this.value.settings)
      switch (this.value.settings.type) {
        case FlowVisualizerType.POINTS:
          icon = 'fa-vis-info-' + FlowVisualizerType.POINTS;
          break;
        case FlowVisualizerType.LINES:
          icon = 'fa-vis-info-' + FlowVisualizerType.LINES;
          break;
        case FlowVisualizerType.POLYGONS:
          icon = 'fa-vis-info-' + FlowVisualizerType.POLYGONS;
          break;
        case FlowVisualizerType.ARCS:
          icon = 'fa-vis-info-' + FlowVisualizerType.ARCS;
          break;
      }
    return icon;
  }

  get linearGradient() {
    const gradientString = this.value?.settings?.color?.byValue?.colors
      .map(color => colorTripleToHex(color[1]))
      .join();
    return 'linear-gradient(90deg,' + gradientString + ')';
  }

  handleEvent(name: string) {
    this.$emit(name);
    this.$emit('close-editor');
  }

  toggleVisibility(force?: boolean) {
    this.updateValue({ visible: force ?? !this.value?.visible });
  }

  updateValue(value: Partial<ComposableVisualizerInfo>) {
    this.$emit('input', Object.assign(new ComposableVisualizerInfo(this.value), value));
  }

  showOnHeader(button: string) {
    return this.headerButtons.includes(button);
  }

  convertColor(color: RGBAColor) {
    return colorTripleToHex(color);
  }
}
</script>

<style scoped lang="scss">
$details-bg: $white;
$container-bg: $white-ter;
.visualizer-element {
  background-color: $container-bg;
  .header {
    background-color: $container-bg;
    width: 100%;
    .label {
      span {
        max-width: 185px;
      }
      font-size: 16px;
      color: $black;
    }
    & > span {
      display: flex;
      align-items: center;
      margin: 4px 0;
      &.visibility {
        font-size: 20px;
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
    .details {
      min-width: 10rem;
      & > span {
        margin-bottom: 0.125rem;
        &:last-child {
          margin-bottom: 0;
        }
        &.dataset,
        &.type {
          max-width: 250px;
        }

        .icon {
          color: $grey;
          font-weight: 100;
          font-size: 0.75rem;
        }
      }
      .static,
      .byValue.buckets {
        span:not(.icon) {
          height: 12px;
          width: 12px;
          display: inline-block;
        }
      }
      .byValue.gradient {
        span:not(.icon) {
          height: 12px;
          min-width: 48px;
          display: inline-block;
        }
      }
    }
  }
}
</style>
