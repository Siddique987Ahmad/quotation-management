import React from 'react';
import { Icons } from '../../../components/Icons/Icons';

interface SystemSettingsPageHeaderProps {
  unsavedChanges: boolean;
  saving: boolean;
  error: string | null;
  onDiscardChanges: () => void;
  onSaveSection: () => void;
  onSaveAll: () => void;
}

const SystemSettingsPageHeader: React.FC<SystemSettingsPageHeaderProps> = ({
  unsavedChanges,
  saving,
  error,
  onDiscardChanges,
  onSaveSection,
  onSaveAll
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your quotation management system settings
          </p>
        </div>
        {unsavedChanges && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-yellow-600 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Unsaved changes
            </span>
            <button
              onClick={onDiscardChanges}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center space-x-2"
            >
              <Icons.X />
              <span>Discard</span>
            </button>
            <button
              onClick={onSaveSection}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2"
            >
              {saving ? <Icons.Spinner /> : <Icons.Check />}
              <span>{saving ? 'Saving...' : 'Save Section'}</span>
            </button>
            <button
              onClick={onSaveAll}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2"
            >
              {saving ? <Icons.Spinner /> : <Icons.Check />}
              <span>{saving ? 'Saving...' : 'Save All'}</span>
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <Icons.Alert />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPageHeader;