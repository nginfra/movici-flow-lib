import { ComponentProperty, Dataset, DatasetWithData, UUID } from '@/flow/types';

export default interface DatasetService {
  list(project_uuid?: UUID): Promise<Dataset[]>;

  getData<T>(params: {
    datasetUUID: UUID;
    entityGroup?: string;
    properties?: ComponentProperty[];
  }): Promise<DatasetWithData<T> | null>;

  getState<T>(params: {
    datasetUUID: UUID;
    scenarioUUID: UUID;
    entityGroup: string;
    properties?: ComponentProperty[];
    timestamp?: number;
  }): Promise<DatasetWithData<T> | null>;
}
