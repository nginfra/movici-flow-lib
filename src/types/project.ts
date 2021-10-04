import { UUID } from '@/types/general';

export type ProjectCollection = {
  projects: Project[];
};

export type Project = {
  uuid: UUID;
  name: string;
  display_name: string;
  created_on?: number;
  dataset_count?: number;
  scenario_count?: number;
};
