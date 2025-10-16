import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { QuotationFilters } from '../types';
import { QuotationStatus, Client } from '../../../types';
import { hasPermission } from '../../../utils/auth';

interface QuotationFiltersBarProps {
  searchQuery: string;
  filters: QuotationFilters;
  clients: Client[];
  selectedQuotationIds: string[];
  bulkLoading: boolean;
  onSearch: (query: string) => void;
  onFilterChange: (key: keyof QuotationFilters, value: any) => void;
  onBulkAction: (action: 'approve' | 'reject' | 'delete') => void;
}

const QuotationFiltersBar: React.FC<QuotationFiltersBarProps> = ({
  searchQuery,
  filters,
  clients,
  selectedQuotationIds,
  bulkLoading,
  onSearch,
  onFilterChange,
  onBulkAction
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="w-5 h-5 text-gray-400">
                <Icons.Search />
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search quotations..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex gap-2">
          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.values(QuotationStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          {/* Client Filter */}
          <select
            value={filters.clientId || ''}
            onChange={(e) => onFilterChange('clientId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Clients</option>
            {Array.isArray(clients) && clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedQuotationIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedQuotationIds.length} quotation(s) selected
            </span>
            <div className="flex gap-2">
              {hasPermission('quotations', 'approve') && (
                <>
                  <button
                    onClick={() => onBulkAction('approve')}
                    disabled={bulkLoading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onBulkAction('reject')}
                    disabled={bulkLoading}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
                  >
                    Reject
                  </button>
                </>
              )}
              {hasPermission('quotations', 'delete') && (
                <button
                  onClick={() => onBulkAction('delete')}
                  disabled={bulkLoading}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationFiltersBar;