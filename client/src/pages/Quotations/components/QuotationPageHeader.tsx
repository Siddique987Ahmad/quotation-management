import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { PageMode } from '../types';
import { hasPermission } from '../../../utils/auth';

interface QuotationPageHeaderProps {
  mode: PageMode;
  canCreate: boolean;
  canUpdate: boolean;
  onBack: () => void;
  onCreateNew: () => void;
  onEditQuotation: () => void;
  quotationId?: string;
}

const QuotationPageHeader: React.FC<QuotationPageHeaderProps> = ({
  mode,
  canCreate,
  canUpdate,
  onBack,
  onCreateNew,
  onEditQuotation,
  quotationId
}) => {
  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Quotation';
      case 'edit': return 'Edit Quotation';
      case 'view': return 'Quotation Details';
      default: return 'Quotations';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'list': return 'Manage and track your project quotations';
      case 'create': return 'Create a new quotation with dynamic fields for your client';
      case 'edit': return 'Update quotation information and custom fields';
      default: return 'View quotation details and manage status';
    }
  };

  return (
    <div className="mb-6">
      {/* Back button for non-list modes */}
      {mode !== 'list' && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <div className="w-4 h-4 mr-2">
            <Icons.ArrowLeft />
          </div>
          <span>Back to Quotations</span>
        </button>
      )}

      {/* Header content */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{getTitle()}</h1>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>

        <div className="flex space-x-3">
          {/* Create button for list mode */}
          {mode === 'list' && canCreate && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <div className="w-5 h-5 mr-2">
                <Icons.Plus />
              </div>
              <span>Create Quotation</span>
            </button>
          )}

          {/* Edit button for view mode */}
          {mode === 'view' && canUpdate && (
            <button
              onClick={onEditQuotation}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <div className="w-4 h-4 mr-2">
                <Icons.Edit />
              </div>
              <span>Edit Quotation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationPageHeader;