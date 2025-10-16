import { Client, AsyncState } from '../../types';

export type PageMode = 'list' | 'create' | 'view' | 'edit';

export interface ClientFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
}

export interface ClientFilters {
  page: number;
  limit: number;
  isActive?: boolean;
  city?: string;
  country?: string;
}

export interface ClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Client[];
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

export interface ClientsPageState {
  mode: PageMode;
  clients: AsyncState<ClientsResponse>;
  selectedClient: AsyncState<Client | null>;
  selectedClientIds: string[];
  bulkLoading: boolean;
  filters: ClientFilters;
  searchQuery: string;
}

