import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { PageMode } from '../types';

interface InvoicePageHeaderProps {
  mode: PageMode;
  onBack: () => void;
  invoiceNumber?: string;
  canEdit?: boolean;
  onEditInvoice?: () => void;
}

const InvoicePageHeader: React.FC<InvoicePageHeaderProps> = ({
  mode,
  onBack,
  invoiceNumber,
  canEdit,
  onEditInvoice
}) => {
  const getTitle = () => {
    switch (mode) {
      case 'edit': return `Edit Invoice ${invoiceNumber ? `#${invoiceNumber}` : ''}`;
      case 'view': return `Invoice ${invoiceNumber ? `#${invoiceNumber}` : 'Details'}`;
      default: return 'Invoices';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'list': return 'Manage and track your project invoices with dynamic tax calculations';
      case 'edit': return 'Update invoice information and tax rates';
      default: return 'View and manage invoice details';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {mode !== 'list' && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
              >
                <Icons.ArrowLeft />
                <span className="ml-2">Back to Invoices</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{getTitle()}</h1>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {mode === 'view' && canEdit && onEditInvoice && (
            <button
              onClick={onEditInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Icons.Edit />
              <span className="ml-2">Edit Invoice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePageHeader;