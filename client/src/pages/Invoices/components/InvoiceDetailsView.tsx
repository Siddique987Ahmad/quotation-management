import React from 'react';
import { Invoice, InvoiceStatus, TaxPreset } from '../../../types';
import { hasPermission, getUserDisplayName } from '../../../utils/auth';
import { CardSpinner, ButtonSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';
import PDFDownloadDropdown from './PDFDownloadDropdown';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface InvoiceDetailsViewProps {
  invoice: Invoice | null | undefined;
  loading: boolean;
  error: string | null | undefined;
  taxPresets: TaxPreset[];
  onEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: InvoiceStatus) => void;
  onDownloadPDF: (taxType: string, customGstRate?: number, customPstRate?: number) => void;
  onSendEmailWithTax: (taxType: string, customGstRate?: number, customPstRate?: number) => void;
  onSendEmail: () => void;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusColor = (status: InvoiceStatus): string => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    APPROVED: 'bg-purple-100 text-purple-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getTypeLabel = (type: any): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const InvoiceDetailsView: React.FC<InvoiceDetailsViewProps> = ({
  invoice,
  loading,
  error,
  taxPresets,
  onEdit,
  onDelete,
  onStatusUpdate,
  onDownloadPDF,
  onSendEmailWithTax,
  onSendEmail
}) => {
  const canEdit = hasPermission('invoices', 'update');
  const canDelete = hasPermission('invoices', 'delete');
  const canSend = hasPermission('invoices', 'send');
  const {format}=useCurrency()

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <CardSpinner text="Loading invoice details..." />
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

  if (!invoice) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Invoice not found</h3>
          <p className="text-sm text-gray-500 mt-1">
            The invoice you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Invoice #{invoice.invoiceNumber}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500">
                {getTypeLabel(invoice.type)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <PDFDownloadDropdown
              invoice={invoice}
              onDownloadWithTax={onDownloadPDF}
              onSendEmailWithTax={onSendEmailWithTax}
              taxPresets={taxPresets}
              loading={false}
            />
            
            {canEdit && invoice.status !== InvoiceStatus.PAID && (
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Icons.Edit />
                <span className="ml-2">Edit</span>
              </button>
            )}

            {canSend && invoice.client?.email && (
              <button
                onClick={onSendEmail}
                className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Icons.Mail />
                <span className="ml-2">Send Email</span>
              </button>
            )}

            {/* Show email status if available */}
            {invoice.emailSent && (
              <div className="inline-flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <Icons.Check />
                <span className="ml-2 text-sm text-green-700">
                  Email sent {invoice.emailSentAt && `on ${formatDate(invoice.emailSentAt)}`}
                </span>
              </div>
            )}

            {/* Show message if no client email */}
            {!invoice.client?.email && (
              <div className="inline-flex items-center px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <Icons.Mail />
                <span className="ml-2 text-sm text-yellow-700">
                  No client email available
                </span>
              </div>
            )}
            
            {canDelete && invoice.status !== InvoiceStatus.PAID && (
              <button
                onClick={onDelete}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <Icons.Trash />
                <span className="ml-2">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Company:</span>
                <span className="ml-2 text-sm text-gray-900">{invoice.client?.companyName}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Contact:</span>
                <span className="ml-2 text-sm text-gray-900">{invoice.client?.contactPerson}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{invoice.client?.email}</span>
              </div>
              {invoice.client?.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-sm text-gray-900">{invoice.client.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-sm text-gray-900">{formatDate(invoice.createdAt)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Created By:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {invoice.user ? getUserDisplayName(invoice.user) : 'Unknown'}
                </span>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Due Date:</span>
                  <span className="ml-2 text-sm text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Paid Date:</span>
                  <span className="ml-2 text-sm text-gray-900">{formatDate(invoice.paidDate)}</span>
                </div>
              )}
              {invoice.emailSent && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Email Sent:</span>
                  <span className="ml-2 text-sm text-green-600">
                    Yes {invoice.emailSentAt && `on ${formatDate(invoice.emailSentAt)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Quotation */}
        {invoice.quotation && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Related Quotation</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">#{invoice.quotation.quotationNumber}</span>
                  <span className="ml-2 text-sm text-gray-500">{invoice.quotation.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary with Tax Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Subtotal:</span>
              <span className="text-sm text-gray-900">{format(parseFloat(invoice.subtotal.toString()))}</span>
            </div>
            
            {/* GST Details */}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">GST ({invoice.gstPercentage}%):</span>
              <span className="text-sm text-gray-900">{format(parseFloat(invoice.gstAmount.toString()))}</span>
            </div>
            
            {/* PST Details */}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">PST ({invoice.pstPercentage}%):</span>
              <span className="text-sm text-gray-900">{format(parseFloat(invoice.pstAmount.toString()))}</span>
            </div>
            
            {/* Combined Tax */}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Total Tax:</span>
              <span className="text-sm text-gray-900">{format(parseFloat(invoice.combinedTaxAmount.toString()))}</span>
            </div>
            
            <div className="flex justify-between text-lg font-medium border-t pt-3">
              <span>Total Amount:</span>
              <span>{format(parseFloat(invoice.totalAmount.toString()))}</span>
            </div>
          </div>
        </div>

        {/* Status Update Actions */}
        {canEdit && invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h3>
            <div className="flex space-x-4">
              {invoice.status === InvoiceStatus.PENDING && (
                <button
                  onClick={() => onStatusUpdate(InvoiceStatus.SENT)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Icons.Mail />
                  <span className="ml-2">Mark as Sent</span>
                </button>
              )}
              
              <button
                onClick={() => onStatusUpdate(InvoiceStatus.PAID)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Icons.Check />
                <span className="ml-2">Mark as Paid</span>
              </button>
              
              <button
                onClick={() => onStatusUpdate(InvoiceStatus.CANCELLED)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Icons.X />
                <span className="ml-2">Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetailsView;