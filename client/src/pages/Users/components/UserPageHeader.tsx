import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { PageMode } from '../types';

interface UserPageHeaderProps {
  mode: PageMode;
  canCreate: boolean;
  canUpdate: boolean;
  onBack: () => void;
  onCreateNew: () => void;
  onEditUser: () => void;
  userId?: string;
}

const UserPageHeader: React.FC<UserPageHeaderProps> = ({
  mode,
  canCreate,
  canUpdate,
  onBack,
  onCreateNew,
  onEditUser,
  userId
}) => {
  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Employee';
      case 'edit': return 'Edit Employee';
      case 'view': return 'Employee Details';
      default: return 'Employee Management';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'list': return 'Manage company employees and their system access';
      case 'create': return 'Add a new employee to give them access to the quotation system';
      default: return 'View and manage employee information';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600 mt-1">{getDescription()}</p>
        </div>

        <div className="flex space-x-3">
          {mode !== 'list' && (
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <div className="w-4 h-4 mr-2">
                <Icons.ArrowLeft />
              </div>
              <span>Back to List</span>
            </button>
          )}

          {mode === 'list' && canCreate && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <div className="w-5 h-5 mr-2">
                <Icons.Plus />
              </div>
              <span>Add Employee</span>
            </button>
          )}

          {mode === 'view' && canUpdate && (
            <button
              onClick={onEditUser}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <div className="w-4 h-4 mr-2">
                <Icons.Edit />
              </div>
              <span>Edit Employee</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPageHeader;