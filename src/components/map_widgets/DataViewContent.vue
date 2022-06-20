<template>
  <div class="data-content">
    <div class="header align-items-center is-flex mb-1">
      <label class="label is-size-6 is-flex-grow-1 mr-1" :title="titleTooltip">
        <template v-if="dynamicTitle">
          {{ dynamicTitle }}
        </template>
        <template v-else>
          {{ title }}
        </template>
      </label>
      <span class="close is-clickable" @click="$emit('close')" v-if="value.when !== 'onHover'">
        <b-icon pack="far" icon="times"></b-icon>
      </span>
    </div>
    <table class="attributes">
      <tr class="is-size-7" v-for="(item, idx) in filteredItems" :key="idx">
        <td class="name">
          {{ item.name }}<span class="unit"> ({{ item.attribute.unit || '-' }})</span>:
        </td>
        <td class="value has-text-weight-bold">
          <span>{{ formatValue(item) }}</span>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { PopupContent, PropertyType } from '@movici-flow-common/types';
import { Formatter, formatValueByDataType } from '@movici-flow-common/utils/format';

interface DataViewItem {
  name: string;
  value: unknown;
  attribute: PropertyType;
  enum?: string[];
}

@Component({ name: 'DataViewContent' })
export default class DataViewContent extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PopupContent | null;
  @Prop({ type: Number, default: null }) readonly timestamp!: number | null;

  get title() {
    return this.value?.title;
  }

  get dynamicTitle() {
    if (this.value?.dynamicTitle) {
      const { value, attribute } = this.items[0];
      return this.formatValue({ value, attribute });
    }
    return null;
  }

  get titleTooltip() {
    return this.value?.dynamicTitle ? this.items[0].name : this.title;
  }

  get items(): DataViewItem[] {
    if (!this.value) {
      return [];
    }

    const index = this.value.index;
    return this.value.items.map(item => {
      if (this.timestamp !== null) {
        item.tapefile.moveTo(this.timestamp);
      }

      return {
        name: item.name,
        attribute: item.attribute,
        value: item?.tapefile.data[index],
        enum: item.enum
      };
    });
  }

  get filteredItems() {
    return this.dynamicTitle ? this.items.filter((val, idx) => idx !== 0) : this.items;
  }

  formatValue(item: Omit<DataViewItem, 'name'>) {
    const { value, attribute, enum: enums } = item;

    const formatters: Record<string, Formatter> = {
      NULL: () => 'N/A',
      BOOLEAN: (val: unknown) => String(val ? this.$t('misc.yes') : this.$t('misc.no'))
    };
    if (enums) {
      formatters.ENUM = (val: unknown) => enums[Number(val)] ?? `N/A (${val})`;
    }
    return formatValueByDataType(value, attribute.data_type, formatters);
  }
}
</script>

<style scoped lang="scss">
.data-content {
  max-width: 500px;
  min-width: max-content;
  width: 100%;
  .header {
    min-height: 1.5rem;
    .label {
      margin: 0;
    }
  }
  .attributes {
    color: $black;
    width: 100%;
    .name {
      text-align: left;
    }
    .value {
      padding-left: 0.75em;
      text-align: right;
      span {
        white-space: break-spaces;
      }
    }
  }
  .close {
    margin: -0.25rem -0.25rem 0 0;
  }
}
</style>
