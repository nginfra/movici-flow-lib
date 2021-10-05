import { Project } from '@/types';
export default interface ProjectService {
    list(): Promise<Project[] | null>;
}
