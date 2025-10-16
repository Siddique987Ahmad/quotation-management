import React from 'react';
import { InvoiceSettings } from '../types';

interface InvoiceSettingsProps {
  settings: InvoiceSettings;
  onUpdate: (field: keyof InvoiceSettings, value: any) => void;
}

const InvoiceSettingsComponent: React.FC<InvoiceSettingsProps> = ({
  settings,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Due Days
          </label>
          <input
            type="number"
            min="0"
            max="365"
            value={settings.defaultDueDays}
            onChange={(e) => onUpdate('defaultDueDays', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms
          </label>
          <select
            value={settings.defaultPaymentTerms}
            onChange={(e) => onUpdate('defaultPaymentTerms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Net 30 Days">Net 30 Days</option>
            <option value="Net 15 Days">Net 15 Days</option>
            <option value="Net 7 Days">Net 7 Days</option>
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Number Prefix
          </label>
          <input
            type="text"
            value={settings.sequencePrefix}
            onChange={(e) => onUpdate('sequencePrefix', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="INV-"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Starting Number
          </label>
          <input
            type="number"
            min="1"
            max="999999"
            value={settings.startingNumber}
            onChange={(e) => onUpdate('startingNumber', parseInt(e.target.value) || 1000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invoice Footer Text
        </label>
        <textarea
          value={settings.footerText}
          onChange={(e) => onUpdate('footerText', e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Thank you for your business!"
        />
        <p className="text-xs text-gray-500 mt-1">
          {settings.footerText.length}/500 characters
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Automation Settings</h4>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.autoGenerateOnApproval}
            onChange={(e) => onUpdate('autoGenerateOnApproval', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Auto-generate invoices when quotations are approved</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.autoSendEmail}
            onChange={(e) => onUpdate('autoSendEmail', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Auto-send invoices via email</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.includeCompanyLogo}
            onChange={(e) => onUpdate('includeCompanyLogo', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Include company logo in invoices</span>
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-800 mb-2">Preview</h5>
        <p className="text-sm text-yellow-700 mb-2">
          Next invoice number: <strong>{settings.sequencePrefix}{settings.startingNumber}</strong>
        </p>
        <p className="text-sm text-yellow-700">
          Payment terms: <strong>{settings.defaultPaymentTerms}</strong>
        </p>
      </div>
    </div>
  );
};

export default InvoiceSettingsComponent;