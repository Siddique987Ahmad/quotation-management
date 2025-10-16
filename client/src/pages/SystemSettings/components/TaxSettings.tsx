import React from 'react';
import { TaxSettings } from '../types';

interface TaxSettingsProps {
  settings: TaxSettings;
  onUpdate: (field: keyof TaxSettings, value: any) => void;
}

const TaxSettingsComponent: React.FC<TaxSettingsProps> = ({
  settings,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default GST Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.defaultGstRate}
            onChange={(e) => onUpdate('defaultGstRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default PST Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.defaultPstRate}
            onChange={(e) => onUpdate('defaultPstRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="7.00"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Tax Configuration</h4>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enableAutoTaxCalculation}
            onChange={(e) => onUpdate('enableAutoTaxCalculation', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Enable automatic tax calculation</span>
        </label>

        {/* <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.taxExemptByDefault}
            onChange={(e) => onUpdate('taxExemptByDefault', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Tax exempt by default</span>
        </label> */}

        {/* <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.requireTaxId}
            onChange={(e) => onUpdate('requireTaxId', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Require tax ID for clients</span>
        </label> */}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">Tax Rate Information</h5>
        <p className="text-sm text-blue-700">
          GST (Goods and Services Tax) and PST (Provincial Sales Tax) rates vary by region. 
          Please consult with your tax advisor to ensure you're using the correct rates for your jurisdiction.
        </p>
      </div>
    </div>
  );
};

export default TaxSettingsComponent;