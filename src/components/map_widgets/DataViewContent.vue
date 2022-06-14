<template>
  <div class="data-content">
    <div class="header align-items-center is-flex mb-1">
      <label class="label is-size-6 is-flex-grow-1 mb-0" :title="titleTooltip">
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

  get items(): {
    name: string;
    value: unknown;
    attribute: PropertyType;
  }[] {
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
        value: item?.tapefile.data[index]
      };
    });
  }

  get filteredItems() {
    return this.dynamicTitle ? this.items.filter((val, idx) => idx !== 0) : this.items;
  }

  formatValue({ value, attribute }: { value: unknown; attribute: PropertyType }) {
    let rv;

    if (typeof value === 'undefined' || value === null) return 'N/A';

    switch (attribute.data_type) {
      case 'BOOLEAN':
        rv = value ? this.$t('misc.yes') : this.$t('misc.no');
        break;
      case 'INT':
        rv = Number(value);
        break;
      case 'LIST<INT>':
        rv = value as number[];
        break;
      case 'DOUBLE':
      case 'FLOAT':
        rv = Number(value);
        if (rv !== 0) {
          if (Math.abs(rv) < 1e-3 || Math.abs(rv) > 1e5) {
            // if value is very small or very big, then show as scientific notation
            const [base, exp] = rv.toExponential().split('e');
            rv = Number(base).toFixed(3) + 'e' + exp;
          } else {
            // float numbers show 3 decimals tops
            // check if decimals are non 0
            const decimals = countDecimals(rv, 3);
            rv = rv.toFixed(decimals);
          }
        }
        break;
      default:
        rv = value;
        break;
    }

    return rv;
  }
}

function countDecimals(value: number, max?: number) {
  if (Math.floor(value) === value) return 0;
  let rv = value.toString().split('.')[1].length || 0;
  if (max !== undefined) {
    rv = Math.min(rv, max);
  }
  return rv;
}
</script>

<style scoped lang="scss">
.data-content {
  max-width: 500px;

  .header {
    min-height: 1.5rem;
    .label {
      margin: 0;
      max-width: 450px;
    }
  }
  .attributes {
    color: $black;
    width: 100%;
    .name {
      padding-right: 0.75em;
      max-width: 450px;
    }
    .value {
      min-width: 50px;
      text-align: right;
    }
  }
  .close {
    margin: -0.25rem -0.25rem 0 0;
  }
}
</style>
