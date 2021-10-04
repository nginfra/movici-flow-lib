import { UUID } from '@/types/general';

export class Scope {
  scope_name: string;
  scope_uuid: UUID;
  constructor(config: Scope) {
    this.scope_name = config.scope_name;
    this.scope_uuid = config.scope_uuid;
  }
}

export class ScopeCollection {
  scopes: Scope[];
  constructor(config: ScopeCollection) {
    this.scopes = config.scopes;
  }
}

export interface RoleCollection {
  roles: Role[];
}

export interface Role {
  display_name: string;
  role_name: string;
  role_uuid: UUID;
}

export enum RoleType {
  'owner' = 'owner',
  'viewer' = 'viewer',
  'user' = 'user',
  'admin' = 'admin'
}

export interface RoleBinding {
  role: RoleType;
  scope: string;
}

export interface User {
  active: boolean;
  created_on: number;
  firstname: string;
  language: string;
  lastname: string;
  middlename: string | null;
  organisation: string;
  organisation_uuid: string;
  user_uuid?: UUID;
  username: string;
  roles?: RoleBinding[];
}
