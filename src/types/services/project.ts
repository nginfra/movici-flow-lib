import { Project } from '..';

export default interface ProjectService {
  list(): Promise<Project[] | null>;
}
