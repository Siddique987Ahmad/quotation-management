import React, { useState } from 'react';
import { X, Settings, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { EmailTemplate } from '../../../types';

interface BulkActionsModalProps {
  selectedTemplates: string[];
  templates: Record<string, EmailTemplate>;
  onClose: () => void;
  onAction: (action: string, templateKeys: string[]) => Promise<void>;
  loading: boolean;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({
  selectedTemplates,
  templates,
  onClose,
  onAction,
  loading
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Get selected template details
  const selectedTemplateData = selectedTemplates
    .map(key => templates[key])
    .filter(Boolean); // Remove any undefined templates

  const systemTemplates = selectedTemplateData.filter(t => t.isSystem);
  const customTemplates = selectedTemplateData.filter(t => !t.isSystem);
  const enabledTemplates = selectedTemplateData.filter(t => t.enabled);
  const disabledTemplates = selectedTemplateData.filter(t => !t.enabled);

  // Available actions based on selection
  const actions = [
    {
      id: 'enable',
      label: 'Enable Templates',
      description: `Enable ${disabledTemplates.length} disabled template(s)`,
      icon: Eye,
      color: 'green',
      available: disabledTemplates.length > 0,
      dangerous: false
    },
    {
      id: 'disable', 
      label: 'Disable Templates',
      description: `Disable ${enabledTemplates.length} enabled template(s)`,
      icon: EyeOff,
      color: 'yellow',
      available: enabledTemplates.length > 0,
      dangerous: false
    },
    {
      id: 'delete',
      label: 'Delete Templates',
      description: `Delete ${customTemplates.length} custom template(s)${systemTemplates.length > 0 ? ` (${systemTemplates.length} system templates will be skipped)` : ''}`,
      icon: Trash2,
      color: 'red',
      available: customTemplates.length > 0,
      dangerous: true
    }
  ];

  const availableActions = actions.filter(action => action.available);

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId);
    const action = actions.find(a => a.id === actionId);
    setConfirmAction(action?.dangerous || false);
    setConfirmText('');
  };

  const getConfirmationText = (actionId: string): string => {
    switch (actionId) {
      case 'delete':
        return `DELETE ${customTemplates.length} TEMPLATES`;
      case 'enable':
        return `ENABLE ${disabledTemplates.length} TEMPLATES`;
      case 'disable':
        return `DISABLE ${enabledTemplates.length} TEMPLATES`;
      default:
        return '';
    }
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    const action = actions.find(a => a.id === selectedAction);
    if (action?.dangerous && confirmText !== getConfirmationText(selectedAction)) {
      return;
    }

    // For delete action, only pass custom template keys (system templates can't be deleted)
    const targetTemplates = selectedAction === 'delete' 
      ? customTemplates.map(t => t.templateKey)
      : selectedTemplates;

    console.log(`Executing bulk action: ${selectedAction} on templates:`, targetTemplates);
    await onAction(selectedAction, targetTemplates);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-orange-600" size={24} />
            Bulk Actions ({selectedTemplates.length} selected)
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Selection Summary */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Selected Templates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-800">Total Selected</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{selectedTemplates.length}</div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-800">System Templates</span>
                </div>
                <div className="text-2xl font-bold text-gray-600">{systemTemplates.length}</div>
                <div className="text-xs text-gray-500 mt-1">Protected from deletion</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-green-600" />
                  <span className="font-medium text-green-800">Enabled</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{enabledTemplates.length}</div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff size={16} className="text-yellow-600" />
                  <span className="font-medium text-yellow-800">Disabled</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{disabledTemplates.length}</div>
              </div>
            </div>
          </div>

          {/* Template List */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Selected Templates:</h4>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
              {selectedTemplateData.map((template, index) => (
                <div key={template.templateKey} className={`p-3 flex items-center justify-between ${
                  index < selectedTemplateData.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{template.name}</span>
                      <span className="text-gray-500 text-sm">({template.templateKey})</span>
                    </div>
                    {template.description && (
                      <div className="text-xs text-gray-500 mt-1 truncate">{template.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {template.isSystem && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">System</span>
                    )}
                    {!template.enabled && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">Disabled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Choose Action:</h4>
            
            {availableActions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Settings size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No actions available for the current selection.</p>
                <p className="text-sm mt-2">
                  {systemTemplates.length === selectedTemplates.length 
                    ? 'System templates cannot be deleted and are all enabled.'
                    : 'All selected templates are in the same state.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action.id)}
                      className={`w-full p-4 border rounded-lg text-left transition-colors ${
                        isSelected
                          ? `border-${action.color}-500 bg-${action.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-3">
                        <Icon 
                          size={20} 
                          className={isSelected ? `text-${action.color}-600` : 'text-gray-500'} 
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${
                            isSelected ? `text-${action.color}-900` : 'text-gray-900'
                          }`}>
                            {action.label}
                          </div>
                          <div className={`text-sm ${
                            isSelected ? `text-${action.color}-700` : 'text-gray-600'
                          }`}>
                            {action.description}
                          </div>
                        </div>
                        {action.dangerous && (
                          <AlertTriangle size={16} className="text-red-500 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirmation for Dangerous Actions */}
          {confirmAction && selectedAction && (
            <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h5 className="font-medium text-red-800">Confirm Dangerous Action</h5>
                  <p className="text-red-700 text-sm mt-1">
                    This action cannot be undone. Please type the confirmation text below.
                  </p>
                  {selectedAction === 'delete' && systemTemplates.length > 0 && (
                    <p className="text-red-600 text-sm mt-2 bg-red-100 p-2 rounded border">
                      Note: {systemTemplates.length} system template{systemTemplates.length !== 1 ? 's' : ''} will be skipped and not deleted.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Type: <code className="bg-red-100 px-2 py-1 rounded text-sm">{getConfirmationText(selectedAction)}</code>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={`Type "${getConfirmationText(selectedAction)}" to confirm`}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
            {customTemplates.length < selectedTemplates.length && (
              <span className="block text-xs mt-1 text-orange-600">
                {systemTemplates.length} system template{systemTemplates.length !== 1 ? 's' : ''} cannot be deleted
              </span>
            )}
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
              disabled={
                loading || 
                !selectedAction || 
                (confirmAction && confirmText !== getConfirmationText(selectedAction)) ||
                (selectedAction === 'delete' && customTemplates.length === 0)
              }
              className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedAction === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700'
                  : selectedAction === 'enable'
                  ? 'bg-green-600 hover:bg-green-700'
                  : selectedAction === 'disable'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {selectedAction === 'delete' && <Trash2 size={16} />}
                  {selectedAction === 'enable' && <Eye size={16} />}
                  {selectedAction === 'disable' && <EyeOff size={16} />}
                  {selectedAction === 'delete' && 'Delete Templates'}
                  {selectedAction === 'enable' && 'Enable Templates'}
                  {selectedAction === 'disable' && 'Disable Templates'}
                  {!selectedAction && 'Select Action'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal;