<template>
  <b-field :label="$t('flow.visualization.iconConfig.selectIcon')">
    <b-dropdown :value="value" @input="emitIcon">
      <template #trigger>
        <div class="select">
          <span class="selected-icon" v-if="value">
            <b-icon class="mr-2" :icon="value" :pack="pack" />
            {{ value }}
          </span>
          <span class="placeholder" v-else>{{
            $t('flow.visualization.iconConfig.selectIcon')
          }}</span>
        </div>
      </template>
      <b-dropdown-item class="empty" :value="null">
        <b-icon size="is-large" />
      </b-dropdown-item>
      <b-dropdown-item v-for="(icon, idx) in icons" :key="idx" :value="icon">
        <b-icon :icon="icon" :pack="pack" :title="icon | upperFirst" size="is-large" />
      </b-dropdown-item>
    </b-dropdown>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SOLID_ICONS from '@movici-flow-common/assets/icons/icons.json';
import { IconPackName } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';

@Component({
  name: 'IconSelector'
})
export default class IconSelector extends Vue {
  @Prop({ type: String, default: null }) readonly value!: string | null;
  @Prop({ type: String, default: 'fas' }) readonly pack!: IconPackName;

  get icons(): string[] {
    return Object.keys(SOLID_ICONS ?? []);
  }

  emitIcon(icon: string | null) {
    this.$emit('input', icon);
  }
}
</script>

<style scoped lang="scss">
::v-deep {
  .dropdown-trigger {
    font-size: 0.75rem;

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
        color: $grey-darker;
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
  }
  .dropdown-content {
    max-height: 200px;
    width: 200px;
    display: flex;
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
