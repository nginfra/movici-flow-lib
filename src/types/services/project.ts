import { Project } from '@/flow/src/types';

export default interface ProjectService {
  list(): Promise<Project[] | null>;
}
