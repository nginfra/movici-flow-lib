<template>
  <div class="has-background-white">
    <div class="level is-flex" v-if="!isPaginated">
      <ResourceCounter
        class="ml-1 mr-3 checkbox-container"
        :filtered-length="filteredLength"
        :checked-length="checkedLength"
      />
      <slot name="level-left"></slot>
      <span class="is-flex-grow-1"></span>
      <ResourceSearch v-model="filteredItems" :items="value" :filterKeys="filterKeys" />
      <slot name="level-right"></slot>
    </div>
    <b-table
      v-if="value.length"
      :data="filteredItems"
      :checked-rows.sync="checked"
      :is-row-checkable="row => row[uuidKey]"
      :default-sort="defaultSort"
      :paginated="isPaginated"
      :per-page="perPage"
      pagination-position="both"
      pagination-simple
      checkable
      hoverable
    >
      <template #top-left>
        <ResourceCounter
          class="mx-3 checkbox-container"
          :filtered-length="filteredLength"
          :checked-length="checkedLength"
        >
          <b-tooltip v-if="isPaginated" type="is-black" :label="checkedTooltipLabel">
            <b-checkbox
              class="all-checked"
              v-model="allChecked"
              :indeterminate="checkedLength > 0 && !allChecked"
            />
          </b-tooltip>
        </ResourceCounter>
        <slot name="level-left"></slot>
        <span class="is-flex-grow-1" />
        <ResourceSearch v-model="filteredItems" :items="value" :filterKeys="filterKeys" />
        <slot name="level-right"></slot>
        <span class="checkbox-container ml-5">
          <b-tooltip type="is-black" label="View all items">
            <b-checkbox v-model="viewAll">All</b-checkbox>
          </b-tooltip>
        </span>
      </template>
      <slot name="columns"></slot>
    </b-table>
    <div class="placeholder" v-else>
      <slot name="placeholder" />
      <p v-if="noResourcesDefault">{{ $t('misc.noResources') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ResourceSearch from './ResourceSearch.vue';
import ResourceCounter from './ResourceCounter.vue';

@Component({ name: 'ResourceList', components: { ResourceSearch, ResourceCounter } })
export default class ResourceList<T> extends Vue {
  @Prop({ type: Array }) readonly value!: T[]; // items from the list
  @Prop({ type: Array }) readonly checkedRows!: T[];
  @Prop({ type: Array, default: () => [] }) readonly filterKeys!: string[];
  @Prop({ type: String, default: '' }) readonly defaultSort!: string;
  @Prop({ type: String, default: 'uuid' }) readonly uuidKey!: string;
  isPaginated = false;
  viewAll = false;
  filteredItems: T[] = [];

  get perPage() {
    return this.viewAll ? this.filteredLength : 50;
  }

  get checked() {
    return this.checkedRows;
  }

  set checked(val) {
    this.$emit('update:checkedRows', val);
  }

  get checkedLength() {
    return this.checked.length;
  }

  get filteredLength() {
    return this.filteredItems.length;
  }

  get allChecked() {
    return this.filteredLength === this.checkedLength && this.checkedLength > 0;
  }

  set allChecked(select: boolean) {
    this.checked = select ? this.filteredItems : [];
  }

  get checkedTooltipLabel() {
    return this.allChecked ? this.$t('misc.deselectAllPages') : this.$t('misc.selectAllPages');
  }

  get noResourcesDefault() {
    return !this.$scopedSlots.placeholder && (!this.value || !this.value.length);
  }

  @Watch('filteredItems')
  afterFilteredItems() {
    this.checked = [];

    if (this.filteredLength > 0 && !this.isPaginated) {
      this.isPaginated = this.filteredLength > this.perPage;
    }
  }
}
</script>

<style scoped lang="scss">
.level {
  align-items: center;
  margin-bottom: 1em !important;
}
.checkbox-container {
  height: 20px;
  padding-left: 1px;
  line-height: 16px;
}
::v-deep {
  .checkbox.all-checked {
    margin-right: 0;
    .control-label {
      display: none;
    }
  }
  .b-table {
    .level {
      margin-bottom: 1em !important;
    }
    .level-left {
      flex: 1 1 0;
      margin-right: 1em;
    }
    .pagination {
      .info {
        margin-right: 4px;
        font-size: 1em;
        font-weight: bold;
      }
    }
  }
}
</style>
