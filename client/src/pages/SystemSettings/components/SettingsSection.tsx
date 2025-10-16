import React from 'react';

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon,
  title,
  description,
  children,
  isActive,
  onClick
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={onClick}
      className={`w-full px-6 py-4 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-blue-200' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className={`transform transition-transform ${isActive ? 'rotate-90' : ''}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
    {isActive && (
      <div className="px-6 py-6 bg-gray-50">
        {children}
      </div>
    )}
  </div>
);

export default SettingsSection;