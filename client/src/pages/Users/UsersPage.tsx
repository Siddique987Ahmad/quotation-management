// =============================================================================
// FIXED USERS PAGE - Main Issues Resolved
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { 
  hasPermission, 
  getUser, 
  hasRoleOrHigher,
  getRoleDisplayName,
  getUserDisplayName 
} from '../../utils/auth';
import { 
  User, 
  Role, 
  AsyncState,
  UserFilters 
} from '../../types';
import LoadingSpinner, { 
  TableLoader, 
  ButtonSpinner,
  CardSpinner 
} from '../../components/LoadingSpinner';
import { Icons } from '../../components/Icons/Icons';

// Import sub-components
import UserPageHeader from './components/UserPageHeader'; 
import UserForm from './components/UserForm';
import UserDetailsView from './components/UserDetailsView';
import UserFiltersBar from './components/UserFiltersBar';
import UsersTable from './components/UsersTable';
import { UserFormData, PageMode, UsersPageState } from './types';

const UsersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // FIX 1: Better mode detection - check both route and query params
  // const getInitialMode = (): PageMode => {
  //   if (!id) return 'list';
  //   if (searchParams.get('edit') === 'true') return 'edit';
  //   if (window.location.pathname.endsWith('/edit')) return 'edit';
  //   return 'view';
  // };

  const getInitialMode = (): PageMode => {
  // Check if we're on the create route
  if (window.location.pathname.endsWith('/create')) return 'create';
  
  // If no ID, we're on the list page
  if (!id) return 'list';
  
  // If there's an ID, check for edit mode
  if (searchParams.get('edit') === 'true') return 'edit';
  if (window.location.pathname.endsWith('/edit')) return 'edit';
  
  // Default to view mode when there's an ID
  return 'view';
};
  
  const [state, setState] = useState<UsersPageState>({
    mode: getInitialMode(),
    users: { isLoading: true, error: null, data: null },
    selectedUser: { isLoading: false, error: null, data: null },
    availableRoles: [],
    selectedUserIds: [],
    bulkLoading: false,
    filters: {
      page: 1,
      limit: 10,
      role: (searchParams.get('role') as Role) || undefined,
      isActive: searchParams.get('status') === 'inactive' ? false : undefined
    },
    searchQuery: searchParams.get('search') || ''
  });

  // Check permissions
  const canCreate = hasPermission('users', 'create');
  const canRead = hasPermission('users', 'read');

  // FIX 2: Remove state dependencies from useCallback to prevent infinite loops
  const loadUsers = useCallback(async (filters?: UserFilters) => {
    try {
      setState(prev => ({
        ...prev,
        users: { ...prev.users, isLoading: true, error: null }
      }));

      const filtersToUse = filters || state.filters;
      const response = await usersAPI.getAll({
        ...filtersToUse,
        search: state.searchQuery || undefined
      });

      setState(prev => ({
        ...prev,
        users: {
          isLoading: false,
          error: null,
          data: response.data
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        users: {
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Failed to load users',
          data: null
        }
      }));
    }
  }, [state.filters, state.searchQuery]);

  const loadAvailableRoles = useCallback(async () => {
    try {
      const response = await usersAPI.getAvailableRoles();
      setState(prev => ({
        ...prev,
        availableRoles: response.data.data?.roles || []
      }));
    } catch (error: any) {
      console.error('Failed to load available roles:', error);
      setState(prev => ({
        ...prev,
        availableRoles: []
      }));
    }
  }, []);

  const loadUser = useCallback(async (userId: string) => {
    try {
      setState(prev => ({
        ...prev,
        selectedUser: { isLoading: true, error: null, data: null }
      }));

      const response = await usersAPI.getById(userId);
      setState(prev => ({
        ...prev,
        selectedUser: {
          isLoading: false,
          error: null,
          data: response.data.data?.user || null
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        selectedUser: {
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Failed to load user',
          data: null
        }
      }));
    }
  }, []);

  // FIX 3: Better effect management - separate concerns
  useEffect(() => {
    if (canRead) {
      loadAvailableRoles();
      if (state.mode === 'list') {
        loadUsers();
      }
    }
  }, [canRead, state.mode, loadAvailableRoles, loadUsers]);

  // FIX 4: Separate effect for user loading to ensure it runs when needed
  useEffect(() => {
    if (id && canRead && (state.mode === 'view' || state.mode === 'edit')) {
      console.log('Loading user data for ID:', id, 'Mode:', state.mode); // Debug log
      loadUser(id);
    }
  }, [id, canRead, state.mode, loadUser]);

  // FIX 5: Update mode when route changes
  useEffect(() => {
    const newMode = getInitialMode();
    if (newMode !== state.mode) {
      setState(prev => ({ ...prev, mode: newMode }));
    }
  }, [id, searchParams, state.mode]);

  
  


  // Permission check after all hooks
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to view users.</p>
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
    
    loadUsers({ ...state.filters, page: 1 });
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
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
    
    loadUsers(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...state.filters, page };
    setState(prev => ({
      ...prev,
      filters: newFilters
    }));
    loadUsers(newFilters);
  };

  const handleUserSelect = (userId: string) => {
    setState(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter(id => id !== userId)
        : [...prev.selectedUserIds, userId]
    }));
  };

  const handleSelectAll = () => {
    const users: User[] = state.users.data?.data?.users || [];
    setState(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.length === users.length ? [] : users.map((u: User) => u.id)
    }));
  };

  const handleCreateUser = async (formData: UserFormData) => {
    try {
      setState(prev => ({
        ...prev,
        selectedUser: { ...prev.selectedUser, isLoading: true }
      }));

      await usersAPI.create({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });

      setState(prev => ({ 
        ...prev, 
        mode: 'list',
        selectedUser: { ...prev.selectedUser, isLoading: false }
      }));
      navigate('/users');
      loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setState(prev => ({
        ...prev,
        selectedUser: { 
          ...prev.selectedUser, 
          isLoading: false,
          error: error.response?.data?.message || 'Failed to create user'
        }
      }));
    }
  };

  // FIX 6: Improved password update logic
  const handleUpdateUser = async (formData: UserFormData) => {
    if (!id) return;

    try {
      setState(prev => ({
        ...prev,
        selectedUser: { ...prev.selectedUser, isLoading: true }
      }));

      const updateData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      };

      // FIX 7: Only include password if it's provided and not empty
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password.trim();
        console.log('Updating password for user:', id); // Debug log
      }

      console.log('Update data being sent:', updateData); // Debug log

      const response = await usersAPI.update(id, updateData);
      
      console.log('Update response:', response.data); // Debug log
      
      setState(prev => ({ 
        ...prev, 
        mode: 'view',
        selectedUser: { 
          isLoading: false, 
          error: null,
          data: response.data.data?.user || prev.selectedUser.data
        }
      }));
      
      navigate(`/users/${id}`);
      
      // FIX 8: Show success message for password update
      if (formData.password && formData.password.trim() !== '') {
        alert('User updated successfully! Password has been changed.');
      }
      
      // Reload user data and users list
      await Promise.all([loadUser(id), loadUsers()]);
      
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setState(prev => ({
        ...prev,
        selectedUser: {
          ...prev.selectedUser,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to update user'
        }
      }));
      
      // Show error message
      alert(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBack = () => {
    navigate('/users');
    setState(prev => ({ ...prev, mode: 'list' }));
  };

  // const handleCreateNew = () => {
  //   navigate('/users/create');
  //   setState(prev => ({ ...prev, mode: 'create' }));
  // };

  const handleCreateNew = () => {
  navigate('/users/create');
  // FIX: Clear selected user data when creating new user
  setState(prev => ({ 
    ...prev, 
    mode: 'create',
    selectedUser: { isLoading: false, error: null, data: null }
  }));
};

  const handleViewUser = (userId: string) => {
    navigate(`/users/${userId}`);
    setState(prev => ({ ...prev, mode: 'view' }));
  };

  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}?edit=true`);
    setState(prev => ({ ...prev, mode: 'edit' }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(`Failed to delete user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (state.selectedUserIds.length === 0) return;

    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate', 
      delete: 'delete'
    }[action];

    if (!window.confirm(`Are you sure you want to ${actionText} ${state.selectedUserIds.length} selected users?`)) {
      return;
    }

    try {
      setState(prev => ({ ...prev, bulkLoading: true }));
      
      await usersAPI.bulkAction({
        userIds: state.selectedUserIds,
        action
      });

      setState(prev => ({
        ...prev,
        selectedUserIds: [],
        bulkLoading: false
      }));

      loadUsers();
    } catch (error: any) {
      setState(prev => ({ ...prev, bulkLoading: false }));
      console.error(`Failed to ${actionText} users:`, error);
      alert(`Failed to ${actionText} users: ${error.response?.data?.message || error.message}`);
    }
  };
//   const handleManagePermissions = (userId: string) => {
//   navigate(`/users/permissions/available`)
// };

  // Render loading state
  if (state.users.isLoading && state.mode === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <CardSpinner text="Loading users..." />
        </div>
      </div>
    );
  }

  // Render error state
  if (state.users.error && state.mode === 'list') {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-600 mb-4">
          <Icons.XCircle />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Users</h3>
        <p className="text-gray-500 mb-4">{state.users.error}</p>
        <button
          onClick={() => loadUsers()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const users: User[] = state.users.data?.data?.users || [];
  const pagination = state.users.data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <UserPageHeader
        mode={state.mode}
        canCreate={canCreate}
        canUpdate={hasPermission('users', 'update')}
        onBack={handleBack}
        onCreateNew={handleCreateNew}
        onEditUser={() => handleEditUser(id!)}
        userId={id}
      />

      {/* Create/Edit Form */}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <UserForm
          user={state.mode === 'edit' ? (state.selectedUser.data ?? null) : null}
          availableRoles={state.availableRoles}
          onSubmit={state.mode === 'create' ? handleCreateUser : handleUpdateUser}
          onCancel={handleBack}
          loading={state.selectedUser.isLoading}
          isEdit={state.mode === 'edit'}
        />
      )}

      

      {/* User Details View */}
      {state.mode === 'view' && (
        <UserDetailsView
          user={state.selectedUser.data ?? null}
          loading={state.selectedUser.isLoading}
          error={state.selectedUser.error ?? null}
        />
      )}

      {/* Users List */}
      {state.mode === 'list' && (
        <>
          <UserFiltersBar
            searchQuery={state.searchQuery}
            filters={state.filters}
            availableRoles={state.availableRoles}
            selectedUserIds={state.selectedUserIds}
            bulkLoading={state.bulkLoading}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onBulkAction={handleBulkAction}
          />

          <UsersTable
            users={users}
            loading={state.users.isLoading}
            selectedUserIds={state.selectedUserIds}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            pagination={pagination}
            // onManagePermissions={handleManagePermissions} // ADD THIS
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default UsersPage;