import React, { useState } from 'react';
import { Invoice, InvoiceStatus, TaxPreset } from '../../../types';
import { ButtonSpinner } from '../../../components/LoadingSpinner';
import { InvoiceFormData } from '../types';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface InvoiceEditFormProps {
  invoice: Invoice;
  taxPresets: TaxPreset[];
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const InvoiceEditForm: React.FC<InvoiceEditFormProps> = ({
  invoice,
  taxPresets,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    status: invoice.status,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    paidDate: invoice.paidDate ? new Date(invoice.paidDate).toISOString().split('T')[0] : '',
    gstPercentage: parseFloat(invoice.gstPercentage.toString()),
    pstPercentage: parseFloat(invoice.pstPercentage.toString())
  });

  const [errors, setErrors] = useState<string[]>([]);
  const {format}=useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
      validationErrors.push('GST percentage must be between 0 and 100');
    }

    if (formData.pstPercentage < 0 || formData.pstPercentage > 100) {
      validationErrors.push('PST percentage must be between 0 and 100');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit({
      status: formData.status,
      dueDate: formData.dueDate || undefined,
      paidDate: formData.paidDate || undefined,
      gstPercentage: formData.gstPercentage,
      pstPercentage: formData.pstPercentage
    });
  };

  const handleInputChange = (field: keyof InvoiceFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field.includes('Percentage') ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const applyTaxPreset = (preset: TaxPreset) => {
    setFormData(prev => ({
      ...prev,
      gstPercentage: preset.gstRate,
      pstPercentage: preset.pstRate
    }));
  };

  const calculateTotals = () => {
    const subtotal = parseFloat(invoice.subtotal.toString());
    const gstAmount = (subtotal * formData.gstPercentage) / 100;
    const pstAmount = (subtotal * formData.pstPercentage) / 100;
    const totalAmount = subtotal + gstAmount + pstAmount;
    return { gstAmount, pstAmount, totalAmount };
  };

  const { gstAmount, pstAmount, totalAmount } = calculateTotals();

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Edit Invoice #{invoice.invoiceNumber}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Update invoice information and tax rates
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status and Dates */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">Invoice Status & Dates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.values(InvoiceStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="paidDate" className="block text-sm font-medium text-gray-700 mb-2">
                Paid Date
              </label>
              <input
                type="date"
                id="paidDate"
                value={formData.paidDate}
                onChange={handleInputChange('paidDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tax Rates */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">Tax Rates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gstPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate (%)
              </label>
              <input
                type="number"
                id="gstPercentage"
                value={formData.gstPercentage}
                onChange={handleInputChange('gstPercentage')}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="pstPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                PST Rate (%)
              </label>
              <input
                type="number"
                id="pstPercentage"
                value={formData.pstPercentage}
                onChange={handleInputChange('pstPercentage')}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tax Presets */}
          {taxPresets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Apply Tax Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {taxPresets.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyTaxPreset(preset)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {preset.name} ({preset.gstRate}% + {preset.pstRate}%)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Updated Tax Calculation Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Updated Tax Calculation</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{format(parseFloat(invoice.subtotal.toString()))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST ({formData.gstPercentage}%):</span>
                <span>{format(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PST ({formData.pstPercentage}%):</span>
                <span>{format(pstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Tax:</span>
                <span>{format(gstAmount + pstAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-medium border-t pt-2">
                <span>New Total Amount:</span>
                <span>{format(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
          >
            {loading && <ButtonSpinner />}
            Update Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceEditForm;