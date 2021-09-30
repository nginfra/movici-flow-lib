import { User } from '@/flow/src/types';

export default interface UserService {
  get(): Promise<User | null>;
}
