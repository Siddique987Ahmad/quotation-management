import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentsAPI } from '../../services/api';
import { Icons } from '../../components/Icons/Icons';
import { ButtonSpinner } from '../../components/LoadingSpinner';

// =============================================================================
// TYPES
// =============================================================================

interface AddDepartmentPageState {
  clients: Array<{
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  }>;
  loading: boolean;
  error: string | null;
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
}

// =============================================================================
// COMPONENT
// =============================================================================

const AddDepartmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AddDepartmentPageState>({
    clients: [],
    loading: true,
    error: null,
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
    submitting: false
  });

  // Load clients
  const loadClients = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await departmentsAPI.getClients();
      setState(prev => ({ 
        ...prev, 
        clients: response.data.data || response.data,
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error loading clients:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load clients',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

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
      setState(prev => ({ ...prev, submitting: true }));
      await departmentsAPI.create(state.formData);
      navigate('/departments');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error?.response?.data?.message || 'Failed to create department',
        submitting: false
      }));
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      formErrors: { ...prev.formErrors, [field]: '' }
    }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Department</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new department and assign it to a client
          </p>
        </div>
        <button
          onClick={() => navigate('/departments')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Icons.ArrowLeft />
          Back to Departments
        </button>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <Icons.AlertCircle />
            <p className="text-sm">{state.error}</p>
          </div>
        </div>
      )}

      {/* Department Form */}
      <div className="bg-white p-6 rounded-lg shadow">
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
              onClick={() => navigate('/departments')}
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
              {state.submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartmentPage;
