import { User } from '@/types';

export default interface UserService {
  get(): Promise<User | null>;
}
