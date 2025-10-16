import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rolePermissionsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface RolePermissionData {
  roles: string[];
  rolePermissions: Record<string, string[]>;
  permissionCategories: Record<string, {
    name: string;
    description: string;
    permissions: string[];
  }>;
}

const RolePermissionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [data, setData] = useState<RolePermissionData | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rolePermissionsAPI.getAll();
      
      if (response.data.success) {
        const responseData = response.data.data;
        setData(responseData);
        setRolePermissions(responseData.rolePermissions);
        
        // Select first role by default
        if (responseData.roles.length > 0) {
          setSelectedRole(responseData.roles[0]);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    if (!selectedRole) return;

    const currentPermissions = rolePermissions[selectedRole] || [];
    const hasPermission = currentPermissions.includes(permission);

    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: hasPermission
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission]
    }));
  };

  // const handleSave = async () => {
  //   if (!selectedRole) return;

  //   try {
  //     setSaving(true);
  //     setError(null);

  //     const response = await rolePermissionsAPI.updateRole(
  //       selectedRole,
  //       rolePermissions[selectedRole]
  //     );

  //     if (response.data.success) {
  //       setSuccessMessage(`Permissions updated successfully for ${selectedRole} role!`);
  //       setTimeout(() => setSuccessMessage(null), 3000);
  //     }
  //   } catch (error: any) {
  //     setError(error.response?.data?.message || 'Failed to update permissions');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

const handleSave = async () => {
  if (!selectedRole) return;

  try {
    setSaving(true);
    setError(null);

    console.log('Saving permissions for role:', selectedRole);
    console.log('Permissions to save:', rolePermissions[selectedRole]);

    const response = await rolePermissionsAPI.updateRole(
      selectedRole,
      rolePermissions[selectedRole] || []
    );

    console.log('Save response:', response.data);

    if (response.data.success) {
      setSuccessMessage(`Permissions updated successfully for ${selectedRole} role!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload data to confirm save
      await loadData();
    }
  } catch (error: any) {
    console.error('Save error:', error);
    console.error('Error response:', error.response?.data);
    setError(error.response?.data?.message || 'Failed to update permissions');
  } finally {
    setSaving(false);
  }
};

  const isPermissionChecked = (permission: string): boolean => {
    if (!selectedRole) return false;
    const permissions = rolePermissions[selectedRole] || [];
    return permissions.includes(permission);
  };

  const getPermissionLabel = (permission: string): string => {
    const parts = permission.split(':');
    return parts[1]?.replace(/_/g, ' ').toUpperCase() || permission;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Loading role permissions..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Failed to load role permission data
        </div>
      </div>
    );
  }

  const totalPermissions = rolePermissions[selectedRole]?.length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Role & Permission Management</h1>
        <p className="text-gray-600 mt-1">
          Configure permissions for each user role in your system
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Role Selector */}
      <div className="mb-6 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Role to Configure
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {data.roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Permissions configured here will apply to ALL users with the {selectedRole} role
        </p>
      </div>

      {/* Permission Categories */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {Object.entries(data.permissionCategories).map(([categoryKey, category], index) => (
          <div key={categoryKey} className={index !== 0 ? 'border-t border-gray-200' : ''}>
            <div className="px-6 py-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.permissions.map(permission => {
                  const isChecked = isPermissionChecked(permission);
                  const label = getPermissionLabel(permission);
                  
                  return (
                    <label
                      key={permission}
                      className={`flex items-center p-3 rounded-md border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePermissionToggle(permission)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {label}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{permission}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/settings')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Role Permissions
            </>
          )}
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-md p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Permission Summary</h4>
        <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
          <span className="text-sm text-gray-600">Total Permissions for {selectedRole}</span>
          <span className="text-lg font-bold text-blue-600">{totalPermissions}</span>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManagement;