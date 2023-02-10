<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <b-field :label="$t('flow.visualization.iconConfig.selectIcon')">
        <IconDropdownSelector
          :value="currentIcon"
          :iconOptions="iconOptions"
          :placeholder="$t('flow.visualization.iconConfig.selectIcon')"
          pack="fas"
          @input="updateIcon($event)"
          allowEmpty
        />
      </b-field>
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IconClause } from '@movici-flow-common/types';
import IconDropdownSelector from './IconDropdownSelector.vue';
import { MAPPED_ICONS } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';

@Component({
  name: 'IconStaticConfigurator',
  components: {
    IconDropdownSelector
  }
})
export default class IconStaticConfigurator extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: IconClause | null;

  get currentIcon() {
    return this.value?.static?.icon ?? null;
  }

  get iconOptions() {
    return MAPPED_ICONS.icons;
  }

  updateIcon(icon: string | null) {
    this.updateSettings(!icon ? {} : { static: { icon } });
  }

  updateSettings(updatedClause: IconClause) {
    this.$emit('input', updatedClause as IconClause);
  }
}
</script>

<style scoped lang="scss"></style>
