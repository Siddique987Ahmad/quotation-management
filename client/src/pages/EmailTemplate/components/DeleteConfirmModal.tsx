import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Shield } from 'lucide-react';

interface DeleteConfirmModalProps {
  templateKey: string;
  templateName?: string;
  isSystem?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  templateKey,
  templateName,
  isSystem = false,
  onClose,
  onConfirm,
  loading
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  
  const expectedText = `DELETE ${templateName || templateKey}`;
  
  const handleConfirmTextChange = (value: string) => {
    setConfirmText(value);
    setConfirmed(value === expectedText);
  };

  const handleConfirm = async () => {
    if (!confirmed || loading) return;
    
    console.log(`Confirming deletion of template: ${templateKey}`);
    await onConfirm();
  };

  // System templates cannot be deleted
  if (isSystem) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" size={20} />
              System Template Protected
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="text-blue-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cannot Delete System Template</h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  "{templateName || templateKey}" is a system template that cannot be deleted. 
                  System templates are essential for core functionality and are protected from deletion.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">What you can do instead:</h5>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Disable the template to stop it from being used</li>
                <li>• Modify the template content and sections</li>
                <li>• Duplicate it to create a custom version</li>
                <li>• Restore it to default settings if needed</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 className="text-red-600" size={20} />
            Delete Email Template
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">This action cannot be undone</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                You are about to permanently delete the email template "{templateName || templateKey}". 
                This will remove the template and all its configurations from the system.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-red-800 mb-2">What will be deleted:</h5>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Template configuration and sections</li>
              <li>• Subject line and content settings</li>
              <li>• All customizations made to this template</li>
              <li>• Template version history</li>
              <li>• Any metadata associated with this template</li>
            </ul>
          </div>

          {/* Template Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Template Details:</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span> 
                <span>{templateName || 'Unnamed Template'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Key:</span> 
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">{templateKey}</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span> 
                <span>Custom Template</span>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type: 
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono ml-1">{expectedText}</code>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => handleConfirmTextChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  confirmText && !confirmed ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={`Type "${expectedText}" to confirm`}
                disabled={loading}
                autoComplete="off"
                autoFocus
              />
              {confirmText && !confirmed && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Text doesn't match. Please type exactly: "{expectedText}"
                </p>
              )}
            </div>

            {confirmed && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Confirmation text matches. You can now delete the template.
              </div>
            )}
          </div>

          {/* Warning for potential impact */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <h6 className="font-medium text-yellow-800 mb-1">Important:</h6>
                <p className="text-yellow-700 text-sm">
                  If this template is currently being used by the system for automated emails, 
                  those emails may fail to send until a replacement template is configured.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            This action is permanent and cannot be undone
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!confirmed || loading}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;