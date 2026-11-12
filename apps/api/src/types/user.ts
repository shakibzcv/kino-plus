import { DbUser } from '../services/auth.services';

export interface AppUser extends Partial<DbUser> {
  id: string;
  email: string;
  name?: string | null;
  googleId?: string;
  firstName?: string | null;
  lastName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  provider?: string;
  createdAt?: string | Date;
  lastLoginAt?: string | Date;
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
}

export type User = DbUser;

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends DbUser {}
  }
}
