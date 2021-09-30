<template>
  <div class="basemap-control" :class="{ 'is-right': isRight }">
    <b-button
      class="toggler"
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
          v-for="(val, name) in basemapsDefs"
          :key="name"
          @click="value_ = val"
        >
          <b-image :class="{ active: val === value_ }" :src="'/static/basemaps/' + name + '.png'" />
          <span class="is-size-7" :class="{ 'has-text-weight-bold': val === value_ }"
            >{{ name | upperFirst }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({
  name: 'BaseMapControl'
})
export default class BaseMapControl extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isRight!: boolean;
  @Prop({
    default: 'mapbox://styles/mapbox/light-v10',
    type: String
  })
  value!: string;
  value_ = '';
  toggle = false;
  basemapsDefs = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9'
  };

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
    width: 300px;
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
      .image {
        border: solid 2px transparent;
        width: 60px;
        height: 50px;
        @include border-radius;
        &.active {
          border: solid 2px $primary;
        }
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
