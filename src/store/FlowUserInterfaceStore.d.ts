import { FlowSection, FlowSectionItem } from '@/types';
import { VuexModule } from 'vuex-module-decorators';
declare class FlowUIStore extends VuexModule {
    flowSections: FlowSection[];
    collapse: boolean;
    disableCollapser: boolean;
    loading: boolean;
    loadingMessage: string | null;
    lang: string;
    SET_SECTIONS(payload: FlowSection[]): void;
    SET_LANG(lang: string): void;
    toggleCollapse(force?: boolean): void;
    setDisableCollapser(value: boolean): void;
    setLanguage(lang: string): void;
    setLoading({ value, msg }: {
        value: boolean;
        msg?: string | null;
    }): void;
    setSections(payload: FlowSection[]): void;
    enableSection(payload: Partial<Record<FlowSectionItem, boolean>>): void;
}
export default FlowUIStore;
