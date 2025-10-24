import React, { useState, useEffect } from 'react';
import { departmentsAPI } from '../../services/api';
import api from '../../services/api';
import { Icons } from '../../components/Icons/Icons';
import { PageSpinner, ButtonSpinner } from '../../components/LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

interface Department {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
  clients: Array<{
    id: string;
    client: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  }>;
}

interface ViewDepartmentsPageState {
  departments: Department[];
  clients: Array<{
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  }>;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'name' | 'email' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  showForm: boolean;
  editingDepartment: Department | null;
  formData: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    clientId: string;
  };
  formErrors: {[key: string]: string};
  submitting: boolean;
  deletingId: string | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

const ViewDepartmentsPage: React.FC = () => {
  const [state, setState] = useState<ViewDepartmentsPageState>({
    departments: [],
    clients: [],
    loading: true,
    error: null,
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
    showForm: false,
    editingDepartment: null,
    formData: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      clientId: ''
    },
    formErrors: {},
    submitting: false,
    deletingId: null
  });

  // Load departments and clients
  const loadDepartments = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const [departmentsRes, clientsRes] = await Promise.all([
        departmentsAPI.list(),
        departmentsAPI.getClients()
      ]);
      setState(prev => ({ 
        ...prev, 
        departments: departmentsRes.data.data || departmentsRes.data, 
        clients: clientsRes.data.data || clientsRes.data,
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error loading departments:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load departments',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  // Handle sort
  const handleSort = (field: 'name' | 'email' | 'createdAt') => {
    setState(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort departments
  const filteredDepartments = state.departments
    .filter(dept => 
      dept.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (dept.email && dept.email.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
      (dept.contactPerson && dept.contactPerson.toLowerCase().includes(state.searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (state.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // CRUD Operations
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!state.formData.name.trim()) {
      errors.name = 'Department name is required';
    }
    
    if (!state.formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!state.formData.clientId) {
      errors.clientId = 'Please select a client';
    }
    
    setState(prev => ({ ...prev, formErrors: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, submitting: true, error: null }));
      
      if (state.editingDepartment) {
        await departmentsAPI.update(state.editingDepartment.id, state.formData);
      } else {
        await departmentsAPI.create(state.formData);
      }
      
      await loadDepartments();
      resetForm();
    } catch (error: any) {
      console.error('Form submission error:', error);
      setState(prev => ({
        ...prev,
        error: error?.response?.data?.message || 'Failed to save department',
        submitting: false
      }));
    }
  };

  const handleEdit = (department: Department) => {
    setState(prev => ({
      ...prev,
      editingDepartment: department,
      formData: {
        name: department.name,
        contactPerson: department.contactPerson || '',
        email: department.email || '',
        phone: department.phone || '',
        address: department.address || '',
        city: department.city || '',
        clientId: department.clients.length > 0 ? department.clients[0].client.id : ''
      },
      showForm: true
    }));
  };

  const handleDelete = async (id: string) => {
    // Find the department to check if it has clients
    const department = state.departments.find(dept => dept.id === id);
    
    if (department && department.clients.length > 0) {
      const clientNames = department.clients.map(client => client.client.name).join(', ');
      if (!window.confirm(
        `This department has ${department.clients.length} client(s) assigned: ${clientNames}\n\n` +
        `Do you want to proceed? This will unassign all clients from this department.`
      )) return;
    } else {
      if (!window.confirm('Delete this department?')) return;
    }

    try {
      setState(prev => ({ ...prev, error: null, deletingId: id }));
      await departmentsAPI.delete(id);
      await loadDepartments();
      setState(prev => ({ 
        ...prev, 
        error: null,
        deletingId: null
      }));
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to delete department';
      
      // Handle specific error about assigned clients
      if (errorMessage.includes('assigned clients') || errorMessage.includes('reassign clients')) {
        setState(prev => ({
          ...prev,
          error: 'Cannot delete department with assigned clients. Please reassign clients to other departments first.',
          deletingId: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          deletingId: null
        }));
      }
    }
  };

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      showForm: false,
      editingDepartment: null,
      formData: {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        clientId: ''
      },
      formErrors: {},
      submitting: false,
      deletingId: null
    }));
  };

  const handleFormChange = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      formErrors: { ...prev.formErrors, [field]: '' }
    }));
  };

  const handleUnassignClients = async (departmentId: string) => {
    // Find the department to check clients
    const department = state.departments.find(dept => dept.id === departmentId);
    if (!department) return;
    
    const clientNames = department.clients.map(client => client.client.name).join(', ');
    if (!window.confirm(
      `Unassign ${department.clients.length} client(s) from this department?\n\n` +
      `Clients: ${clientNames}\n\n` +
      `This will remove the department assignment from these clients.`
    )) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Unassign all clients from this department
      for (const clientDepartment of department.clients) {
        // Use direct API call instead of clientsAPI method
        await api.delete(`/clients/${clientDepartment.client.id}/departments/${departmentId}`);
      }
      
      // Reload departments to reflect changes
      await loadDepartments();
      
      setState(prev => ({ 
        ...prev, 
        error: null
      }));
    } catch (error: any) {
      console.error('Unassign clients error:', error);
      setState(prev => ({
        ...prev,
        error: error?.response?.data?.message || error.message || 'Failed to unassign clients'
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all departments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setState(prev => ({ ...prev, showForm: !prev.showForm, editingDepartment: null }))}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Icons.Plus />
            {state.showForm ? 'Cancel' : 'Add Department'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Departments
            </label>
            <input
              type="text"
              id="search"
              value={state.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or contact person..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Department Form */}
      {state.showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {state.editingDepartment ? 'Edit Department' : 'Add New Department'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={state.formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                    state.formErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter department name"
                />
                {state.formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{state.formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={state.formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                    state.formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter email address"
                />
                {state.formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{state.formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  value={state.formData.contactPerson}
                  onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  value={state.formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={state.formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={state.formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                  placeholder="Enter city"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Client *
                </label>
                <select
                  id="clientId"
                  value={state.formData.clientId}
                  onChange={(e) => handleFormChange('clientId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                    state.formErrors.clientId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select a client</option>
                  {state.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} - {client.contactPerson}
                    </option>
                  ))}
                </select>
                {state.formErrors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{state.formErrors.clientId}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={state.submitting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {state.submitting && <ButtonSpinner />}
                {state.submitting ? 'Saving...' : (state.editingDepartment ? 'Update Department' : 'Create Department')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <Icons.AlertCircle />
            <p className="text-sm">{state.error}</p>
          </div>
        </div>
      )}

      {/* Departments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <Icons.Building />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {state.searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating a new department using the form above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {state.sortBy === 'name' && (
                        <div className={`w-4 h-4 ml-1 ${state.sortOrder === 'desc' ? 'transform rotate-90' : 'transform -rotate-90'}`}>
                          <Icons.ChevronRight />
                        </div>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {state.sortBy === 'email' && (
                        <div className={`w-4 h-4 ml-1 ${state.sortOrder === 'desc' ? 'transform rotate-90' : 'transform -rotate-90'}`}>
                          <Icons.ChevronRight />
                        </div>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clients
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created
                      {state.sortBy === 'createdAt' && (
                        <div className={`w-4 h-4 ml-1 ${state.sortOrder === 'desc' ? 'transform rotate-90' : 'transform -rotate-90'}`}>
                          <Icons.ChevronRight />
                        </div>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{department.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{department.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {department.contactPerson || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {department.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {department.clients.length} client{department.clients.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(department.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(department)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Department"
                        >
                          <Icons.Edit />
                        </button>
                        
                        {department.clients.length > 0 ? (
                          <>
                            <button
                              onClick={() => handleUnassignClients(department.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Unassign All Clients"
                            >
                              <Icons.Users />
                            </button>
                            <button
                              onClick={() => handleDelete(department.id)}
                              disabled={state.deletingId === department.id}
                              className={`${state.deletingId === department.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                              title="Delete Department (will unassign clients first)"
                            >
                              {state.deletingId === department.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Icons.Trash />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelete(department.id)}
                            disabled={state.deletingId === department.id}
                            className={`${state.deletingId === department.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                            title="Delete Department"
                          >
                            {state.deletingId === department.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Icons.Trash />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredDepartments.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 rounded-md">
          <p className="text-sm text-gray-600">
            Showing {filteredDepartments.length} of {state.departments.length} departments
            {state.searchQuery && ` matching "${state.searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewDepartmentsPage;
