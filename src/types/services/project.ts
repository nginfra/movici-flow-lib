import { Project } from '@/flow/types';

export default interface ProjectService {
  list(): Promise<Project[] | null>;
}
