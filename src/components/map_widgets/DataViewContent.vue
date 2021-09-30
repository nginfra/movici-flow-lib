<template>
  <div>
    <div class="header align-items-center is-flex mb-1">
      <label class="label is-size-6-half is-flex-grow-1 has-text-weight-bold">{{
        value.title
      }}</label>
      <b-button
        class="close is-borderless is-transparent"
        icon-pack="far"
        icon-left="times"
        @click="$emit('close')"
        size="is-small"
        v-if="value.when !== 'onHover'"
      >
      </b-button>
    </div>
    <ul class="attributes">
      <li class="is-flex is-size-7" v-for="(item, idx) in items" :key="idx">
        <span class="name is-flex-grow-1 mr-2">
          {{ item.name
          }}<span class="unit" v-if="item.attribute.unit"> ({{ item.attribute.unit }})</span>:
        </span>
        <span class="value has-text-weight-bold">{{ filterValue(item) }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { PopupContent, PropertyType } from '@/flow/src/types';

@Component({
  name: 'DataViewContent'
})
export default class DataViewContent extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PopupContent | null;
  @Prop({ type: Number, default: null }) readonly timestamp!: number | null;

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

  filterValue({ value, attribute }: { value: boolean | number | null; attribute: PropertyType }) {
    let rv;

    if (typeof value === 'undefined' || value === null) return 'N/A';

    switch (attribute.data_type) {
      case 'BOOLEAN':
        rv = value ? this.$t('misc.yes') : this.$t('misc.no');
        break;
      case 'INT':
        rv = Number(value);
        break;
      case 'DOUBLE':
        rv = Number(value);
        if (rv !== 0) {
          if (Math.abs(rv) < 1e-3 || Math.abs(rv) > 1e5) {
            // if value is very small or very big, then show as scientific notation
            const [base, exp] = rv.toExponential().split('e');
            rv = Number(base).toFixed(3) + 'e' + exp;
          } else {
            // float numbers show 3 decimals tops
            rv = rv.toFixed(3);
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
</script>

<style scoped lang="scss">
.header {
  min-height: 1.5rem;
  .label {
    margin: 0;
  }
  .close {
    margin: -0.25rem -0.5rem 0 0;
  }
}
.attributes {
  color: $black;
  .value {
    min-width: 50px;
    text-align: right;
  }
}
</style>
