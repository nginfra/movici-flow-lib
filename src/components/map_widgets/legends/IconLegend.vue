<template>
  <div class="shape-icon-container">
    <ul class="shape-container is-size-7" v-if="value.shape">
      <li class="icons" v-for="(iconLegend, idx) in value.shape.iconLegends" :key="idx">
        <div class="is-flex pb-1" :class="isShapeStatic ? 'static' : 'byValue'">
          <span class="is-flex is-align-items-center">
            <b-icon :icon="iconLegend[1]" pack="fas" size="is-small" class="is-flex-grow-1" />
            <span class="ml-2 legend-value" v-if="!isShapeStatic">{{ iconLegend[0] }}</span>
          </span>
          <label class="label is-size-7 mb-0" :class="{ 'ml-2': isShapeStatic }" v-if="idx < 1">
            {{ $t('flow.visualization.iconConfig.shape') }}
          </label>
        </div>
      </li>
    </ul>
    <ul class="icon-container is-size-7" v-if="value.icon">
      <li class="icons" v-for="(iconLegend, idx) in value.icon.iconLegends" :key="idx">
        <div class="is-flex pb-1" :class="isIconStatic ? 'static' : 'byValue'">
          <span class="is-flex is-align-items-center">
            <b-icon :icon="iconLegend[1]" pack="fas" size="is-small" class="is-flex-grow-1" />
            <span class="ml-2 legend-value" v-if="!isIconStatic">{{ iconLegend[0] }}</span>
          </span>
          <label class="label is-size-7 mb-0" :class="{ 'ml-2': isIconStatic }" v-if="idx < 1">
            {{ $t('flow.visualization.iconConfig.icon') }}
          </label>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IconShapeLegendItem } from '@movici-flow-common/types';

@Component({
  name: 'IconLegend'
})
export default class IconLegend extends Vue {
  @Prop({ type: Object }) value!: IconShapeLegendItem;

  get isShapeStatic() {
    return (this.value?.shape?.iconLegends.length ?? []) === 1;
  }

  get isIconStatic() {
    return (this.value?.icon?.iconLegends.length ?? []) === 1;
  }
}
</script>

<style scoped lang="scss">
ul {
  li {
    .static {
      flex-direction: row;
      align-items: center;
    }
    .byValue {
      flex-direction: column-reverse;
      align-items: flex-start;
    }
    span {
      &.icon {
        width: 16px;
        height: 16px;
      }
      &.legend-value {
        line-height: 16px;
      }
    }
  }
}
</style>
