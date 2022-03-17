<template>
  <b-field class="mr-2 mb-0">
    <b-input
      :placeholder="$t('actions.search') + '...'"
      type="search"
      icon="search"
      v-model="search"
    >
    </b-input>
  </b-field>
</template>
<script lang="ts">
import { hasOwnProperty } from '@movici-flow-common/utils';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({
  name: 'MovResourceSearch'
})
export default class MovResourceSearch<T> extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: T[];
  @Prop({ type: Array, default: () => [] }) readonly items!: T[];
  @Prop({ type: Array, default: () => [] }) readonly filterKeys!: string[];
  search = '';

  @Watch('search')
  @Watch('items', { immediate: true })
  onSearch() {
    const filteredItems = this.items.filter((val: T) => {
      let rv = false;
      for (let index = 0; index < this.filterKeys.length && !rv; index++) {
        const key = this.filterKeys[index];

        if (hasOwnProperty(val, key)) {
          rv = String(val[key]).toLowerCase().includes(this.search.toLowerCase());
        }
      }
      return rv;
    });

    this.$emit('input', filteredItems);
  }
}
</script>
<style scoped></style>
