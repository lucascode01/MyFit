export type UserRole = 'admin' | 'professional' | 'user';

export interface ProfessionalProfile {
  full_name: string;
  bio?: string;
  cref?: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | '';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  role_display: string;
  professional_profile: ProfessionalProfile | null;
  subscription_status: SubscriptionStatus;
  has_active_subscription: boolean;
  date_joined: string;
}

export interface LinkedStudent {
  id: number;
  student_id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number | null;
  parent_name: string | null;
  display_name: string;
  created_at: string;
  children?: Category[];
}

export interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail: string | null;
  categories: Category[];
  professional_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
