<template>
  <div class="control is-expanded">
    <span class="select is-fullwidth" @blur="closeDropdown" tabindex="0">
      <div class="select-header" :class="{ open: open }" @click="open = !open">
        <div class="item">
          <slot
            name="item-template"
            :selected-index="selectedIndex"
            :self-index="selectedIndex"
            :item="selected"
          ></slot>
        </div>
      </div>
      <div class="items" customBlur :class="{ selectHide: !open }">
        <div class="item" v-for="(option, index) in options_" :key="index" @click="select(index)">
          <slot
            name="item-template"
            :selected-index="selectedIndex"
            :self-index="index"
            :item="option"
          ></slot>
        </div>
      </div>
    </span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({ name: 'CustomSelect' })
export default class CustomSelect extends Vue {
  @Prop({
    type: Array,
    default: [],
    required: true
  })
  options!: unknown[];
  @Prop({
    type: Number,
    required: false,
    default: 0
  })
  selectedIndex!: number;

  open = false;

  get options_() {
    return this.options;
  }

  get selected() {
    return this.options_[this.selectedIndex];
  }

  closeDropdown() {
    this.open = false;
  }

  select(index: number) {
    this.$emit('input', index);
    this.open = false;
  }
}
</script>

<style lang="scss" scoped>
.control {
  box-sizing: border-box;
  clear: both;
  font-size: 1rem;
  position: relative;
  text-align: center;
  .select {
    display: inline-block;
    max-width: 100%;
    position: relative;
    vertical-align: top;
    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
      outline: none;
    }
    .select-header {
      @include border-radius;
      cursor: pointer;
      border: 2px solid $white-ter;
      min-width: 40px;
      height: 40px;
      line-height: unset;
      background-color: $white;
      user-select: none;
      &:hover {
        border-color: $grey-light;
        &::after {
          border-color: $grey-darker;
        }
      }
      &.open {
        border-color: $primary;
        box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
      }
      &::after {
        border: 3px solid transparent;
        border-color: $primary;
        right: 1.125em;
        z-index: 4;
        border-radius: 2px;
        border-right: 0;
        border-top: 0;
        content: ' ';
        display: block;
        height: 0.625em;
        margin-top: -0.4375em;
        pointer-events: none;
        position: absolute;
        top: 50%;
        -webkit-transform: rotate(-45deg);
        transform: rotate(-45deg);
        -webkit-transform-origin: center;
        transform-origin: center;
        width: 0.625em;
      }
    }
  }
  .items {
    border-radius: 4px;
    overflow: hidden;
    border-right: 1px solid $grey;
    border-left: 1px solid $grey;
    border-bottom: 1px solid $grey;
    margin-top: 1px;
    position: absolute;
    background-color: $white;
    left: 0;
    right: 0;
    z-index: 99;
    .item {
      cursor: pointer;
      user-select: none;
    }
  }
}
.selectHide {
  display: none;
}
</style>
