import { UUID } from '@/types/general';
export declare type ProjectCollection = {
    projects: Project[];
};
export declare type Project = {
    uuid: UUID;
    name: string;
    display_name: string;
    created_on?: number;
    dataset_count?: number;
    scenario_count?: number;
};
