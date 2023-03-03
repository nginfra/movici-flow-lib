<template>
  <o-field :label="label">
    <template v-if="buttons">
      <o-button
        v-if="allowEmpty"
        title="Empty"
        size="small"
        @click="$emit('input', null)"
        :class="{ 'is-primary': isSelected(null) }"
      />
      <o-button
        size="small"
        :title="icon | upperFirst"
        v-for="icon in icons"
        :key="icon"
        :icon-left="icon"
        @click="$emit('input', icon)"
        :class="{ 'is-primary': isSelected(icon) }"
      />
    </template>
    <template v-else>
      <o-dropdown :value="value" @input="$emit('input', $event)">
        <template #trigger>
          <div class="select">
            <span class="selected-icon" v-if="value">
              <o-icon class="mr-2" :icon="value" :pack="pack" />
              {{ value }}
            </span>
            <span class="placeholder" v-else>{{ placeholder }}...</span>
          </div>
        </template>
        <o-dropdown-item class="empty" :value="null" v-if="allowEmpty">
          <o-icon size="is-large" />
        </o-dropdown-item>
        <o-dropdown-item v-for="(icon, idx) in icons" :key="idx" :value="icon">
          <o-icon :icon="icon" :pack="pack" :title="icon | upperFirst" size="large" />
        </o-dropdown-item>
      </o-dropdown>
    </template>
  </o-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IconMapping } from '@deck.gl/layers/icon-layer/icon-layer';

@Component({ name: 'IconDropdownSelector' })
export default class IconDropdownSelector extends Vue {
  @Prop({ type: String, default: null }) readonly value!: string | null;
  @Prop({ type: String, default: 'fas' }) readonly pack!: string;
  @Prop({ type: Object, default: () => Object() }) readonly iconOptions!: IconMapping;
  @Prop({ type: Boolean, default: false }) readonly allowEmpty!: boolean;
  @Prop({ type: String, default: () => '' }) readonly placeholder!: string;
  @Prop({ type: Boolean, default: false }) readonly buttons!: boolean;
  @Prop({ type: String, default: '' }) readonly label!: string;

  get icons(): string[] {
    return Object.keys(this.iconOptions);
  }
  isSelected(shape: string | null) {
    return shape === this.value;
  }
}
</script>

<style scoped lang="scss">
.selected-icon,
.placeholder {
  width: 180px;
  .icon {
    color: $grey-darker;
    display: inline-flex;
    position: unset;
  }
}
::v-deep {
  .select {
    height: 2.5em;
    & > span {
      cursor: pointer;
      height: inherit;
      font-size: 1em;
      max-width: 100%;
      outline: none;
      padding-right: 2.5em;
      background-color: $white;
      border-radius: 2px;
      align-items: center;
      border: 2px solid $white-ter;
      box-shadow: none;
      display: inline-flex;
      justify-content: flex-start;
      line-height: 1.5;
      position: relative;
      padding-bottom: calc(0.5em - 1px);
      padding-left: calc(0.75em - 1px);
      padding-top: calc(0.5em - 1px);
      &:hover {
        border-color: $grey-light;
      }
      &:focus {
        border-color: $primary;
        -webkit-box-shadow: 0 0 0 0.125em rgba(26, 182, 126, 0.25);
        box-shadow: 0 0 0 0.125em rgba(26, 182, 126, 0.25);
      }
    }
  }
  .dropdown-trigger {
    font-size: 0.75rem;
  }
  .dropdown-content {
    &.is-active {
      display: flex !important;
    }
    max-height: 200px;
    width: 200px;
    flex-wrap: wrap;
    justify-content: flex-start;
    overflow: auto;
    .dropdown-item {
      flex: 0 1 0;
      padding: 0;
      margin: 0;
      &.empty {
        width: 48px;
        flex: 1 0 0;
      }
    }
  }
}
</style>
