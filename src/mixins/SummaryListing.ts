import { Component, Vue, Watch } from 'vue-property-decorator';
import {
  Dataset,
  DatasetSummary,
  EntityGroupSummary,
  PropertyType,
  ScenarioDataset
} from '../types';
import { flowStore } from '../store/store-accessor';

@Component
export default class SummaryListing extends Vue {
  summary: DatasetSummary | null = null;
  currentDataset: Dataset | ScenarioDataset | null = null;
  currentDatasetName: string | null = null;
  currentDatasetUUID: string | null = null;
  currentEntityName: string | null = null;
  datasets: (Dataset | ScenarioDataset)[] = [];

  get datasetsByName(): Record<string, Dataset | ScenarioDataset> {
    return this.datasets.reduce((rv: Record<string, Dataset | ScenarioDataset>, d) => {
      rv[d.name] = d;
      return rv;
    }, {});
  }

  get entityGroups(): EntityGroupSummary[] {
    return this.summary?.entity_groups ?? [];
  }

  get properties(): PropertyType[] {
    return this.entitySummary?.properties ?? [];
  }

  get entitySummary(): EntityGroupSummary | null {
    if (!this.summary) return null;
    const rv = this.summary.entity_groups.filter(e => e.name === this.currentEntityName);
    return rv.length ? rv[0] : null;
  }

  @Watch('currentDatasetUUID')
  async getSummaryByUUID(currentDatasetUUID?: string | null) {
    if (currentDatasetUUID) {
      this.summary = await flowStore.getDatasetSummary({ datasetUUID: currentDatasetUUID });
    }

    if (!this.summary || !this.summary.entity_groups.find(e => e.name === this.currentEntityName)) {
      // reset the current entitygroup only if it doesn't exist on the current dataset
      this.currentEntityName = null;
    }
  }

  @Watch('currentDatasetName')
  async getSummary(currentDatasetName?: string | null) {
    if (!currentDatasetName) return;

    this.currentDatasetUUID = this.datasets.find(d => d.name === currentDatasetName)?.uuid ?? null;
  }
}
