import { UUID, View, ViewCrudResponse } from '@/flow/types';

export default interface ViewService {
  create(scenarioUUID: UUID, view: View): Promise<ViewCrudResponse | null>;
  list(scenarioUUID: UUID): Promise<View[] | null>;
  get(viewUUID: UUID): Promise<View | null>;
  update(viewUUID: UUID, view: View): Promise<ViewCrudResponse | null>;
  delete(viewUUID: UUID): Promise<ViewCrudResponse | null>;
}
