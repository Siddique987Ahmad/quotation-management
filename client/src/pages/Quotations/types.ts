import { Quotation, QuotationStatus, Client, AsyncState } from '../../types';

export type PageMode = 'list' | 'create' | 'view' | 'edit';

export interface QuotationsResponse {
  success: boolean;
  message: string;
  data: {
    quotations: Quotation[];
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

export interface QuotationFilters {
  page: number;
  limit: number;
  status?: QuotationStatus;
  clientId?: string;
}

export interface QuotationsPageState {
  mode: PageMode;
  quotations: AsyncState<QuotationsResponse>;
  selectedQuotation: AsyncState<Quotation | null>;
  clients: AsyncState<Client[]>;
  selectedQuotationIds: string[];
  bulkLoading: boolean;
  filters: QuotationFilters;
  searchQuery: string;
}

// Dynamic form field types
export interface DynamicField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'email' | 'phone';
  label: string;
  value: any;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select fields
}

// Updated QuotationFormData interface with taxation support
export interface QuotationFormData {
  title: string;
  description: string;
  clientId: string;
  subtotal: number;
  
  // NEW: Taxation type selector
  taxationType: 'gst' | 'pst' | 'both' | 'none';
  
  // NEW: Individual tax percentages
  gstPercentage: number;
  pstPercentage: number;
  
  // LEGACY: Keep for backward compatibility
  taxPercentage: number;
  
  validUntil: string;
  notes: string;
  dynamicFields: DynamicField[];
}