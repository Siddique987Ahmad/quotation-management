import React from 'react';
import { InvoiceFilters, InvoiceStatus, InvoiceType } from '../types';
import { Client, TaxPreset } from '../../../types';
import { hasPermission } from '../../../utils/auth';
import { Icons } from '../../../components/Icons/Icons';

interface InvoiceFiltersBarProps {
  searchQuery: string;
  filters: InvoiceFilters;
  clients: Client[];
  selectedInvoiceIds: string[];
  bulkLoading: boolean;
  taxPresets: TaxPreset[];
  onSearch: (query: string) => void;
  onFilterChange: (key: keyof InvoiceFilters, value: any) => void;
  onBulkAction: (action: 'send' | 'mark_paid' | 'cancel' | 'delete') => void;
  onBulkTaxUpdate: (gstPercentage: number, pstPercentage: number) => void;
}

const getTypeLabel = (type: InvoiceType): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const InvoiceFiltersBar: React.FC<InvoiceFiltersBarProps> = ({
  searchQuery,
  filters,
  clients,
  selectedInvoiceIds,
  bulkLoading,
  taxPresets,
  onSearch,
  onFilterChange,
  onBulkAction,
  onBulkTaxUpdate
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search invoices..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {(Object.values(InvoiceStatus) as InvoiceStatus[]).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange('type', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {(Object.values(InvoiceType) as InvoiceType[]).map(type => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </select>
          
          <select
            value={filters.clientId || ''}
            onChange={(e) => onFilterChange('clientId', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoiceIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedInvoiceIds.length} invoice(s) selected
            </span>
            <div className="flex gap-2 flex-wrap">
              {hasPermission('invoices', 'update') && (
                <>
                  <button
                    onClick={() => onBulkAction('send')}
                    disabled={bulkLoading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => onBulkAction('mark_paid')}
                    disabled={bulkLoading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => onBulkAction('cancel')}
                    disabled={bulkLoading}
                    className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-yellow-400"
                  >
                    Cancel
                  </button>
                </>
              )}
              {hasPermission('invoices', 'delete') && (
                <button
                  onClick={() => onBulkAction('delete')}
                  disabled={bulkLoading}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
                >
                  Delete
                </button>
              )}
              
              {/* Tax Rate Update Dropdown */}
              {hasPermission('invoices', 'update') && taxPresets.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const presetId = e.target.value;
                      if (presetId) {
                        const preset = taxPresets.find(p => p.id === presetId);
                        if (preset) {
                          onBulkTaxUpdate(preset.gstRate, preset.pstRate);
                        }
                      }
                    }}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Update Tax Rates</option>
                    {taxPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} (GST: {preset.gstRate}%, PST: {preset.pstRate}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceFiltersBar;