import { Role, AsyncState, UserFilters, User } from '../../types';

export type PageMode = 'list' | 'create' | 'view' | 'edit';

export interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface UsersPageState {
  mode: PageMode;
  users: AsyncState<UsersResponse>;
  selectedUser: AsyncState<User | null>;
  availableRoles: { value: Role; label: string; level: number }[];
  selectedUserIds: string[];
  bulkLoading: boolean;
  filters: UserFilters;
  searchQuery: string;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}