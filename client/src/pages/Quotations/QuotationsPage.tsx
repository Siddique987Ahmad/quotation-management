import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { quotationsAPI, clientsAPI } from '../../services/api';
import { hasPermission } from '../../utils/auth';
import { Quotation, QuotationStatus, Client, Invoice,BulkQuotationActionResponse } from '../../types';
import { CardSpinner } from '../../components/LoadingSpinner';
import { Icons } from '../../components/Icons/Icons';
import {toast} from 'react-toastify';
import { useCurrency } from '../../contexts/CurrencyContext';


// Import sub-components
import QuotationPageHeader from './components/QuotationPageHeader';
import QuotationFiltersBar from './components/QuotationFiltersBar';
import QuotationForm from './components/QuotationForm';
import QuotationDetailsView from './components/QuotationDetailsView';
import QuotationsTable from './components/QuotationsTable';
import { 
  QuotationFormData, 
  PageMode, 
  QuotationsPageState, 
  QuotationFilters 
} from './types';

const QuotationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { format } = useCurrency();

  
  // Better mode detection - check both route and query params
  const getInitialMode = (): PageMode => {
    if (window.location.pathname.endsWith('/create')) return 'create';
    if (window.location.pathname.endsWith('/edit')) return 'edit';
    if (!id) return 'list';
    return 'view';
  };
  
  const [state, setState] = useState<QuotationsPageState>({
    mode: getInitialMode(),
    quotations: { isLoading: true, error: null, data: null },
    selectedQuotation: { isLoading: false, error: null, data: null },
    clients: { isLoading: false, error: null, data: null },
    selectedQuotationIds: [],
    bulkLoading: false,
    filters: {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      status: searchParams.get('status') as QuotationStatus || undefined,
      clientId: searchParams.get('clientId') || undefined
    },
    searchQuery: searchParams.get('search') || ''
  });

  // Check permissions
  const canCreate = hasPermission('quotations', 'create');
  const canRead = hasPermission('quotations', 'read');

  // API Functions - memoized to prevent infinite re-renders
  const loadQuotations = useCallback(async (filters?: QuotationFilters, searchQuery?: string) => {
    try {
      setState(prev => ({
        ...prev,
        quotations: { ...prev.quotations, isLoading: true, error: null }
      }));

      const filtersToUse = filters || state.filters;
      const queryToUse = searchQuery !== undefined ? searchQuery : state.searchQuery;
      
      const params = {
        ...filtersToUse,
        search: queryToUse || undefined
      };
      
      const response = await quotationsAPI.getAll(params);
      
      setState(prev => ({ 
        ...prev, 
        quotations: { 
          isLoading: false, 
          data: response.data,
          error: null
        }
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        quotations: { 
          isLoading: false, 
          data: null, 
          error: error.response?.data?.message || error.message || 'Failed to load quotations'
        }
      }));
    }
  }, []); // Remove state dependencies

  const loadQuotation = useCallback(async (quotationId: string) => {
    try {
      setState(prev => ({
        ...prev,
        selectedQuotation: { isLoading: true, error: null, data: null }
      }));

      const response = await quotationsAPI.getById(quotationId);
      setState(prev => ({ 
        ...prev, 
        selectedQuotation: { 
          isLoading: false, 
          data: response.data?.data?.quotation || null,
          error: null
        }
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        selectedQuotation: { 
          isLoading: false, 
          data: null,
          error: error.response?.data?.message || error.message || 'Failed to load quotation'
        }
      }));
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, clients: { ...prev.clients, isLoading: true } }));
      
      const response = await clientsAPI.getDropdown();
      console.log('Clients API Response:', response.data);
      
      let clientsData: Client[] = [];
      
      // More robust checking for the nested structure
      if (response.data?.success && response.data?.data) {
        // Check if data.data has a clients property and it's an array
        if (response.data.data.clients && Array.isArray(response.data.data.clients)) {
          clientsData = response.data.data.clients;
        }
        // Or if data.data itself is an array
        else if (Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        }
      } 
      // Fallback: check if response.data itself is an array
      else if (Array.isArray(response.data)) {
        clientsData = response.data;
      }
      
      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          data: clientsData,
          error: null
        }
      }));
    } catch (error: any) {
      console.error('Failed to load clients:', error);
      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          data: [],
          error: 'Failed to load clients'
        }
      }));
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (canRead) {
      loadClients();
      if (state.mode === 'list') {
        loadQuotations(state.filters, state.searchQuery);
      }
    }
  }, [canRead, state.mode]);

  // Separate effect for quotation loading
  useEffect(() => {
    if (id && canRead && (state.mode === 'view' || state.mode === 'edit')) {
      console.log('Loading quotation data for ID:', id, 'Mode:', state.mode);
      loadQuotation(id);
    }
  }, [id, canRead, state.mode, loadQuotation]);

  // Update mode when route changes
  useEffect(() => {
    const newMode = getInitialMode();
    if (newMode !== state.mode) {
      console.log('Mode changing from', state.mode, 'to', newMode, 'for path:', window.location.pathname);
      setState(prev => ({ ...prev, mode: newMode }));
    }
  }, [location.pathname, id, searchParams]);

  // Permission check after all hooks
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to view quotations.</p>
      </div>
    );
  }

  // Event Handlers
  const handleSearch = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      filters: { ...prev.filters, page: 1 }
    }));
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      Object.entries({ ...state.filters, page: 1 }).forEach(([key, value]) => {
        if (value) params.set(key, value.toString());
      });
      if (query) params.set('search', query);
      setSearchParams(params);
      loadQuotations({ ...state.filters, page: 1 }, query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (key: keyof QuotationFilters, value: any) => {
    const newFilters = { ...state.filters, [key]: value };
    
    if (key !== 'page') {
      newFilters.page = 1;
    }

    setState(prev => ({ ...prev, filters: newFilters }));
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    if (state.searchQuery) params.set('search', state.searchQuery);
    setSearchParams(params);
    
    loadQuotations(newFilters, state.searchQuery);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...state.filters, page };
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    loadQuotations(newFilters, state.searchQuery);
  };

const handleCreateQuotation = async (formData: QuotationFormData): Promise<void> => {
  try {
    const subtotalAmount: number = parseFloat(formData.subtotal.toString()) || 0;
    
    // Calculate tax amounts based on taxation type
    let gstPercentage = 0;
    let pstPercentage = 0;
    let gstAmount = 0;
    let pstAmount = 0;
    
    if (formData.taxationType === 'gst') {
      gstPercentage = parseFloat(formData.gstPercentage.toString()) || 0;
      gstAmount = Number(((subtotalAmount * gstPercentage) / 100).toFixed(2));
    } else if (formData.taxationType === 'pst') {
      pstPercentage = parseFloat(formData.pstPercentage.toString()) || 0;
      pstAmount = Number(((subtotalAmount * pstPercentage) / 100).toFixed(2));
    } else if (formData.taxationType === 'both') {
      gstPercentage = parseFloat(formData.gstPercentage.toString()) || 0;
      pstPercentage = parseFloat(formData.pstPercentage.toString()) || 0;
      gstAmount = Number(((subtotalAmount * gstPercentage) / 100).toFixed(2));
      pstAmount = Number(((subtotalAmount * pstPercentage) / 100).toFixed(2));
    }
    
    // Calculate totals
    const combinedTaxAmount = Number((gstAmount + pstAmount).toFixed(2));
    const totalAmount = Number((subtotalAmount + combinedTaxAmount).toFixed(2));
    
    // For backward compatibility with existing backend
    const legacyTaxPercentage = subtotalAmount > 0 ? Number(((combinedTaxAmount / subtotalAmount) * 100).toFixed(2)) : 0;

    // Process dynamic fields
    const dynamicFormData: Record<string, any> = formData.dynamicFields.reduce((acc: Record<string, any>, field) => {
      if (field.label && field.value !== undefined) {
        acc[field.label] = field.value;
      }
      return acc;
    }, {});

    const quotationData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      clientId: formData.clientId,
      subtotal: subtotalAmount,
      
      // Send both new and legacy fields for compatibility
      gstPercentage: gstPercentage,
      gstAmount: gstAmount,
      pstPercentage: pstPercentage,
      pstAmount: pstAmount,
      combinedTaxAmount: combinedTaxAmount,
      
      // Legacy fields for backward compatibility
      taxPercentage: legacyTaxPercentage,
      taxAmount: combinedTaxAmount,
      
      totalAmount: totalAmount,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes?.trim() || '',
      formData: dynamicFormData
    };

    console.log('Sending quotation data with enhanced taxation:', quotationData);

    const response = await quotationsAPI.create(quotationData);
    
    const quotationId = response.data?.data?.quotation?.id;
    
    if (quotationId) {
      navigate(`/quotations/${quotationId}`);
      console.log('Quotation created successfully with GST/PST support');
    } else {
      console.error('No quotation ID in response:', response.data);
    }
    
  } catch (error: any) {
    console.error('Failed to create quotation:', error);
    
    if (error?.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      console.error('Validation errors:', validationErrors);
    }
  }
};

const handleUpdateQuotation = async (formData: QuotationFormData) => {
  if (!state.selectedQuotation.data) return;

  try {
    // Process dynamic fields
    const dynamicFormData = formData.dynamicFields.reduce((acc, field) => {
      acc[field.label] = field.value;
      return acc;
    }, {} as Record<string, any>);

    // Calculate tax amounts (same logic as create)
    const subtotalAmount = parseFloat(formData.subtotal.toString()) || 0;
    
    let gstPercentage = 0;
    let pstPercentage = 0;
    let gstAmount = 0;
    let pstAmount = 0;
    
    if (formData.taxationType === 'gst') {
      gstPercentage = parseFloat(formData.gstPercentage.toString()) || 0;
      gstAmount = Number(((subtotalAmount * gstPercentage) / 100).toFixed(2));
    } else if (formData.taxationType === 'pst') {
      pstPercentage = parseFloat(formData.pstPercentage.toString()) || 0;
      pstAmount = Number(((subtotalAmount * pstPercentage) / 100).toFixed(2));
    } else if (formData.taxationType === 'both') {
      gstPercentage = parseFloat(formData.gstPercentage.toString()) || 0;
      pstPercentage = parseFloat(formData.pstPercentage.toString()) || 0;
      gstAmount = Number(((subtotalAmount * gstPercentage) / 100).toFixed(2));
      pstAmount = Number(((subtotalAmount * pstPercentage) / 100).toFixed(2));
    }
    
    const combinedTaxAmount = Number((gstAmount + pstAmount).toFixed(2));
    const totalAmount = Number((subtotalAmount + combinedTaxAmount).toFixed(2));
    const legacyTaxPercentage = subtotalAmount > 0 ? Number(((combinedTaxAmount / subtotalAmount) * 100).toFixed(2)) : 0;

    const quotationData = {
      title: formData.title,
      description: formData.description,
      subtotal: subtotalAmount,
      
      // New taxation fields
      gstPercentage: gstPercentage,
      gstAmount: gstAmount,
      pstPercentage: pstPercentage,
      pstAmount: pstAmount,
      combinedTaxAmount: combinedTaxAmount,
      
      // Legacy compatibility
      taxPercentage: legacyTaxPercentage,
      taxAmount: combinedTaxAmount,
      
      totalAmount: totalAmount,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes,
      formData: dynamicFormData
    };

    await quotationsAPI.update(state.selectedQuotation.data.id, quotationData);
    
    await loadQuotation(state.selectedQuotation.data.id);
    setState(prev => ({ ...prev, mode: 'view' }));
    navigate(`/quotations/${state.selectedQuotation.data.id}`);
    
    console.log('Quotation updated successfully with enhanced taxation');
  } catch (error) {
    console.error('Failed to update quotation:', error);
  }
};

const handleStatusUpdate = async (quotation: Quotation, status: QuotationStatus) => {
  try {
    console.log('🎯 FRONTEND: Starting status update');
    console.log('Quotation ID:', quotation.id);
    console.log('Current status:', quotation.status);
    console.log('New status:', status);
    console.log('Client email:', quotation.client?.email);
    const response = await quotationsAPI.updateStatus(quotation.id, status);

    if (state.mode === 'view' && state.selectedQuotation.data) {
      await loadQuotation(quotation.id);
    } else {
      await loadQuotations(state.filters, state.searchQuery);
    }
    console.log('🎯 FRONTEND: Response received');
    console.log('Full response:', response);
    console.log('Response data:', response.data);

    toast.success(`Quotation ${status.toLowerCase()} successfully`);
    console.log(response.data); // you’ll see invoice + email info from backend
  } catch (error: any) {
    console.error('Failed to update quotation status:', error);
    toast.error(error.response?.data?.message || 'Failed to update quotation status');
  }
};

  const handleDelete = async (quotation: Quotation) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      await quotationsAPI.delete(quotation.id);
      
      if (state.mode === 'view') {
        navigate('/quotations');
      } else {
        await loadQuotations(state.filters, state.searchQuery);
      }
      
      console.log('Quotation deleted successfully');
    } catch (error) {
      console.error('Failed to delete quotation:', error);
    }
  };

  const handleDuplicate = async (quotation: Quotation) => {
    try {
      const response = await quotationsAPI.duplicate(quotation.id);
      const quotationId = response.data?.data?.quotation?.id;
      
      if (quotationId) {
        navigate(`/quotations/${quotationId}`);
        console.log('Quotation duplicated successfully');
      }
    } catch (error) {
      console.error('Failed to duplicate quotation:', error);
    }
  };

  const handleDownloadPDF = async (quotation: Quotation, includeTax: boolean = true) => {
    try {
      const response = await quotationsAPI.downloadPDF(quotation.id, includeTax);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const taxSuffix = includeTax ? '-with-tax' : '-without-tax';
      link.download = `quotation-${quotation.quotationNumber}${taxSuffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadBothPDFs = async (quotation: Quotation) => {
    try {
      const results = await quotationsAPI.downloadBothPDFs(quotation.id);
      
      // Download first PDF
      const blobWithTax = new Blob([results.withTax.data], { type: 'application/pdf' });
      const urlWithTax = window.URL.createObjectURL(blobWithTax);
      const linkWithTax = document.createElement('a');
      linkWithTax.href = urlWithTax;
      linkWithTax.download = `quotation-${quotation.quotationNumber}-with-tax.pdf`;
      document.body.appendChild(linkWithTax);
      linkWithTax.click();
      document.body.removeChild(linkWithTax);
      window.URL.revokeObjectURL(urlWithTax);
      
      // Download second PDF after delay
      setTimeout(() => {
        const blobWithoutTax = new Blob([results.withoutTax.data], { type: 'application/pdf' });
        const urlWithoutTax = window.URL.createObjectURL(blobWithoutTax);
        const linkWithoutTax = document.createElement('a');
        linkWithoutTax.href = urlWithoutTax;
        linkWithoutTax.download = `quotation-${quotation.quotationNumber}-without-tax.pdf`;
        document.body.appendChild(linkWithoutTax);
        linkWithoutTax.click();
        document.body.removeChild(linkWithoutTax);
        window.URL.revokeObjectURL(urlWithoutTax);
      }, 500);
      
    } catch (error) {
      console.error('Failed to download PDFs:', error);
      alert('Failed to download PDFs. Please try again.');
    }
  };
const handleSendEmail = async (quotation: Quotation) => {
  if (!quotation.client?.email) {
    alert('Client email not found. Please update client information.');
    return;
  }

  if (!window.confirm(`Send quotation ${quotation.quotationNumber} to ${quotation.client.email}?`)) {
    return;
  }

  try {
    console.log('🔄 Sending email for quotation:', quotation.id);
    
    const response = await quotationsAPI.sendEmail(quotation.id);
    
    console.log('✅ Email sent successfully:', response.data);
    
    // Show success with template source info
    const templateSource = response.data.data?.templateSource;
    const sourceInfo = templateSource === 'database' ? ' (using custom template)' : ' (using default template)';
    const messageId = response.data.data?.messageId ? ` (ID: ${response.data.data.messageId.substring(0, 8)}...)` : '';
    
    alert(`Quotation sent successfully to ${quotation.client.email}${sourceInfo}${messageId}`);
    
    // Reload quotation to update email status
    if (state.mode === 'view') {
      await loadQuotation(quotation.id);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    
    let errorMessage = 'Failed to send quotation email';
    
    if (error.response?.status === 404) {
      errorMessage = 'Quotation not found';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied - insufficient permissions';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Invalid request - check client email';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert(errorMessage + '. Please try again.');
  }
};

const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
  if (state.selectedQuotationIds.length === 0) return;
  
  if (!window.confirm(`Are you sure you want to ${action} ${state.selectedQuotationIds.length} quotations?`)) {
    return;
  }

  setState(prev => ({ ...prev, bulkLoading: true }));
  
  try {
    const response = await quotationsAPI.bulkAction({
      quotationIds: state.selectedQuotationIds,
      action
    });
    
    console.log('Bulk action response:', response.data);
    
    let successMessage = response.data.message;
    
    // Enhanced success message for approval with email summary
    if (action === 'approve' && response.data.data?.emailSummary) {
      const emailSummary = response.data.data.emailSummary;
      const emailDetails = emailSummary.emailsSent > 0 
        ? `${emailSummary.emailsSent} approval emails sent successfully.` 
        : 'No emails were sent.';
      
      if (emailSummary.emailsFailed > 0) {
        successMessage += ` Note: ${emailSummary.emailsFailed} emails failed to send.`;
      }
      
      console.log('📧 Email Summary:', emailSummary);
    }
    
    // Show detailed success message
    alert(successMessage);
    
    setState(prev => ({ ...prev, selectedQuotationIds: [] }));
    await loadQuotations(state.filters, state.searchQuery);
    
  } catch (error: any) {
    console.error(`Failed to perform bulk ${action}:`, error);
    
    let errorMessage = `Failed to perform bulk ${action}`;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert(errorMessage + '. Please try again.');
    
  } finally {
    setState(prev => ({ ...prev, bulkLoading: false }));
  }
};

  const handleModeChange = (mode: PageMode, quotationId?: string) => {
    setState(prev => ({ ...prev, mode }));
    
    if (mode === 'list') {
      navigate('/quotations');
    } else if (mode === 'create') {
      navigate('/quotations/create');
    } else if (mode === 'view' && quotationId) {
      navigate(`/quotations/${quotationId}`);
    } else if (mode === 'edit' && quotationId) {
      navigate(`/quotations/${quotationId}/edit`);
    }
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, mode: 'list' }));
    navigate('/quotations');
  };

  const handleCreateNew = () => {
    console.log('Navigating to create mode');
    navigate('/quotations/create');
  };

  const handleViewQuotation = (quotation: Quotation) => {
    console.log('Navigating to view mode for quotation:', quotation.id);
    navigate(`/quotations/${quotation.id}`);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    console.log('Navigating to edit mode for quotation:', quotation.id);
    navigate(`/quotations/${quotation.id}/edit`);
  };

  // Debug logging
  console.log('Current mode:', state.mode, 'Path:', window.location.pathname, 'ID:', id);

  // Render loading state
  if (state.quotations.isLoading && state.mode === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <CardSpinner text="Loading quotations..." />
        </div>
      </div>
    );
  }

  // Render error state
  if (state.quotations.error && state.mode === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-red-600 mb-4">
            <Icons.XCircle />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Quotations</h3>
          <p className="text-gray-500 mb-4">{state.quotations.error}</p>
          <button
            onClick={() => loadQuotations(state.filters, state.searchQuery)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const quotations: Quotation[] = state.quotations.data?.data?.quotations || [];
  const pagination = state.quotations.data?.data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <QuotationPageHeader
        mode={state.mode}
        canCreate={canCreate}
        canUpdate={hasPermission('quotations', 'update')}
        onBack={handleBack}
        onCreateNew={handleCreateNew}
        onEditQuotation={() => handleModeChange('edit', id)}
        quotationId={id}
      />

      {/* Create/Edit Form */}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <QuotationForm
          quotation={state.mode === 'edit' ? (state.selectedQuotation.data ?? null) : null}
          clients={state.clients.data || []}
          onSubmit={state.mode === 'create' ? handleCreateQuotation : handleUpdateQuotation}
          onCancel={handleBack}
          loading={state.selectedQuotation.isLoading}
          isEdit={state.mode === 'edit'}
        />
      )}

      {/* Quotation Details View */}
      {state.mode === 'view' && (
        <QuotationDetailsView
          quotation={state.selectedQuotation.data ?? null}
          loading={state.selectedQuotation.isLoading}
          error={state.selectedQuotation.error ?? null}
          onEdit={() => handleModeChange('edit', state.selectedQuotation.data?.id)}
          onDelete={() => handleDelete(state.selectedQuotation.data!)}
          onDuplicate={() => handleDuplicate(state.selectedQuotation.data!)}
          onStatusUpdate={(status) => handleStatusUpdate(state.selectedQuotation.data!, status)}
          onDownloadPDF={(includeTax) => handleDownloadPDF(state.selectedQuotation.data!, includeTax)}
          onDownloadBothPDFs={() => handleDownloadBothPDFs(state.selectedQuotation.data!)}
          onSendEmail={() => handleSendEmail(state.selectedQuotation.data!)}
          actionLoading={false}
        />
      )}

      {/* Quotations List */}
      {state.mode === 'list' && (
        <>
          <QuotationFiltersBar
            searchQuery={state.searchQuery}
            filters={state.filters}
            clients={state.clients.data || []}
            selectedQuotationIds={state.selectedQuotationIds}
            bulkLoading={state.bulkLoading}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onBulkAction={handleBulkAction}
          />

          <QuotationsTable
            quotations={quotations}
            loading={state.quotations.isLoading}
            selectedIds={state.selectedQuotationIds}
            onSelectionChange={(ids) => setState(prev => ({ ...prev, selectedQuotationIds: ids }))}
            onView={handleViewQuotation}
            onEdit={handleEditQuotation}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusUpdate={handleStatusUpdate}
            onDownloadPDF={handleDownloadPDF}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default QuotationsPage;