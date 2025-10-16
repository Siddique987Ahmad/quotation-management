import React, { useState } from 'react';
import { Invoice, TaxPreset } from '../../../types';
import { Icons } from '../../../components/Icons/Icons';
import { INVOICE_TAX_TYPES } from '../types';

interface PDFDownloadDropdownProps {
  invoice: Invoice;
  taxPresets: TaxPreset[];
  loading?: boolean;
  onDownloadWithTax: (taxType: string, customGstRate?: number, customPstRate?: number) => void;
  onSendEmailWithTax: (taxType: string, customGstRate?: number, customPstRate?: number) => void;
}

const PDFDownloadDropdown: React.FC<PDFDownloadDropdownProps> = ({
  invoice,
  taxPresets,
  loading = false,
  onDownloadWithTax,
  onSendEmailWithTax
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomRates, setShowCustomRates] = useState(false);
  const [customGstRate, setCustomGstRate] = useState(invoice.gstPercentage || 0);
  const [customPstRate, setCustomPstRate] = useState(invoice.pstPercentage || 0);

  const handlePresetDownload = (taxType: string, gstRate?: number, pstRate?: number) => {
    onDownloadWithTax(taxType, gstRate, pstRate);
    setIsOpen(false);
  };

  const handleCustomDownload = (taxType: string) => {
    onDownloadWithTax(taxType, customGstRate, customPstRate);
    setIsOpen(false);
    setShowCustomRates(false);
  };

  const handleEmailAndDownload = (taxType: string, gstRate?: number, pstRate?: number) => {
    onDownloadWithTax(taxType, gstRate, pstRate);
    onSendEmailWithTax(taxType, gstRate, pstRate);
    setIsOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setShowCustomRates(false);
  };

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
          <div className="fixed inset-0 z-10" onClick={closeDropdown} />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {!showCustomRates ? (
                <>
                  {/* Current Invoice Tax Rates */}
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Invoice</div>
                    <div className="text-sm text-gray-700 mt-1">
                      GST: {invoice.gstPercentage}% | PST: {invoice.pstPercentage}%
                    </div>
                  </div>

                  {/* Quick Options */}
                  <button
                    onClick={() => handlePresetDownload(INVOICE_TAX_TYPES.NO_TAX, 0, 0)}
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  >
                    <Icons.Download />
                    <span className="ml-3">No Tax (0%)</span>
                  </button>

                  <button
                    onClick={() => handlePresetDownload(INVOICE_TAX_TYPES.GST_ONLY, invoice.gstPercentage, 0)}
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  >
                    <Icons.Download />
                    <span className="ml-3">GST Only ({invoice.gstPercentage}%)</span>
                  </button>

                  <button
                    onClick={() => handlePresetDownload(INVOICE_TAX_TYPES.PST_ONLY, 0, invoice.pstPercentage)}
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  >
                    <Icons.Download />
                    <span className="ml-3">PST Only ({invoice.pstPercentage}%)</span>
                  </button>

                  <button
                    onClick={() => handlePresetDownload(INVOICE_TAX_TYPES.GST_AND_PST, invoice.gstPercentage, invoice.pstPercentage)}
                    className="group flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-900 w-full text-left font-medium"
                  >
                    <Icons.Download />
                    <span className="ml-3">Both Taxes ({invoice.gstPercentage}% + {invoice.pstPercentage}%)</span>
                  </button>

                  <hr className="my-1" />

                  {/* Tax Presets */}
                  {/* {taxPresets.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tax Presets</div>
                      </div>
                      {taxPresets.slice(0, 5).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetDownload(INVOICE_TAX_TYPES.GST_AND_PST, preset.gstRate, preset.pstRate)}
                          className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                        >
                          <Icons.Calculator />
                          <div className="ml-3">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-gray-500">GST: {preset.gstRate}% | PST: {preset.pstRate}%</div>
                          </div>
                        </button>
                      ))}
                      <hr className="my-1" />
                    </>
                  )} */}

                  {/* Custom Rates Option */}
                  <button
                    onClick={() => setShowCustomRates(true)}
                    className="group flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-900 w-full text-left font-medium"
                  >
                    <Icons.Settings />
                    <span className="ml-3">Custom Tax Rates</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Custom Rates Form */}
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom Tax Rates</div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={customGstRate}
                        onChange={(e) => setCustomGstRate(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={customPstRate}
                        onChange={(e) => setCustomPstRate(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs font-medium text-gray-500 mb-2">Preview</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST ({customGstRate}%):</span>
                          <span>${(parseFloat(invoice.subtotal.toString()) * customGstRate / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PST ({customPstRate}%):</span>
                          <span>${(parseFloat(invoice.subtotal.toString()) * customPstRate / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total:</span>
                          <span>${(parseFloat(invoice.subtotal.toString()) * (1 + (customGstRate + customPstRate) / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Email & Download Combined Options */}
                    <div className="border-t pt-3 mt-3">
                      <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Email & Download</div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleEmailAndDownload(INVOICE_TAX_TYPES.NO_TAX, 0, 0)}
                          className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                          disabled={!invoice.client?.email}
                        >
                          📧 Email & Download - No Tax
                        </button>

                        <button
                          onClick={() => handleEmailAndDownload(INVOICE_TAX_TYPES.GST_ONLY, customGstRate, 0)}
                          className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                          disabled={!invoice.client?.email}
                        >
                          📧 Email & Download - GST Only ({customGstRate}%)
                        </button>

                        <button
                          onClick={() => handleEmailAndDownload(INVOICE_TAX_TYPES.PST_ONLY, 0, customPstRate)}
                          className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                          disabled={!invoice.client?.email}
                        >
                          📧 Email & Download - PST Only ({customPstRate}%)
                        </button>

                        <button
                          onClick={() => handleEmailAndDownload(INVOICE_TAX_TYPES.GST_AND_PST, customGstRate, customPstRate)}
                          className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                          disabled={!invoice.client?.email}
                        >
                          📧 Email & Download - Both Taxes ({customGstRate}% + {customPstRate}%)
                        </button>
                      </div>
                      
                      {!invoice.client?.email && (
                        <p className="text-xs text-red-600 mt-2 text-center">Client email not available</p>
                      )}
                    </div>

                    <button
                      onClick={() => setShowCustomRates(false)}
                      className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Back to Presets
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFDownloadDropdown;