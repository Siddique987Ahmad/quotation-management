import React from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { ClientFilters } from '../types';

interface ClientFiltersBarProps {
  searchQuery: string;
  filters: ClientFilters;
  selectedClientIds: string[];
  bulkLoading: boolean;
  onSearch: (query: string) => void;
  onFilterChange: (key: keyof ClientFilters, value: any) => void;
  onBulkAction: (action: 'activate' | 'deactivate' | 'delete') => void;
}

const ClientFiltersBar: React.FC<ClientFiltersBarProps> = ({
  searchQuery,
  filters,
  selectedClientIds,
  bulkLoading,
  onSearch,
  onFilterChange,
  onBulkAction
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
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
              placeholder="Search clients..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={filters.isActive === false ? 'inactive' : filters.isActive === true ? 'active' : ''}
            onChange={(e) => onFilterChange('isActive', 
              e.target.value === 'active' ? true : 
              e.target.value === 'inactive' ? false : undefined
            )}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedClientIds.length > 0 && (
        <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-md">
          <span className="text-sm text-blue-700">
            {selectedClientIds.length} client(s) selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onBulkAction('activate')}
              disabled={bulkLoading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
            <button
              onClick={() => onBulkAction('deactivate')}
              disabled={bulkLoading}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Deactivate
            </button>
            <button
              onClick={() => onBulkAction('delete')}
              disabled={bulkLoading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientFiltersBar;