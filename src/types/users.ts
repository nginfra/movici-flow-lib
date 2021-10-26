import { UUID } from '@/flow/types/general';

export type Language = 'nl' | 'en';

export interface User {
  active: boolean;
  created_on: number;
  firstname: string;
  language: Language;
  lastname: string;
  middlename: null | string;
  user_uuid?: UUID;
  username: string;
}
