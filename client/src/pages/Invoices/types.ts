import { Invoice, InvoiceStatus, InvoiceType, Client, TaxPreset, AsyncState } from '../../types';

// Re-export for components
export { InvoiceStatus, InvoiceType } from '../../types';

export type PageMode = 'list' | 'view' | 'edit';

export interface InvoicesResponse {
  success: boolean;
  message: string;
  data: {
    invoices: Invoice[];
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

export interface InvoiceResponse {
  success: boolean;
  message: string;
  data: {
    invoice: Invoice;
  };
}

export interface InvoiceFilters {
  page: number;
  limit: number;
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
}

export interface InvoicesPageState {
  mode: PageMode;
  invoices: AsyncState<InvoicesResponse>;
  selectedInvoice: AsyncState<Invoice | null>;
  clients: AsyncState<Client[]>;
  taxPresets: AsyncState<TaxPreset[]>;
  selectedInvoiceIds: string[];
  bulkLoading: boolean;
  filters: InvoiceFilters;
  searchQuery: string;
}

export interface InvoiceFormData {
  status: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  gstPercentage: number;
  pstPercentage: number;
}

// Tax Types for PDF generation
export const INVOICE_TAX_TYPES = {
  NO_TAX: 'NO_TAX',
  GST_ONLY: 'GST_ONLY',
  PST_ONLY: 'PST_ONLY',
  GST_AND_PST: 'GST_AND_PST'
} as const;