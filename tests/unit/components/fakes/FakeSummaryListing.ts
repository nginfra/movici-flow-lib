import { Component, Vue } from 'vue-property-decorator';
import { Dataset, DatasetSummary, PropertyType } from '@movici-flow-common/types';

@Component
export default class SummaryListing extends Vue {
  summary: DatasetSummary | null = null;
  currentDatasetName: string | null = null;
  currentEntityName: string | null = null;

  get datasets(): Dataset[] {
    return [];
  }

  get entityGroups(): string[] {
    return this.summary ? this.summary.entity_groups.map(e => e.name) : [];
  }

  get properties(): PropertyType[] {
    return [];
  }

  async getSummary() {}

  async getAvailableDatasets() {}
}
