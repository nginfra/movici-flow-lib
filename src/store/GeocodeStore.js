import { __decorate } from "tslib";
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { transform, reverseTransform } from '@/crs';
function transformResult(result) {
    return Object.assign({}, result, {
        location: transform(result.location),
        bounding_box: [
            ...transform([result.bounding_box[0], result.bounding_box[1]]),
            ...transform([result.bounding_box[2], result.bounding_box[3]])
        ]
    });
}
function prepareQuery(query, epsg_code) {
    query = { ...query };
    if (query.nearby_location) {
        query.nearby_location = reverseTransform(query.nearby_location);
    }
    if (query.bounding_box) {
        query.bounding_box = [
            ...reverseTransform([query.bounding_box[0], query.bounding_box[1]]),
            ...reverseTransform([query.bounding_box[2], query.bounding_box[3]])
        ];
    }
    query.epsg_code = epsg_code;
    return query;
}
let GeocodeStore = class GeocodeStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.suggestions = [];
        this.upstreamEPSG = 28992;
        this.backend_ = null;
    }
    get backend() {
        return this.backend_;
    }
    setSuggestions(suggestions) {
        this.suggestions = suggestions;
    }
    SET_BACKEND(backend) {
        this.backend_ = backend;
    }
    async updateSuggestions(query) {
        var _a;
        if (!query) {
            this.setSuggestions([]);
            return;
        }
        this.setSuggestions((await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.geocode.getSuggestions(prepareQuery(query, this.upstreamEPSG)))) || []);
    }
    // add to client interface
    async resolveSuggestion(suggestion) {
        var _a;
        const result = await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.geocode.resolveSuggestion(suggestion));
        return (result && transformResult(result)) || null;
    }
    async getFirstResult(query) {
        var _a, _b;
        const result = (_b = (await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.geocode.getResults(prepareQuery(query, this.upstreamEPSG))))) !== null && _b !== void 0 ? _b : [];
        return (result.length && transformResult(result[0])) || null;
    }
};
__decorate([
    Mutation
], GeocodeStore.prototype, "setSuggestions", null);
__decorate([
    Mutation
], GeocodeStore.prototype, "SET_BACKEND", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "updateSuggestions", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "resolveSuggestion", null);
__decorate([
    Action({ rawError: true })
], GeocodeStore.prototype, "getFirstResult", null);
GeocodeStore = __decorate([
    Module({
        name: 'geocode',
        namespaced: true
    })
], GeocodeStore);
export default GeocodeStore;
