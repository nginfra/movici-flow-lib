import { __decorate } from "tslib";
import { Component, Vue, Watch } from 'vue-property-decorator';
import { flowStore } from '@/store/store-accessor';
let SummaryListing = class SummaryListing extends Vue {
    constructor() {
        super(...arguments);
        this.summary = null;
        this.currentDatasetName = null;
        this.currentDatasetUUID = null;
        this.currentEntityName = null;
        this.datasets = [];
    }
    get datasetsByName() {
        return this.datasets.reduce((rv, d) => {
            rv[d.name] = d;
            return rv;
        }, {});
    }
    get entityGroups() {
        var _a, _b;
        return (_b = (_a = this.summary) === null || _a === void 0 ? void 0 : _a.entity_groups) !== null && _b !== void 0 ? _b : [];
    }
    get properties() {
        var _a, _b;
        return (_b = (_a = this.entitySummary) === null || _a === void 0 ? void 0 : _a.properties) !== null && _b !== void 0 ? _b : [];
    }
    get entitySummary() {
        if (!this.summary)
            return null;
        const rv = this.summary.entity_groups.filter(e => e.name === this.currentEntityName);
        return rv.length ? rv[0] : null;
    }
    async getSummary(currentDatasetName) {
        var _a, _b;
        if (!currentDatasetName)
            return;
        this.currentDatasetUUID = (_b = (_a = this.datasets.find(d => d.name === currentDatasetName)) === null || _a === void 0 ? void 0 : _a.uuid) !== null && _b !== void 0 ? _b : null;
        if (this.currentDatasetUUID) {
            this.summary = await flowStore.getDatasetSummary({ datasetUUID: this.currentDatasetUUID });
        }
        if (!this.summary || !this.summary.entity_groups.find(e => e.name === this.currentEntityName)) {
            // reset the current entitygroup only if we're it doesn't exist on the current dataset
            this.currentEntityName = null;
        }
    }
    async getAvailableDatasets() {
        var _a;
        const projectUUID = (_a = flowStore.project) === null || _a === void 0 ? void 0 : _a.uuid;
        if (projectUUID) {
            this.datasets = (await flowStore.getDatasets(projectUUID)) || [];
        }
    }
};
__decorate([
    Watch('currentDatasetName')
], SummaryListing.prototype, "getSummary", null);
SummaryListing = __decorate([
    Component
], SummaryListing);
export default SummaryListing;
