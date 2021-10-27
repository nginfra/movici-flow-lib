import { User } from '..';

export default interface UserService {
  get(): Promise<User | null>;
}
