import { __decorate } from "tslib";
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
let FlowUIStore = class FlowUIStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.flowSections = [];
        this.collapse = false;
        this.disableCollapser = false;
        this.loading = false;
        this.loadingMessage = null;
        this.lang = 'en';
    }
    SET_SECTIONS(payload) {
        this.flowSections = payload;
    }
    SET_LANG(lang) {
        this.lang = lang;
    }
    toggleCollapse(force) {
        this.collapse = force !== null && force !== void 0 ? force : !this.collapse;
    }
    setDisableCollapser(value) {
        this.disableCollapser = value;
    }
    setLanguage(lang) {
        this.SET_LANG(lang);
    }
    setLoading({ value, msg }) {
        this.loading = value;
        this.loadingMessage = value ? msg !== null && msg !== void 0 ? msg : null : null;
    }
    setSections(payload) {
        this.SET_SECTIONS(payload);
    }
    enableSection(payload) {
        const affectedSections = Object.keys(payload);
        this.SET_SECTIONS(this.flowSections.map((section, idx) => {
            return Object.assign({}, this.flowSections[idx], {
                enabled: affectedSections.indexOf(section.name) !== -1 ? payload[section.name] : section.enabled
            });
        }));
    }
};
__decorate([
    Mutation
], FlowUIStore.prototype, "SET_SECTIONS", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "SET_LANG", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "toggleCollapse", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "setDisableCollapser", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "setLanguage", null);
__decorate([
    Mutation
], FlowUIStore.prototype, "setLoading", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "setSections", null);
__decorate([
    Action({ rawError: true })
], FlowUIStore.prototype, "enableSection", null);
FlowUIStore = __decorate([
    Module({
        name: 'flowUI',
        namespaced: true
    })
], FlowUIStore);
export default FlowUIStore;
