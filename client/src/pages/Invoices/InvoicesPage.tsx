import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { invoicesAPI, clientsAPI } from '../../services/api';
import { hasPermission } from '../../utils/auth';
import { Invoice, InvoiceStatus, Client, TaxPreset } from '../../types';
import LoadingSpinner, { CardSpinner } from '../../components/LoadingSpinner';

// Import sub-components
import InvoicePageHeader from './components/InvoicePageHeader';
import InvoiceDetailsView from './components/InvoiceDetailsView';
import InvoiceEditForm from './components/InvoiceEditForm';
import InvoiceFiltersBar from './components/InvoiceFiltersBar';
import InvoicesTable from './components/InvoicesTable';
import { 
  PageMode, 
  InvoicesPageState, 
  InvoiceFormData, 
  INVOICE_TAX_TYPES 
} from './types';

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialMode = (): PageMode => {
    if (!id) return 'list';
    if (searchParams.get('edit') === 'true') return 'edit';
    if (window.location.pathname.endsWith('/edit')) return 'edit';
    return 'view';
  };
  
  const [state, setState] = useState<InvoicesPageState>({
    mode: getInitialMode(),
    invoices: { isLoading: false, data: null },
    selectedInvoice: { isLoading: false, data: null },
    clients: { isLoading: false, data: null },
    taxPresets: { isLoading: false, data: null },
    selectedInvoiceIds: [],
    bulkLoading: false,
    filters: {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      clientId: searchParams.get('clientId') || undefined
    },
    searchQuery: searchParams.get('search') || ''
  });

  // Check permissions
  const canRead = hasPermission('invoices', 'read');

  // Load functions
  const loadInvoices = useCallback(async () => {
    if (!canRead) return;
    
    setState(prev => ({ ...prev, invoices: { ...prev.invoices, isLoading: true } }));
    
    try {
      const params = {
        ...state.filters,
        search: state.searchQuery || undefined
      };
      const response = await invoicesAPI.getAll(params);
      
      setState(prev => ({ 
        ...prev, 
        invoices: { 
          isLoading: false, 
          data: response.data,
          error: undefined 
        }
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        invoices: { 
          isLoading: false, 
          data: null, 
          error: error.response?.data?.message || 'Failed to load invoices' 
        }
      }));
    }
  }, [state.filters, state.searchQuery, canRead]);

  const loadInvoice = useCallback(async (invoiceId: string) => {
    if (!canRead) return;
    
    setState(prev => ({ ...prev, selectedInvoice: { ...prev.selectedInvoice, isLoading: true } }));
    
    try {
      const response = await invoicesAPI.getById(invoiceId);
      setState(prev => ({ 
        ...prev, 
        selectedInvoice: { 
          isLoading: false, 
          data: response.data?.data?.invoice || null,
          error: undefined
        }
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        selectedInvoice: { 
          isLoading: false, 
          data: null,
          error: error.response?.data?.message || 'Failed to load invoice' 
        }
      }));
    }
  }, [canRead]);

  const loadClients = useCallback(async () => {
    if (!canRead) return;
    
    setState(prev => ({ ...prev, clients: { ...prev.clients, isLoading: true } }));
    
    try {
      const response = await clientsAPI.getDropdown();
      let clientsData: Client[] = [];
      
      if (response.data?.success && response.data?.data) {
        if (response.data.data.clients && Array.isArray(response.data.data.clients)) {
          clientsData = response.data.data.clients;
        } else if (Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        clientsData = response.data;
      }
      
      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          data: clientsData,
          error: undefined
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          data: [],
          error: 'Failed to load clients'
        }
      }));
    }
  }, [canRead]);

  const loadTaxPresets = useCallback(async () => {
    if (!canRead) return;
    
    setState(prev => ({ ...prev, taxPresets: { ...prev.taxPresets, isLoading: true } }));
    
    try {
      const response = await invoicesAPI.getTaxPresets();
      const presetsData = response.data?.data?.presets || [];
      
      setState(prev => ({
        ...prev,
        taxPresets: {
          isLoading: false,
          data: presetsData,
          error: undefined
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        taxPresets: {
          isLoading: false,
          data: [],
          error: 'Failed to load tax presets'
        }
      }));
    }
  }, [canRead]);

  // Effects
  useEffect(() => {
    if (canRead) {
      loadClients();
      loadTaxPresets();
      if (state.mode === 'list') {
        loadInvoices();
      }
    }
  }, [canRead, state.mode, loadClients, loadTaxPresets, loadInvoices]);

  useEffect(() => {
    if (id && canRead && (state.mode === 'view' || state.mode === 'edit')) {
      loadInvoice(id);
    }
  }, [id, canRead, state.mode, loadInvoice]);

  useEffect(() => {
    const newMode = getInitialMode();
    if (newMode !== state.mode) {
      setState(prev => ({ ...prev, mode: newMode }));
    }
  }, [id, searchParams, state.mode]);

  // Permission check
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to view invoices.</p>
      </div>
    );
  }

  // Event Handlers
  const handleBack = () => {
    navigate('/invoices');
    setState(prev => ({ ...prev, mode: 'list' }));
  };

  const handleEditInvoice = () => {
    if (id) {
      navigate(`/invoices/${id}?edit=true`);
      setState(prev => ({ ...prev, mode: 'edit' }));
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
    setState(prev => ({ ...prev, mode: 'view' }));
  };

  const handleEditInvoiceFromList = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}?edit=true`);
    setState(prev => ({ ...prev, mode: 'edit' }));
  };

  const handleUpdateInvoice = async (formData: InvoiceFormData) => {
    if (!state.selectedInvoice.data) return;

    try {
      setState(prev => ({
        ...prev,
        selectedInvoice: { ...prev.selectedInvoice, isLoading: true }
      }));

      await invoicesAPI.update(state.selectedInvoice.data.id, formData);
      
      await loadInvoice(state.selectedInvoice.data.id);
      setState(prev => ({ ...prev, mode: 'view' }));
      navigate(`/invoices/${state.selectedInvoice.data.id}`);
      
      console.log('Invoice updated successfully');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        selectedInvoice: {
          ...prev.selectedInvoice,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to update invoice'
        }
      }));
      alert(`Failed to update invoice: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteInvoice = async (invoice?: Invoice) => {
    const targetInvoice = invoice || state.selectedInvoice.data;
    if (!targetInvoice) return;

    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await invoicesAPI.delete(targetInvoice.id);
      
      if (state.mode === 'view') {
        navigate('/invoices');
      } else {
        loadInvoices();
      }
      
      console.log('Invoice deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      alert(`Failed to delete invoice: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleStatusUpdate = async (invoice: Invoice, status: InvoiceStatus) => {
    try {
      await invoicesAPI.update(invoice.id, { status });
      
      if (state.mode === 'view' && state.selectedInvoice.data) {
        await loadInvoice(invoice.id);
      } else {
        await loadInvoices();
      }
      
      console.log(`Invoice ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      console.error('Failed to update invoice status:', error);
      alert(`Failed to update invoice: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDownloadPDF = async (
    invoice: Invoice, 
    taxType: string, 
    customGstRate?: number, 
    customPstRate?: number
  ) => {
    try {
      const params: any = { taxType };
      
      if (customGstRate !== undefined) {
        params.customGstRate = customGstRate;
      }
      if (customPstRate !== undefined) {
        params.customPstRate = customPstRate;
      }

      const response = await invoicesAPI.downloadPDF(invoice.id, params);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename based on tax type
      let taxSuffix = '';
      switch (taxType) {
        case INVOICE_TAX_TYPES.NO_TAX:
          taxSuffix = '-no-tax';
          break;
        case INVOICE_TAX_TYPES.GST_ONLY:
          taxSuffix = `-gst-only-${customGstRate || invoice.gstPercentage}%`;
          break;
        case INVOICE_TAX_TYPES.PST_ONLY:
          taxSuffix = `-pst-only-${customPstRate || invoice.pstPercentage}%`;
          break;
        case INVOICE_TAX_TYPES.GST_AND_PST:
          taxSuffix = `-both-taxes-${customGstRate || invoice.gstPercentage}%-${customPstRate || invoice.pstPercentage}%`;
          break;
        default:
          taxSuffix = '-custom';
      }
      
      link.download = `invoice-${invoice.invoiceNumber}${taxSuffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // const handleSendEmailWithTax = async (
  //   taxType: string,
  //   customGstRate?: number,
  //   customPstRate?: number
  // ) => {
  //   const currentInvoice = state.selectedInvoice.data;
    
  //   if (!currentInvoice) {
  //     alert('Invoice not found');
  //     return;
  //   }

  //   if (!currentInvoice.client?.email) {
  //     alert('Client email not found. Please update client information.');
  //     return;
  //   }

  //   const taxTypeLabel = taxType.replace(/_/g, ' ');
  //   if (!window.confirm(`Send invoice ${currentInvoice.invoiceNumber} with ${taxTypeLabel} configuration to ${currentInvoice.client.email}?`)) {
  //     return;
  //   }

  //   try {
  //     await invoicesAPI.sendEmailWithTax(currentInvoice.id, {
  //       taxType,
  //       customGstRate,
  //       customPstRate
  //     });

  //     alert(`Invoice sent successfully with ${taxTypeLabel} calculation to ${currentInvoice.client.email}`);

  //     if (state.mode === 'view') {
  //       await loadInvoice(currentInvoice.id);
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to send email:', error);
  //     alert('Failed to send invoice email. Please try again.');
  //   }
  // };


  const handleSendEmailWithTax = async (
  taxType: string,
  customGstRate?: number,
  customPstRate?: number
) => {
  const currentInvoice = state.selectedInvoice.data;
  if (!currentInvoice) {
    alert('Invoice not found');
    return;
  }

  if (!currentInvoice.client?.email) {
    alert('Client email not found. Please update client information.');
    return;
  }

  const taxTypeLabel = taxType.replace(/_/g, ' ');
  const rateInfo = customGstRate || customPstRate 
    ? ` (Custom rates: GST ${customGstRate || 'default'}%, PST ${customPstRate || 'default'}%)`
    : '';
  
  if (!window.confirm(`Send invoice ${currentInvoice.invoiceNumber} with ${taxTypeLabel} configuration${rateInfo} to ${currentInvoice.client.email}?`)) {
    return;
  }

  try {
    console.log(`🔄 Sending tax-specific invoice email (${taxType})...`);
    
    const response = await invoicesAPI.sendEmailWithTax(currentInvoice.id, {
      taxType,
      customGstRate,
      customPstRate
    });

    console.log('✅ Tax-specific invoice email sent:', response.data);
    
    // Enhanced success message with tax and template details
    const emailDetails = response.data.data?.emailDetails;
    const templateInfo = emailDetails?.templateSource === 'database' ? ' (custom template)' : ' (default template)';
    const taxDetails = response.data.data?.taxDetails;
    const amountInfo = taxDetails ? ` - Total: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(taxDetails.totalAmount)}` : '';
    
    alert(`Invoice sent successfully with ${taxTypeLabel} calculation${amountInfo} to ${currentInvoice.client.email}${templateInfo}`);
    
    // Reload invoice to show updated status
    if (state.mode === 'view') {
      await loadInvoice(currentInvoice.id);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to send tax-specific invoice email:', error);
    
    let errorMessage = 'Failed to send invoice email';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid tax configuration or request';
    } else if (error.response?.status === 404) {
      errorMessage = 'Invoice not found';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied - insufficient permissions';
    }
    
    alert(errorMessage + '. Please try again.');
  }
};

  const handleSendEmailWithTaxForList = async (
    invoice: Invoice,
    taxType: string,
    customGstRate?: number,
    customPstRate?: number
  ) => {
    if (!invoice.client?.email) {
      alert('Client email not found. Please update client information.');
      return;
    }

    const taxTypeLabel = taxType.replace(/_/g, ' ');
    if (!window.confirm(`Send invoice ${invoice.invoiceNumber} with ${taxTypeLabel} configuration to ${invoice.client.email}?`)) {
      return;
    }

    try {
      await invoicesAPI.sendEmailWithTax(invoice.id, {
        taxType,
        customGstRate,
        customPstRate
      });

      alert(`Invoice sent successfully with ${taxTypeLabel} calculation to ${invoice.client.email}`);
      loadInvoices();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert('Failed to send invoice email. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    const invoice = state.selectedInvoice.data;
    if (!invoice) return;

    if (!invoice.client?.email) {
      alert('Client email not found. Please update client information.');
      return;
    }

    if (!window.confirm(`Send invoice ${invoice.invoiceNumber} to ${invoice.client.email}?`)) {
      return;
    }

    try {
      await invoicesAPI.sendEmail(invoice.id);
      
      alert(`Invoice sent successfully to ${invoice.client.email}`);
      
      if (state.mode === 'view') {
        await loadInvoice(invoice.id);
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert('Failed to send invoice email. Please try again.');
    }
  };

  const handleSearch = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      filters: { ...prev.filters, page: 1 }
    }));
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (query) {
      newSearchParams.set('search', query);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
    
    loadInvoices();
  };

  const handleFilterChange = (key: any, value: any) => {
    const newFilters = { ...state.filters, [key]: value, page: 1 };
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value.toString());
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
    
    loadInvoices();
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...state.filters, page };
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    loadInvoices();
  };

  const handleSelectionChange = (ids: string[]) => {
    setState(prev => ({ ...prev, selectedInvoiceIds: ids }));
  };

  const handleBulkAction = async (action: 'send' | 'mark_paid' | 'cancel' | 'delete') => {
    if (state.selectedInvoiceIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to ${action.replace('_', ' ')} ${state.selectedInvoiceIds.length} invoices?`)) {
      return;
    }

    setState(prev => ({ ...prev, bulkLoading: true }));

    try {
      await invoicesAPI.bulkAction({
        invoiceIds: state.selectedInvoiceIds,
        action
      });
      
      setState(prev => ({ ...prev, selectedInvoiceIds: [] }));
      await loadInvoices();
      
      console.log(`Bulk ${action} completed successfully`);
    } catch (error: any) {
      console.error(`Failed to perform bulk ${action}:`, error);
      alert(`Failed to perform bulk ${action}: ${error.response?.data?.message || error.message}`);
    } finally {
      setState(prev => ({ ...prev, bulkLoading: false }));
    }
  };

  const handleBulkTaxUpdate = async (gstPercentage: number, pstPercentage: number) => {
    if (state.selectedInvoiceIds.length === 0) return;

    if (!window.confirm(`Update tax rates to GST: ${gstPercentage}% and PST: ${pstPercentage}% for ${state.selectedInvoiceIds.length} invoices?`)) {
      return;
    }

    setState(prev => ({ ...prev, bulkLoading: true }));

    try {
      await invoicesAPI.bulkUpdateTaxRates({
        invoiceIds: state.selectedInvoiceIds,
        gstPercentage,
        pstPercentage
      });
      
      setState(prev => ({ ...prev, selectedInvoiceIds: [] }));
      await loadInvoices();
      
      console.log('Bulk tax rate update completed successfully');
    } catch (error: any) {
      console.error('Failed to perform bulk tax rate update:', error);
      alert(`Failed to update tax rates: ${error.response?.data?.message || error.message}`);
    } finally {
      setState(prev => ({ ...prev, bulkLoading: false }));
    }
  };

  // Render loading state for initial page load
  if (state.invoices.isLoading && state.mode === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <CardSpinner text="Loading invoices..." />
        </div>
      </div>
    );
  }

  // Render error state
  if (state.invoices.error && state.mode === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Invoices</h3>
          <p className="text-gray-500 mb-4">{state.invoices.error}</p>
          <button
            onClick={loadInvoices}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const invoices: Invoice[] = state.invoices.data?.data?.invoices || [];
  const pagination = state.invoices.data?.data?.pagination;
  const clients = state.clients.data || [];
  const taxPresets = state.taxPresets.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <InvoicePageHeader
        mode={state.mode}
        onBack={handleBack}
        invoiceNumber={state.selectedInvoice.data?.invoiceNumber}
        canEdit={hasPermission('invoices', 'update')}
        onEditInvoice={handleEditInvoice}
      />

      {/* Edit Form */}
      {state.mode === 'edit' && (
        <InvoiceEditForm
          invoice={state.selectedInvoice.data!}
          taxPresets={taxPresets}
          onSubmit={handleUpdateInvoice}
          onCancel={handleBack}
          loading={state.selectedInvoice.isLoading}
        />
      )}

      {/* Invoice Details View */}
      {state.mode === 'view' && (
        <InvoiceDetailsView
          invoice={state.selectedInvoice.data}
          loading={state.selectedInvoice.isLoading}
          error={state.selectedInvoice.error}
          taxPresets={taxPresets}
          onEdit={handleEditInvoice}
          onDelete={() => handleDeleteInvoice()}
          onStatusUpdate={(status) => handleStatusUpdate(state.selectedInvoice.data!, status)}
          onDownloadPDF={(taxType, customGstRate, customPstRate) => 
            handleDownloadPDF(state.selectedInvoice.data!, taxType, customGstRate, customPstRate)}
          onSendEmailWithTax={handleSendEmailWithTax}
          onSendEmail={handleSendEmail}
        />
      )}

      {/* Invoices List */}
      {state.mode === 'list' && (
        <>
          <InvoiceFiltersBar
            searchQuery={state.searchQuery}
            filters={state.filters}
            clients={clients}
            selectedInvoiceIds={state.selectedInvoiceIds}
            bulkLoading={state.bulkLoading}
            taxPresets={taxPresets}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onBulkAction={handleBulkAction}
            onBulkTaxUpdate={handleBulkTaxUpdate}
          />

          <InvoicesTable
            invoices={invoices}
            pagination={pagination}
            selectedIds={state.selectedInvoiceIds}
            loading={state.invoices.isLoading}
            taxPresets={taxPresets}
            onEdit={handleEditInvoiceFromList}
            onView={(invoice) => handleViewInvoice(invoice.id)}
            onDelete={handleDeleteInvoice}
            onStatusUpdate={handleStatusUpdate}
            onDownloadPDF={handleDownloadPDF}
            onSendEmailWithTax={handleSendEmailWithTaxForList}
            onSelectionChange={handleSelectionChange}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default InvoicesPage;