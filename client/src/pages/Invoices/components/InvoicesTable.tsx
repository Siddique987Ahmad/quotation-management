import React from 'react';
import { Invoice, InvoiceStatus, InvoiceType, TaxPreset } from '../../../types';
import { hasPermission } from '../../../utils/auth';
import { TableLoader } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';
import PDFDownloadDropdown from './PDFDownloadDropdown';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface InvoicesTableProps {
  invoices: Invoice[];
  pagination: any;
  selectedIds: string[];
  loading: boolean;
  taxPresets: TaxPreset[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onStatusUpdate: (invoice: Invoice, status: InvoiceStatus) => void;
  onDownloadPDF: (invoice: Invoice, taxType: string, customGstRate?: number, customPstRate?: number) => void;
  onSendEmailWithTax: (invoice: Invoice, taxType: string, customGstRate?: number, customPstRate?: number) => void;
  onSelectionChange: (ids: string[]) => void;
  onPageChange: (page: number) => void;
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

const getTypeLabel = (type: InvoiceType): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  pagination,
  selectedIds,
  loading,
  taxPresets,
  onEdit,
  onView,
  onDelete,
  onStatusUpdate,
  onDownloadPDF,
  onSendEmailWithTax,
  onSelectionChange,
  onPageChange
}) => {
  const canEdit = hasPermission('invoices', 'update');
  const canDelete = hasPermission('invoices', 'delete');
  const {format} =useCurrency()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(invoices.map(inv => inv.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  if (loading) {
    return <TableLoader />;
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 text-center">
          <Icons.FileText />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">Invoices will appear here once quotations are approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === invoices.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(invoice.id)}
                    onChange={(e) => handleSelectOne(invoice.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTypeLabel(invoice.type)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {invoice.client?.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.client?.contactPerson}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>GST: {invoice.gstPercentage}%</div>
                  <div>PST: {invoice.pstPercentage}%</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {format(parseFloat(invoice.totalAmount.toString()))}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Icons.Eye />
                    </button>
                    
                    <div className="relative">
                      <PDFDownloadDropdown
                        invoice={invoice}
                        onDownloadWithTax={(taxType, gstRate, pstRate) => onDownloadPDF(invoice, taxType, gstRate, pstRate)}
                        onSendEmailWithTax={(taxType, gstRate, pstRate) => onSendEmailWithTax(invoice, taxType, gstRate, pstRate)}
                        taxPresets={taxPresets}
                      />
                    </div>
                    
                    {canEdit && invoice.status !== InvoiceStatus.PAID && (
                      <button
                        onClick={() => onEdit(invoice)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Icons.Edit />
                      </button>
                    )}
                    
                    {canDelete && invoice.status !== InvoiceStatus.PAID && (
                      <button
                        onClick={() => onDelete(invoice)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Icons.Trash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalCount}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTable;