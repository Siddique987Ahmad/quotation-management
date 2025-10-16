import React from 'react';
import { User, Role } from '../../../types';
import { getUserDisplayName, getRoleDisplayName } from '../../../utils/auth';
import { CardSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';

interface UserDetailsViewProps {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getRoleColor = (role: Role): string => {
  const colors: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'bg-red-100 text-red-800',
    [Role.ADMIN]: 'bg-orange-100 text-orange-800',
    [Role.MANAGER]: 'bg-blue-100 text-blue-800',
    [Role.USER]: 'bg-green-100 text-green-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

const UserDetailsView: React.FC<UserDetailsViewProps> = ({
  user,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <CardSpinner text="Loading user details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-xl font-medium text-white">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              {getUserDisplayName(user)}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </span>
              <span className={`inline-flex items-center text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                <div className="w-4 h-4 mr-1">
                  {user.isActive ? <Icons.CheckCircle /> : <Icons.XCircle />}
                </div>
                <span>{user.isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-sm text-gray-900">{getUserDisplayName(user)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="text-sm text-gray-900">{getRoleDisplayName(user.role)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Quotations</dt>
                <dd className="text-sm text-gray-900">{(user as any).statistics?.totalQuotations || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Invoices</dt>
                <dd className="text-sm text-gray-900">{(user as any).statistics?.totalInvoices || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(user.updatedAt || user.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsView;