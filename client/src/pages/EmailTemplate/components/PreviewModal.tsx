import React from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';

interface PreviewModalProps {
  preview: {
    subject: string;
    html: string;
    text?: string;
  };
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ preview, onClose }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');
  const [contentType, setContentType] = React.useState<'html' | 'text'>('html');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded ${
                  viewMode === 'desktop' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Desktop View"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded ${
                  viewMode === 'mobile' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Mobile View"
              >
                <Smartphone size={16} />
              </button>
            </div>

            {/* Content Type Toggle */}
            <div className="flex items-center bg-gray-200 rounded p-1">
              <button
                onClick={() => setContentType('html')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  contentType === 'html' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setContentType('text')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  contentType === 'text' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Text
              </button>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Subject Line */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-sm text-gray-600 mb-1">Subject:</div>
          <div className="text-gray-900 font-medium">{preview.subject}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {contentType === 'html' ? (
            <div className={`h-full flex justify-center bg-gray-100 p-4 ${
              viewMode === 'mobile' ? 'px-4' : 'px-8'
            }`}>
              <div className={`bg-white shadow-lg ${
                viewMode === 'mobile' ? 'w-full max-w-sm' : 'w-full max-w-4xl'
              }`}>
                <iframe
                  srcDoc={preview.html}
                  className="w-full h-96 border-0"
                  title="Email Preview"
                  style={{ 
                    minHeight: '600px',
                    transform: viewMode === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                    transformOrigin: 'top left'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-96 overflow-auto p-6 bg-gray-50">
              <div className={`bg-white p-4 rounded border font-mono text-sm whitespace-pre-wrap ${
                viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-4xl mx-auto'
              }`}>
                {preview.text || 'Text version not available'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;