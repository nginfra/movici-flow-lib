import { User } from '@/flow/types';

export default interface UserService {
  get(): Promise<User | null>;
}
