import React from 'react';
import { Client } from '../../../types';
import { hasPermission } from '../../../utils/auth';
import { TableLoader } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  selectedClientIds: string[];
  onClientSelect: (clientId: string) => void;
  onSelectAll: () => void;
  onViewClient: (clientId: string) => void;
  onEditClient: (clientId: string) => void;
  onDeleteClient: (clientId: string) => void;
  pagination: any;
  onPageChange: (page: number) => void;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  loading,
  selectedClientIds,
  onClientSelect,
  onSelectAll,
  onViewClient,
  onEditClient,
  onDeleteClient,
  pagination,
  onPageChange
}) => {
  const canEdit = hasPermission('clients', 'update');
  const canDelete = hasPermission('clients', 'delete');

  if (loading) {
    return <TableLoader rows={5} columns={7} />;
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Icons.Building />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedClientIds.length === clients.length && clients.length > 0}
                  onChange={onSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client: Client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedClientIds.includes(client.id)}
                    onChange={() => onClientSelect(client.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {client.companyName[0]?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {client.companyName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.taxId && `Tax ID: ${client.taxId}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.contactPerson}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Icons.Mail />
                    <span className="ml-1">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="text-sm text-gray-500 flex items-center">
                      <Icons.Phone />
                      <span className="ml-1">{client.phone}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.city || client.state || client.country ? (
                    <div className="flex items-center">
                      <Icons.MapPin />
                      <span className="ml-1">
                        {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No location</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm">
                    {client.isActive ? (
                      <>
                        <div className="w-5 h-5 text-green-600 mr-2">
                          <Icons.CheckCircle />
                        </div>
                        <span className="text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 text-red-600 mr-2">
                          <Icons.XCircle />
                        </div>
                        <span className="text-red-600">Inactive</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="flex items-center">
                      <Icons.FileText />
                      <span className="ml-1">{(client as any).statistics?.totalQuotations || 0} quotes</span>
                    </div>
                    <div className="flex items-center">
                      <Icons.FileText />
                      <span className="ml-1">{(client as any).statistics?.totalInvoices || 0} invoices</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(client.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onViewClient(client.id)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View details"
                    >
                      <Icons.Eye />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEditClient(client.id)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit client"
                      >
                        <Icons.Edit />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete client"
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

      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.currentPage - 1) * pagination.limit) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, pagination.currentPage - 2);
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;