import type { Ref } from "vue";
import type { CrudResponse, IRequest } from "./api";
import type { Field } from "./forms";
import type { UUID } from "./general";
import type { ActionType } from "./ui";

export interface ShortResource {
  uuid: UUID;
}
export interface ResourceStrategy<ShortResource, Resource extends ShortResource = ShortResource> {
  groupActions: ActionType[];
  singleActions: ActionType[];
  enabledActions?(selectedItems: ShortResource[]): ActionType[];
  handleAction?(action: ActionType, payload: (Resource | ShortResource)[]): Promise<boolean | void>;
  messages: ResourceMessages<Resource | ShortResource>;
  detailsFields?(editing: boolean): (Field<Resource> | Field<Resource>[])[];
  autoReload?: boolean | (() => Promise<void>);
}
export interface ResourceMessages<T> {
  create: SingleResourceMessages<T>;
  update: SingleResourceMessages<T>;
  delete: SingleResourceMessages<T>;
}

export type StringOrFunction<T> = string | ((payload: T) => string);
export interface SingleResourceMessages<T>
  extends Record<string, StringOrFunction<T[]> | undefined> {
  title: StringOrFunction<T[]>;
  succesful: StringOrFunction<T[]>;
  variant?: StringOrFunction<T[]>;
  message?: StringOrFunction<T[]>;
  confirmButtonText?: StringOrFunction<T[]>;
}
export type RequestLike<T> = IRequest<T> | Promise<T | null> | null;

export interface SimpleCRUDTemplate<ShortResource, Resource extends ShortResource = ShortResource> {
  list: () => RequestLike<ShortResource[]>;
  create: (res: Resource) => RequestLike<unknown>;
  update: (uuid: UUID, payload: Resource) => RequestLike<unknown>;
  delete: (uuid: UUID) => RequestLike<unknown>;
  uuid: (res: ShortResource | Resource) => UUID;
}
export interface CRUDTemplate<
  ShortResource,
  Resource extends ShortResource = ShortResource,
  CR extends CrudResponse = CrudResponse
> extends SimpleCRUDTemplate<ShortResource, Resource> {
  list: () => RequestLike<ShortResource[]>;
  create: (res: Resource) => RequestLike<CR>;
  read: (uuid: UUID) => RequestLike<Resource>;
  update: (uuid: UUID, payload: Resource) => RequestLike<CR>;
  delete: (uuid: UUID) => RequestLike<CR>;
  uuid: (res: ShortResource | Resource | CR) => UUID;
}

export type RefLike<T> = Ref<T> | T;

export interface SimpleResourceStore<
  ShortResource,
  Resource extends ShortResource = ShortResource
> {
  allResources: RefLike<ShortResource[]>;
  listResources(): Promise<void>;
  createResource(res: Resource): Promise<boolean>;
  updateResource(payload: Resource): Promise<boolean>;
  deleteResource(res?: ShortResource): Promise<boolean>;
}
export interface ResourceStore<
  ShortResource,
  Resource extends ShortResource = ShortResource,
  CR extends CrudResponse = CrudResponse
> extends SimpleResourceStore<ShortResource, Resource> {
  activeResource: RefLike<Resource | null>;
  activeResourceUUID: RefLike<UUID | null>;
  readResource(res: ShortResource | CR | UUID): Promise<void>;
  readResourceNoStore(res: ShortResource | CR | UUID): Promise<Resource | null>;
  reloadResources(): Promise<void>;
  reloadActiveResource(): Promise<void>;
  loading?: RefLike<boolean>;
}
