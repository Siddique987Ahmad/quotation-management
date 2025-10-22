import React, { useState, useEffect } from 'react';
import { departmentsAPI } from '../../../services/api';
import { Icons } from '../../../components/Icons/Icons';

interface Department {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  clients: Array<{
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    isActive: boolean;
  }>;
}

interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  department?: {
    id: string;
    name: string;
  };
}

const DepartmentsSettings: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    clientId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [departmentsRes, clientsRes] = await Promise.all([
        departmentsAPI.list(),
        departmentsAPI.getClients()
      ]);
      
      setDepartments(departmentsRes.data?.data || []);
      setClients(clientsRes.data?.data || []);
      setError(null);
    } catch (e: any) {
      setError('Failed to load data');
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingDepartment) {
        await departmentsAPI.update(editingDepartment.id, formData);
      } else {
        await departmentsAPI.create(formData);
      }
      
      await loadData();
      resetForm();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save department');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      contactPerson: department.contactPerson || '',
      email: department.email || '',
      phone: department.phone || '',
      address: department.address || '',
      city: department.city || '',
      clientId: department.clients.length > 0 ? department.clients[0].id : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this department? This will unassign all clients from this department.')) return;

    try {
      await departmentsAPI.delete(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete department');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      clientId: ''
    });
    setEditingDepartment(null);
    setShowForm(false);
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">Manage departments and assign clients to them</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icons.Plus />
          Add Department
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <Icons.AlertCircle />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <Icons.X />
          </button>
        </div>
      )}

      {/* Department Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter department name"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact person name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
                rows={3}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Client
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName} - {client.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingDepartment ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments List */}
      <div className="space-y-4">
        {departments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icons.Folder />
            <p>No departments yet. Create your first department to get started.</p>
          </div>
        ) : (
          departments.map(department => (
            <div key={department.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-600">
                    {department.clients.length} client{department.clients.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit department"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete department"
                  >
                    <Icons.Trash  />
                  </button>
                </div>
              </div>

              {/* Assigned Clients */}
              {department.clients.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Assigned Clients:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {department.clients.map(client => (
                      <div
                        key={client.id}
                        className="flex items-center p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{client.companyName}</div>
                          <div className="text-sm text-gray-600">
                            {client.contactPerson} • {client.email}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          client.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No clients assigned to this department
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentsSettings;
