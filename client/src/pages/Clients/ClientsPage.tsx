import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams,useLocation } from 'react-router-dom';
import { clientsAPI } from '../../services/api';
import { 
  hasPermission, 
  getUser, 
  getUserDisplayName 
} from '../../utils/auth';
import { 
  Client, 
  AsyncState 
} from '../../types';
import LoadingSpinner, { 
  TableLoader, 
  ButtonSpinner,
  CardSpinner 
} from '../../components/LoadingSpinner';
import { Icons } from '../../components/Icons/Icons';

// Import sub-components
import ClientPageHeader from './components/ClientPageHeader';
import ClientForm from './components/ClientForm';
import ClientDetailsView from './components/ClientDetailsView';
import ClientFiltersBar from './components/ClientFiltersBar';
import ClientsTable from './components/ClientsTable';
import { ClientFormData, PageMode, ClientsPageState, ClientFilters, } from './types';

const ClientsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // FIX 1: Better mode detection - check for /create FIRST
  const getInitialMode = (): PageMode => {
    if (location.pathname.endsWith('/create')) return 'create';
    if (!id) return 'list';
    if (searchParams.get('edit') === 'true') return 'edit';
    if (location.pathname.endsWith('/edit')) return 'edit';
    return 'view';
  };
  
  const [state, setState] = useState<ClientsPageState>({
    mode: getInitialMode(),
    clients: { isLoading: true, error: null, data: null },
    selectedClient: { isLoading: false, error: null, data: null },
    selectedClientIds: [],
    bulkLoading: false,
    filters: {
      page: 1,
      limit: 10,
      isActive: searchParams.get('status') === 'inactive' ? false : undefined,
      city: searchParams.get('city') || undefined,
      country: searchParams.get('country') || undefined
    },
    searchQuery: searchParams.get('search') || ''
  });

  // Check permissions
  const canCreate = hasPermission('clients', 'create');
  const canRead = hasPermission('clients', 'read');

  // FIX 2: Remove state dependencies to prevent infinite loops
  const loadClients = useCallback(async (filters?: ClientFilters, searchQuery?: string) => {
    try {
      setState(prev => ({
        ...prev,
        clients: { ...prev.clients, isLoading: true, error: null }
      }));

      const filtersToUse = filters || state.filters;
      const queryToUse = searchQuery !== undefined ? searchQuery : state.searchQuery;
      
      const response = await clientsAPI.getAll({
        ...filtersToUse,
        search: queryToUse || undefined
      });

      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          error: null,
          data: response.data
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        clients: {
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Failed to load clients',
          data: null
        }
      }));
    }
  }, []); // Remove state dependencies

  const loadClient = useCallback(async (clientId: string) => {
    try {
      setState(prev => ({
        ...prev,
        selectedClient: { isLoading: true, error: null, data: null }
      }));

      const response = await clientsAPI.getById(clientId);
      setState(prev => ({
        ...prev,
        selectedClient: {
          isLoading: false,
          error: null,
          data: response.data.data?.client || null
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        selectedClient: {
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Failed to load client',
          data: null
        }
      }));
    }
  }, []);

  // FIX 3: Load data only when needed, without problematic dependencies
  useEffect(() => {
    if (canRead && state.mode === 'list') {
      loadClients(state.filters, state.searchQuery);
    }
  }, [canRead, state.mode]); // Only depend on canRead and mode

  // Separate effect for client loading
  useEffect(() => {
    if (id && canRead && (state.mode === 'view' || state.mode === 'edit')) {
      console.log('Loading client data for ID:', id, 'Mode:', state.mode);
      loadClient(id);
    }
  }, [id, canRead, state.mode, loadClient]);

  // FIX 3: Update mode when route changes - now properly detects path changes
  useEffect(() => {
    const newMode = getInitialMode();
    console.log('Route change detected. Path:', location.pathname, 'Current mode:', state.mode, 'New mode:', newMode);
    if (newMode !== state.mode) {
      console.log('Mode changing from', state.mode, 'to', newMode);
      setState(prev => ({ ...prev, mode: newMode }));
    }
  }, [location.pathname, id, searchParams]); // Added location.pathname as dependency

  // Permission check after all hooks
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to view clients.</p>
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
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (query) {
      newSearchParams.set('search', query);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
    
    // Use the updated parameters directly
    loadClients({ ...state.filters, page: 1 }, query);
  };

  const handleFilterChange = (key: keyof ClientFilters, value: any) => {
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
    
    loadClients(newFilters, state.searchQuery);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...state.filters, page };
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    loadClients(newFilters, state.searchQuery);
  };

  const handleClientSelect = (clientId: string) => {
    setState(prev => ({
      ...prev,
      selectedClientIds: prev.selectedClientIds.includes(clientId)
        ? prev.selectedClientIds.filter(id => id !== clientId)
        : [...prev.selectedClientIds, clientId]
    }));
  };

  const handleSelectAll = () => {
    const clients: Client[] = state.clients.data?.data?.clients || [];
    setState(prev => ({
      ...prev,
      selectedClientIds: prev.selectedClientIds.length === clients.length ? [] : clients.map((c: Client) => c.id)
    }));
  };
  // Add this function in your ClientsPage component
const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await clientsAPI.checkEmail(email);
    return response.data.data.exists;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};
  // const handleCreateClient = async (formData: ClientFormData) => {
  //   try {
  //     setState(prev => ({
  //       ...prev,
  //       selectedClient: { ...prev.selectedClient, isLoading: true }
  //     }));

  //     await clientsAPI.create(formData);

  //     setState(prev => ({ 
  //       ...prev, 
  //       mode: 'list',
  //       selectedClient: { ...prev.selectedClient, isLoading: false }
  //     }));
  //     navigate('/clients');
  //     // Reload clients after successful creation
  //     setTimeout(() => loadClients(state.filters, state.searchQuery), 100);
  //   } catch (error: any) {
  //     console.error('Failed to create client:', error);
  //     setState(prev => ({
  //       ...prev,
  //       selectedClient: { 
  //         ...prev.selectedClient, 
  //         isLoading: false,
  //         error: error.response?.data?.message || 'Failed to create client'
  //       }
  //     }));
  //   }
  // };

// const handleCreateClient = async (formData: ClientFormData) => {
//   try {
//     setState(prev => ({
//       ...prev,
//       selectedClient: { ...prev.selectedClient, isLoading: true }
//     }));

//     await clientsAPI.create(formData);

//     setState(prev => ({
//       ...prev,
//       mode: 'list',
//       selectedClient: { ...prev.selectedClient, isLoading: false }
//     }));
//     navigate('/clients');
//     setTimeout(() => loadClients(state.filters, state.searchQuery), 100);
    
//   } catch (error: any) {
//     console.error('Failed to create client:', error);
    
//     // Show the error to the user!
//     const errorMessage = error.response?.data?.message || 'Failed to create client';
//     alert(`❌ Error\n\n${errorMessage}`);
    
//     setState(prev => ({
//       ...prev,
//       selectedClient: {
//         ...prev.selectedClient,
//         isLoading: false,
//         error: errorMessage
//       }
//     }));
//   }
// };

// const handleCreateClient = async (formData: ClientFormData) => {
//   try {
//     setState(prev => ({
//       ...prev,
//       selectedClient: { ...prev.selectedClient, isLoading: true }
//     }));

//     await clientsAPI.create(formData);

//     setState(prev => ({
//       ...prev,
//       mode: 'list',
//       selectedClient: { ...prev.selectedClient, isLoading: false }
//     }));
//     navigate('/clients');
//     setTimeout(() => loadClients(state.filters, state.searchQuery), 100);
    
//   } catch (error: any) {
//     console.error('Failed to create client:', error);
    
//     const errorMessage = error.response?.data?.message || 'Failed to create client';
    
//     // Check if it's an email duplicate error
//     if (errorMessage.toLowerCase().includes('email')) {
//       // Show specific error for email field
//       alert('⚠️ Email Already Exists\n\nThis email address is already registered. Please use a different email address.');
//     } else {
//       // Show generic error
//       alert(`❌ Error\n\n${errorMessage}`);
//     }
    
//     setState(prev => ({
//       ...prev,
//       selectedClient: {
//         ...prev.selectedClient,
//         isLoading: false,
//         error: errorMessage
//       }
//     }));
//   }
// };


const handleCreateClient = async (formData: ClientFormData) => {
  try {
    setState(prev => ({
      ...prev,
      selectedClient: { ...prev.selectedClient, isLoading: true }
    }));

    await clientsAPI.create(formData);

    setState(prev => ({
      ...prev,
      mode: 'list',
      selectedClient: { ...prev.selectedClient, isLoading: false }
    }));
    navigate('/clients');
    setTimeout(() => loadClients(state.filters, state.searchQuery), 100);
    
  } catch (error: any) {
    console.error('Failed to create client:', error);
    
    // FIX: Correct path to error message
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        'Failed to create client';
    
    if (errorMessage.toLowerCase().includes('email')) {
      alert('⚠️ Email Already Exists\n\nThis email address is already registered. Please use a different email address.');
    } else {
      alert(`❌ Error\n\n${errorMessage}`);
    }
    
    setState(prev => ({
      ...prev,
      selectedClient: {
        ...prev.selectedClient,
        isLoading: false,
        error: errorMessage
      }
    }));
  }
};
  const handleUpdateClient = async (formData: ClientFormData) => {
    if (!id) return;

    try {
      setState(prev => ({
        ...prev,
        selectedClient: { ...prev.selectedClient, isLoading: true }
      }));

      const response = await clientsAPI.update(id, formData);
      
      setState(prev => ({ 
        ...prev, 
        mode: 'view',
        selectedClient: { 
          isLoading: false, 
          error: null,
          data: response.data.data?.client || prev.selectedClient.data
        }
      }));
      
      navigate(`/clients/${id}`);
      
      // Reload client data and clients list
      await Promise.all([
        loadClient(id), 
        loadClients(state.filters, state.searchQuery)
      ]);
      
    } catch (error: any) {
      console.error('Failed to update client:', error);
      setState(prev => ({
        ...prev,
        selectedClient: {
          ...prev.selectedClient,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to update client'
        }
      }));
    }
  };

  const handleBack = () => {
    // setState(prev => ({ ...prev, mode: 'list' }));
    setState(prev => ({ 
    ...prev, 
    mode: 'list',
    selectedClient: { 
      ...prev.selectedClient, 
      error: null // Clear error when going back
    }
  }));
    navigate('/clients');
  };

  // FIX 4: Simplified navigation handlers
  const handleCreateNew = () => {
    console.log('Navigating to create mode');
    navigate('/clients/create');
    // Mode will be updated by the useEffect that watches route changes
  };

  const handleViewClient = (clientId: string) => {
    console.log('Navigating to view mode for client:', clientId);
    navigate(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    console.log('Navigating to edit mode for client:', clientId);
    navigate(`/clients/${clientId}?edit=true`);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This will deactivate the client instead of permanent deletion.')) {
      return;
    }

    try {
      await clientsAPI.delete(clientId);
      loadClients(state.filters, state.searchQuery);
    } catch (error: any) {
      console.error('Failed to delete client:', error);
      alert(`Failed to delete client: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (state.selectedClientIds.length === 0) return;

    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate', 
      delete: 'delete'
    }[action];

    if (!window.confirm(`Are you sure you want to ${actionText} ${state.selectedClientIds.length} selected clients?`)) {
      return;
    }

    try {
      setState(prev => ({ ...prev, bulkLoading: true }));
      
      await clientsAPI.bulkAction({
        clientIds: state.selectedClientIds,
        action
      });

      setState(prev => ({
        ...prev,
        selectedClientIds: [],
        bulkLoading: false
      }));

      loadClients(state.filters, state.searchQuery);
    } catch (error: any) {
      setState(prev => ({ ...prev, bulkLoading: false }));
      console.error(`Failed to ${actionText} clients:`, error);
      alert(`Failed to ${actionText} clients: ${error.response?.data?.message || error.message}`);
    }
  };

  // Debug logging
  console.log('Current mode:', state.mode, 'Path:', window.location.pathname, 'ID:', id);

  // Render loading state
  if (state.clients.isLoading && state.mode === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <CardSpinner text="Loading clients..." />
        </div>
      </div>
    );
  }

  

  // Render error state
  if (state.clients.error && state.mode === 'list') {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-600 mb-4">
          <Icons.XCircle />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Clients</h3>
        <p className="text-gray-500 mb-4">{state.clients.error}</p>
        <button
          onClick={() => loadClients(state.filters, state.searchQuery)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const clients: Client[] = state.clients.data?.data?.clients || [];
  const pagination = state.clients.data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClientPageHeader
        mode={state.mode}
        canCreate={canCreate}
        canUpdate={hasPermission('clients', 'update')}
        onBack={handleBack}
        onCreateNew={handleCreateNew}
        onEditClient={() => handleEditClient(id!)}
        clientId={id}
      />

      {/* Create/Edit Form */}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <ClientForm
          client={state.mode === 'edit' ? (state.selectedClient.data ?? null) : null}
          onSubmit={state.mode === 'create' ? handleCreateClient : handleUpdateClient}
          onCancel={handleBack}
          loading={state.selectedClient.isLoading}
          isEdit={state.mode === 'edit'}
          onEmailCheck={checkEmailExists}
          submissionError={state.selectedClient.error}
          // error={state.selectedClient.error}
          
        />
      )}

      {/* Client Details View */}
      {state.mode === 'view' && (
        <ClientDetailsView
          client={state.selectedClient.data ?? null}
          loading={state.selectedClient.isLoading}
          error={state.selectedClient.error ?? null}
        />
      )}

      {/* Clients List */}
      {state.mode === 'list' && (
        <>
          <ClientFiltersBar
            searchQuery={state.searchQuery}
            filters={state.filters}
            selectedClientIds={state.selectedClientIds}
            bulkLoading={state.bulkLoading}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onBulkAction={handleBulkAction}
          />

          <ClientsTable
            clients={clients}
            loading={state.clients.isLoading}
            selectedClientIds={state.selectedClientIds}
            onClientSelect={handleClientSelect}
            onSelectAll={handleSelectAll}
            onViewClient={handleViewClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ClientsPage;