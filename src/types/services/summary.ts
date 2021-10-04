import { DatasetSummary, UUID } from '@/types';

export default interface SummaryService {
  getScenario(scenario_uuid: UUID, dataset_uuid: UUID): Promise<DatasetSummary | null>;
  getDataset(dataset_uuid: UUID): Promise<DatasetSummary | null>;
}
