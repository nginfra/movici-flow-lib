<template>
  <div class="basemap-control" :class="{ 'is-right': isRight }" title="Base Maps">
    <b-button
      class="toggler is-border-transparent"
      size="is-small"
      :type="toggle ? 'is-primary' : ''"
      @click="toggle = !toggle"
      icon-pack="fak"
      icon-left="fa-basemap"
    />
    <div class="basemap-selector box" v-if="toggle">
      <div class="is-flex">
        <label class="label is-size-6-half is-flex-grow-1">Base Maps</label>
        <b-button
          class="close is-borderless is-transparent"
          icon-pack="far"
          icon-left="times"
          size="is-small"
          @click="toggle = false"
        >
        </b-button>
      </div>
      <div class="is-flex is-flex-wrap-nowrap is-justify-content-space-between">
        <div
          class="item is-clickable"
          v-for="item in basemapsDefs"
          :key="item.name"
          @click="value_ = item.value"
        >
          <b-image
            v-if="item.type === 'image'"
            class=thumbnail
            :class="{ active: item.value === value_ }"
            :src="'/static/basemaps/' + item.name + '.png'"
          />
          <div
            v-else-if="item.type === 'solid'"
            class="thumbnail solid-background-thumbnail"
            :style="{ 'background-color': item.name }"
            :class="{ active: item.value === value_ }"
          />
          <span class="is-size-7" :class="{ 'has-text-weight-bold': item.value === value_ }">
            {{ $t('flow.basemap')[item.name] | upperFirst }}
          </span>
        </div>
        <div
          v-for="(val, name) in colors"
          :key="name"
          class="item is-clickable"
          @click="value_ = val"
        >
          <div
            class="thumbnail solid-background-thumbnail"
            :style="{ 'background-color': name }"
            :class="{ active: val === value_ }"
          />
          <span class="is-size-7" :class="{ 'has-text-weight-bold': val === value_ }">
            {{ $t('flow.basemap')[name] | upperFirst }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({ name: 'BaseMapControl' })
export default class BaseMapControl extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isRight!: boolean;
  @Prop({ type: String, default: 'mapbox://styles/mapbox/light-v10' })
  value!: string;
  value_ = '';
  toggle = false;
  basemapsDefs = [
    { type: 'image', name: 'light', value: 'mapbox://styles/mapbox/light-v10' },
    { type: 'image', name: 'dark', value: 'mapbox://styles/mapbox/dark-v10' },
    { type: 'image', name: 'streets', value: 'mapbox://styles/mapbox/streets-v11' },
    { type: 'image', name: 'satellite', value: 'mapbox://styles/mapbox/satellite-v9' },
    { type: 'solid', name: 'black', value: 'color://black' },
    { type: 'solid', name: 'white', value: 'color://white' }
  ];

  @Watch('value_')
  emitBaseMap(value: string) {
    this.$emit('input', value);
  }

  mounted() {
    this.value_ = this.value;
  }
}
</script>

<style scoped lang="scss">
.basemap-control {
  width: 30px;
  height: 30px;
  transition: width 0.5s;
  &.is-right {
    .basemap-selector {
      left: -310px !important;
      top: -30px !important;
    }
  }
  .basemap-selector {
    width: max-content;
    position: relative;
    left: 40px;
    top: -30px;
    padding: 0.75rem;
    .close {
      margin: -0.25rem -0.25rem 0 0;
    }
    .item {
      span {
        color: $black;
      }
      .thumbnail {
        border: solid 2px white;
        width: 60px;
        height: 51px;
        @include border-radius;
        &.active {
          border: solid 2px $primary;
        }
      }
      .solid-background-thumbnail {
        border: solid 2px lightgray;
      }
    }
  }
  .toggler {
    padding: 0;
    width: inherit;
    ::v-deep .icon {
      margin-right: auto;
      margin-left: calc(0.5em - 2px);
    }
  }
}
</style>
