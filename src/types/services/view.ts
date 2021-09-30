import { UUID, View } from '@/flow/src/types';

export default interface ViewService {
  create(scenarioUUID: UUID, view: View): Promise<{ view_uuid: UUID } | null>;
  list(scenarioUUID: UUID): Promise<View[] | null>;
  get(viewUUID: UUID): Promise<View | null>;
  update(viewUUID: UUID, view: View): Promise<void | null>;
  delete(viewUUID: UUID): Promise<void | null>;
}
