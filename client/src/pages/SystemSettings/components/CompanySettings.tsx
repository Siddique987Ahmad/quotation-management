import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { Icons } from '../../../components/Icons/Icons';
import { settingsAPI, handleApiError } from '../../../services/api';
// Remove the useCompany import since we don't need it anymore
// import { useCompany } from '../../../contexts/CompanyContext';

interface CompanySettingsProps {
  settings: CompanySettings;
  onUpdate: (field: keyof CompanySettings, value: any) => void;
}

const CompanySettingsComponent: React.FC<CompanySettingsProps> = ({
  settings,
  onUpdate
}) => {
  // Remove the useCompany hook since we don't need it
  // const { refreshCompanySettings } = useCompany();
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await settingsAPI.uploadLogo(formData);
      
      if (response.data.success && response.data.data?.logoPath) {
        // Only update local state - parent component will handle the rest
        onUpdate('logo', response.data.data.logoPath);
        // DON'T call refreshCompanySettings() - it's redundant!
        console.log('Logo uploaded successfully');
      } else {
        setUploadError('Upload failed: No logo path received from server');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setUploadError(errorMessage);
      console.error('Logo upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings.logo) return;

    try {
      const response = await settingsAPI.deleteLogo();
      if (response.data.success) {
        // Only update local state - no need for additional API call
        onUpdate('logo', '');
        // DON'T call refreshCompanySettings() - it's redundant!
      } else {
        setUploadError('Failed to delete logo: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setUploadError(errorMessage);
      console.error('Logo deletion failed:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Clean up the logo URL function
  const getLogoUrl = (logoPath: string) => {
    if (!logoPath) return null;
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://148.230.82.188:5000';
    return `${baseUrl}${logoPath}`;
  };

  const logoUrl = getLogoUrl(settings.logo);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Name *
        </label>
        <input
          type="text"
          value={settings.name || ''}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your Company Name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={settings.email || ''}
          onChange={(e) => onUpdate('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="company@example.com"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <input
          type="text"
          value={settings.address || ''}
          onChange={(e) => onUpdate('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123 Business Street"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <input
          type="text"
          value={settings.city || ''}
          onChange={(e) => onUpdate('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="City"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State/Province
        </label>
        <input
          type="text"
          value={settings.state || ''}
          onChange={(e) => onUpdate('state', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="State"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ZIP/Postal Code
        </label>
        <input
          type="text"
          value={settings.zipCode || ''}
          onChange={(e) => onUpdate('zipCode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="12345"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country
        </label>
        <select
          value={settings.country || 'Pakistan'}
          onChange={(e) => onUpdate('country', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Pakistan">Pakistan</option>
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Australia">Australia</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={settings.phone || ''}
          onChange={(e) => onUpdate('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+92 (300) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website
        </label>
        <input
          type="url"
          value={settings.website || ''}
          onChange={(e) => onUpdate('website', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://www.yourcompany.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tax ID
        </label>
        <input
          type="text"
          value={settings.taxId || ''}
          onChange={(e) => onUpdate('taxId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tax Identification Number"
        />
      </div>

      {/* Logo Upload Section */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Logo
        </label>
        
        {/* Display current logo */}
        {logoUrl && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback text-gray-400 text-xs flex items-center justify-center w-full h-full';
                        fallback.innerHTML = '<span>Logo not found</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Logo</p>
                  <p className="text-xs text-gray-500">Click upload to replace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeleteLogo}
                className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                title="Delete logo"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                <p className="text-sm text-gray-600">Uploading logo...</p>
              </>
            ) : (
              <>
                <Icons.Upload />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload logo or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WebP up to 2MB
                </p>
              </>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <Icons.AlertCircle />
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsComponent;