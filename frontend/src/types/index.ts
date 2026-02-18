export type UserRole = 'admin' | 'professional' | 'user';

export interface ProfessionalProfile {
  full_name: string;
  bio?: string;
  cref?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  role_display: string;
  professional_profile: ProfessionalProfile | null;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail: string | null;
  category: Category | null;
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
