<template>
  <div class="has-background-white">
    <div class="level is-flex" v-if="!isPaginated">
      <ResourceCounter :filtered-length="filteredLength" :checked-length="checkedLength" />
      <slot name="level-left"></slot>
      <span class="is-flex-grow-1"></span>
      <slot name="level-right"></slot>
      <ResourceSearch v-model="filteredItems" :items="value" :filterKeys="filterKeys" />
    </div>
    <b-table
      :data="filteredItems"
      :checked-rows.sync="checked"
      :is-row-checkable="row => row[uuidKey]"
      :default-sort="defaultSort"
      :paginated="isPaginated"
      :per-page="perPage"
      :pagination-position="paginationPosition"
      pagination-simple
      checkable
      hoverable
    >
      <template #top-left>
        <ResourceCounter :filtered-length="filteredLength" :checked-length="checkedLength">
          <b-tooltip class="mr-2" type="is-black" :label="checkedTooltipLabel">
            <b-checkbox v-model="allChecked" :indeterminate="checkedLength > 0 && !allChecked" />
          </b-tooltip>
        </ResourceCounter>
        <slot name="level-left"></slot>
        <span class="is-flex-grow-1"></span>
        <slot name="level-right"></slot>
        <ResourceSearch v-model="filteredItems" :items="value" :filterKeys="filterKeys" />
      </template>
      <slot name="columns"></slot>
      <template #empty>
        <slot name="placeholder"></slot>
        <p v-if="noResourcesDefault">No resources available</p>
      </template>
    </b-table>
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
  @Prop({ type: Number, default: 50 }) readonly perPage!: number;
  filteredItems: T[] = [];

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

  get paginationPosition() {
    return this.isPaginated ? 'both' : null;
  }

  get isPaginated() {
    return this.filteredLength > this.perPage;
  }

  get allChecked() {
    return this.filteredLength === this.checkedLength && this.checkedLength > 0;
  }

  set allChecked(select: boolean) {
    this.checked = select ? this.filteredItems : [];
  }

  get checkedTooltipLabel() {
    return this.allChecked ? 'Deselect from all pages' : 'Select from all pages';
  }

  get noResourcesDefault() {
    return !this.$slots.placeholder && (!this.value || !this.value.length);
  }

  @Watch('filteredItems')
  afterFilteredItems() {
    this.checked = [];
  }
}
</script>

<style scoped lang="scss">
.level {
  margin-bottom: 1em !important;
  align-items: center;
}
::v-deep {
  .checkbox {
    .control-label {
      display: none;
    }
  }
  .b-table {
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
