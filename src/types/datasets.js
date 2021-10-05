export class Dataset {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f;
        this.name = (_a = config === null || config === void 0 ? void 0 : config.name) !== null && _a !== void 0 ? _a : 'unknown_dataset';
        this.display_name = (config === null || config === void 0 ? void 0 : config.display_name) || this.name;
        this.uuid = (_b = config === null || config === void 0 ? void 0 : config.uuid) !== null && _b !== void 0 ? _b : '<unknown_uuid>';
        this.type = (_c = config === null || config === void 0 ? void 0 : config.type) !== null && _c !== void 0 ? _c : 'unknown';
        this.has_data = (_d = config === null || config === void 0 ? void 0 : config.has_data) !== null && _d !== void 0 ? _d : false;
        this.status = this.has_data ? 'Done' : 'Empty';
        this.created_on = (_e = config === null || config === void 0 ? void 0 : config.created_on) !== null && _e !== void 0 ? _e : undefined;
        this.last_modified = (_f = config === null || config === void 0 ? void 0 : config.last_modified) !== null && _f !== void 0 ? _f : undefined;
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DatasetWithData extends Dataset {
    constructor(config) {
        var _a;
        super(config);
        this.data = (_a = config.data) !== null && _a !== void 0 ? _a : {};
    }
}
