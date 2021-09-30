import { ComponentProperty, Update, UpdateWithData, UUID } from '@/flow/src/types';

export default interface UpdatesService {
  get(
    uuid: UUID,
    entityGroup: string,
    properties: ComponentProperty[]
  ): Promise<UpdateWithData | null>;

  list(uuid: string): Promise<Update[] | null>;
}
