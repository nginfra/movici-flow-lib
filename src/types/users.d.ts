import { UUID } from '@/types/general';
export declare class Scope {
    scope_name: string;
    scope_uuid: UUID;
    constructor(config: Scope);
}
export declare class ScopeCollection {
    scopes: Scope[];
    constructor(config: ScopeCollection);
}
export interface RoleCollection {
    roles: Role[];
}
export interface Role {
    display_name: string;
    role_name: string;
    role_uuid: UUID;
}
export declare enum RoleType {
    'owner' = "owner",
    'viewer' = "viewer",
    'user' = "user",
    'admin' = "admin"
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
