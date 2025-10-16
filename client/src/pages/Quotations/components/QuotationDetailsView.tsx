import React, { useState } from 'react';
import { Quotation, QuotationStatus } from '../../../types';
import { hasPermission, getUserDisplayName } from '../../../utils/auth';
import { CardSpinner, ButtonSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface QuotationDetailsViewProps {
  quotation: Quotation | null;
  loading: boolean;
  error: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onStatusUpdate: (status: QuotationStatus) => void;
  onDownloadPDF: (includeTax?: boolean) => void;
  onDownloadBothPDFs: () => void;
  onSendEmail: () => void;
  actionLoading?: boolean;
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

const getStatusColor = (status: QuotationStatus): string => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-red-100 text-red-600'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// NEW: Function to determine tax breakdown for display
const getTaxBreakdown = (quotation: Quotation) => {
  const gstPercentage = quotation.gstPercentage ? parseFloat(quotation.gstPercentage.toString()) : 0;
  const pstPercentage = quotation.pstPercentage ? parseFloat(quotation.pstPercentage.toString()) : 0;
  const gstAmount = quotation.gstAmount ? parseFloat(quotation.gstAmount.toString()) : 0;
  const pstAmount = quotation.pstAmount ? parseFloat(quotation.pstAmount.toString()) : 0;
  
  // Legacy tax data for backward compatibility
  const legacyTaxPercentage = quotation.taxPercentage ? parseFloat(quotation.taxPercentage.toString()) : 0;
  const legacyTaxAmount = quotation.taxAmount ? parseFloat(quotation.taxAmount.toString()) : 0;

  // Determine tax type based on available data
  const hasGST = gstPercentage > 0;
  const hasPST = pstPercentage > 0;
  const hasLegacyTax = legacyTaxPercentage > 0 && !hasGST && !hasPST;

  return {
    hasGST,
    hasPST,
    hasLegacyTax,
    gstPercentage,
    pstPercentage,
    gstAmount,
    pstAmount,
    legacyTaxPercentage,
    legacyTaxAmount,
    totalTax: gstAmount + pstAmount || legacyTaxAmount,
    taxationType: hasGST && hasPST ? 'both' : hasGST ? 'gst' : hasPST ? 'pst' : hasLegacyTax ? 'legacy' : 'none'
  };
};

// PDF Download Dropdown Component
interface PDFDownloadDropdownProps {
  quotation: Quotation;
  onDownloadWithTax: () => void;
  onDownloadWithoutTax: () => void;
  onDownloadBoth: () => void;
  loading?: boolean;
}

const PDFDownloadDropdown: React.FC<PDFDownloadDropdownProps> = ({
  quotation,
  onDownloadWithTax,
  onDownloadWithoutTax,
  onDownloadBoth,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100"
      >
        <Icons.Download />
        <span className="ml-2">PDF</span>
        <Icons.ChevronDown />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={() => {
                  onDownloadWithTax();
                  setIsOpen(false);
                }}
                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              >
                <Icons.Download2 />
                <span className="ml-3">Download with Tax</span>
              </button>
              
              <button
                onClick={() => {
                  onDownloadWithoutTax();
                  setIsOpen(false);
                }}
                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              >
                <Icons.Download2 />
                <span className="ml-3">Download without Tax</span>
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={() => {
                  onDownloadBoth();
                  setIsOpen(false);
                }}
                className="group flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 w-full text-left font-medium"
              >
                <Icons.Download />
                <span className="ml-3">Download Both Versions</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const QuotationDetailsView: React.FC<QuotationDetailsViewProps> = ({
  quotation,
  loading,
  error,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusUpdate,
  onDownloadPDF,
  onDownloadBothPDFs,
  onSendEmail,
  actionLoading = false
}) => {
  const canEdit = hasPermission('quotations', 'update');
  const canDelete = hasPermission('quotations', 'delete');
  const canApprove = hasPermission('quotations', 'approve');
  const { format } = useCurrency();


  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <CardSpinner text="Loading quotation details..." />
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

  if (!quotation) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900">Quotation not found</h3>
        <p className="text-sm text-gray-500 mt-1">
          The quotation you're looking for doesn't exist or you don't have permission to view it.
        </p>
      </div>
    );
  }

  const renderDynamicFields = () => {
    if (!quotation.formData || Object.keys(quotation.formData).length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Custom Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(quotation.formData).map(([key, value]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              <div className="text-sm text-gray-900">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value?.toString() || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // NEW: Enhanced financial summary with specific tax breakdown
  const renderFinancialSummary = () => {
    const taxBreakdown = getTaxBreakdown(quotation);
    const subtotalAmount = parseFloat(quotation.subtotal.toString());
    const totalAmount = parseFloat(quotation.totalAmount.toString());

    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Subtotal:</span>
            <span className="text-sm text-gray-900">{format(subtotalAmount)}</span>
          </div>
          
          {/* Tax Breakdown - Show specific taxes based on what was selected */}
          {taxBreakdown.taxationType === 'gst' && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">GST ({taxBreakdown.gstPercentage}%):</span>
              <span className="text-sm text-gray-900">{format(taxBreakdown.gstAmount)}</span>
            </div>
          )}
          
          {taxBreakdown.taxationType === 'pst' && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">PST ({taxBreakdown.pstPercentage}%):</span>
              <span className="text-sm text-gray-900">{format(taxBreakdown.pstAmount)}</span>
            </div>
          )}
          
          {taxBreakdown.taxationType === 'both' && (
            <>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">GST ({taxBreakdown.gstPercentage}%):</span>
                <span className="text-sm text-gray-900">{format(taxBreakdown.gstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">PST ({taxBreakdown.pstPercentage}%):</span>
                <span className="text-sm text-gray-900">{format(taxBreakdown.pstAmount)}</span>
              </div>
            </>
          )}
          
          {taxBreakdown.taxationType === 'legacy' && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Tax ({taxBreakdown.legacyTaxPercentage}%):</span>
              <span className="text-sm text-gray-900">{format(taxBreakdown.legacyTaxAmount)}</span>
            </div>
          )}
          
          {/* Show total tax if multiple taxes */}
          {(taxBreakdown.taxationType === 'both') && taxBreakdown.totalTax > 0 && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-medium text-gray-700">Total Tax:</span>
              <span className="text-gray-900">{format(taxBreakdown.totalTax)}</span>
            </div>
          )}
          
          {/* No tax message */}
          {taxBreakdown.taxationType === 'none' && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Tax:</span>
              <span className="text-sm text-gray-500 italic">No tax applied</span>
            </div>
          )}
          
          {/* Total Amount */}
          <div className="flex justify-between text-lg font-medium border-t pt-3">
            <span>Total Amount:</span>
            <span>{format(totalAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {quotation.title}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500">
                #{quotation.quotationNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                {quotation.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <PDFDownloadDropdown
              quotation={quotation}
              onDownloadWithTax={() => onDownloadPDF(true)}
              onDownloadWithoutTax={() => onDownloadPDF(false)}
              onDownloadBoth={() => onDownloadBothPDFs()}
              loading={actionLoading}
            />
            
            {canEdit && quotation.status !== QuotationStatus.APPROVED && (
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Icons.Edit />
                <span className="ml-2">Edit</span>
              </button>
            )}
            
            <button
              onClick={onDuplicate}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icons.Copy />
              <span className="ml-2">Duplicate</span>
            </button>

            {quotation.client?.email && (
              <button
                onClick={() => onSendEmail()}
                className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Icons.Mail />
                <span className="ml-2">Send Email</span>
              </button>
            )}
            
            {canDelete && quotation.status !== QuotationStatus.APPROVED && (
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

        {/* Show email status if email was sent */}
        {quotation.emailSent && (
          <div className="text-sm text-green-600 mt-2">
            ✓ Email sent on {quotation.emailSentAt ? new Date(quotation.emailSentAt).toLocaleString() : 'Unknown date'}
          </div>
        )}
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
                <span className="ml-2 text-sm text-gray-900">{quotation.client?.companyName}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Contact:</span>
                <span className="ml-2 text-sm text-gray-900">{quotation.client?.contactPerson}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{quotation.client?.email}</span>
              </div>
              {quotation.client?.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-sm text-gray-900">{quotation.client.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quotation Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-sm text-gray-900">{formatDate(quotation.createdAt)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Created By:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {quotation.user ? getUserDisplayName(quotation.user) : 'Unknown'}
                </span>
              </div>
              {quotation.validUntil && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Valid Until:</span>
                  <span className="ml-2 text-sm text-gray-900">{formatDate(quotation.validUntil)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {quotation.description && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {quotation.description}
            </p>
          </div>
        )}

        {/* Dynamic Fields */}
        {renderDynamicFields()}

        {/* UPDATED: Enhanced Financial Summary */}
        {renderFinancialSummary()}

        {/* Notes */}
        {quotation.notes && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {quotation.notes}
            </p>
          </div>
        )}

        {/* Status Update Actions */}
        {canApprove && quotation.status === QuotationStatus.PENDING && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => onStatusUpdate(QuotationStatus.APPROVED)}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400"
              >
                {actionLoading && <ButtonSpinner />}
                <Icons.Check />
                <span className="ml-2">Approve</span>
              </button>
              <button
                onClick={() => onStatusUpdate(QuotationStatus.REJECTED)}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              >
                {actionLoading && <ButtonSpinner />}
                <Icons.X />
                <span className="ml-2">Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Related Invoices */}
        {quotation.invoices && quotation.invoices.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Related Invoices</h3>
            <div className="space-y-2">
              {quotation.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">#{invoice.invoiceNumber}</span>
                    <span className="ml-2 text-sm text-gray-500">({invoice.type.replace(/_/g, ' ')})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status as any)}`}>
                      {invoice.status}
                    </span>
                    <span className="text-sm text-gray-900">{formatCurrency(parseFloat(invoice.totalAmount.toString()))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetailsView;