import React, { useEffect } from 'react';
import { Icons } from '../../../components/Icons/Icons';
import { ToastMessage } from '../types';

// Loading Skeleton Component
export const LoadingSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto space-y-6">
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Error Component
interface ErrorComponentProps {
  error: string;
  onRetry: () => void;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({ error, onRetry }) => (
  <div className="max-w-6xl mx-auto space-y-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-red-100 rounded-md">
          <Icons.Alert />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-red-800">Error Loading Settings</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
      >
        <Icons.Check />
        <span>Retry</span>
      </button>
    </div>
  </div>
);

// Toast Component
interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const bgColor = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2`}>
      <span>{toast.message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        <Icons.X />
      </button>
    </div>
  );
};

// Settings Footer Component
export const SettingsFooter: React.FC = () => (
  <div>
    {/* <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
        <p className="text-sm text-gray-500">
          Contact support if you need assistance configuring your system settings.
        </p>
      </div>
      <div className="flex space-x-3">
        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2">
          <Icons.Book />
          <span>Documentation</span>
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Icons.Chat />
          <span>Contact Support</span>
        </button>
      </div>
    </div> */}
  </div>
);