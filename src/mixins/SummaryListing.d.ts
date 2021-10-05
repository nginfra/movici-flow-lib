import { Vue } from 'vue-property-decorator';
import { Dataset, DatasetSummary, EntityGroupSummary, PropertyType, ScenarioDataset } from '@/types';
export default class SummaryListing extends Vue {
    summary: DatasetSummary | null;
    currentDatasetName: string | null;
    currentDatasetUUID: string | null;
    currentEntityName: string | null;
    datasets: (Dataset | ScenarioDataset)[];
    get datasetsByName(): Record<string, Dataset | ScenarioDataset>;
    get entityGroups(): EntityGroupSummary[];
    get properties(): PropertyType[];
    get entitySummary(): EntityGroupSummary | null;
    getSummary(currentDatasetName?: string | null): Promise<void>;
    getAvailableDatasets(): Promise<void>;
}
