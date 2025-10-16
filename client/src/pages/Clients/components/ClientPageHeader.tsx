import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { PageMode } from '../types';

interface ClientPageHeaderProps {
  mode: PageMode;
  canCreate: boolean;
  canUpdate: boolean;
  onBack: () => void;
  onCreateNew: () => void;
  onEditClient: () => void;
  clientId?: string;
}

const ClientPageHeader: React.FC<ClientPageHeaderProps> = ({
  mode,
  canCreate,
  canUpdate,
  onBack,
  onCreateNew,
  onEditClient,
  clientId
}) => {
  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Client';
      case 'edit': return 'Edit Client';
      case 'view': return 'Client Details';
      default: return 'Client Management';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'list': return 'Manage your business clients and customer relationships';
      case 'create': return 'Add a new client to create quotations and manage business relationships';
      default: return 'View and manage client information and business history';
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
              <span>Add Client</span>
            </button>
          )}

          {mode === 'view' && canUpdate && (
            <button
              onClick={onEditClient}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <div className="w-4 h-4 mr-2">
                <Icons.Edit />
              </div>
              <span>Edit Client</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPageHeader;