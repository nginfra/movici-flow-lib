export class Scope {
    constructor(config) {
        this.scope_name = config.scope_name;
        this.scope_uuid = config.scope_uuid;
    }
}
export class ScopeCollection {
    constructor(config) {
        this.scopes = config.scopes;
    }
}
export var RoleType;
(function (RoleType) {
    RoleType["owner"] = "owner";
    RoleType["viewer"] = "viewer";
    RoleType["user"] = "user";
    RoleType["admin"] = "admin";
})(RoleType || (RoleType = {}));
