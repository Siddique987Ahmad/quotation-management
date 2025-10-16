import React from 'react';
import { SecuritySettings } from '../types';

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onUpdate: (field: keyof SecuritySettings, value: any) => void;
}

const SecuritySettingsComponent: React.FC<SecuritySettingsProps> = ({
  settings,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="480"
            value={settings.sessionTimeout}
            onChange={(e) => onUpdate('sessionTimeout', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
          <p className="text-xs text-gray-500 mt-1">Between 5 and 480 minutes</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            min="6"
            max="50"
            value={settings.passwordMinLength}
            onChange={(e) => onUpdate('passwordMinLength', parseInt(e.target.value) || 8)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8"
          />
          <p className="text-xs text-gray-500 mt-1">Between 6 and 50 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.maxLoginAttempts}
            onChange={(e) => onUpdate('maxLoginAttempts', parseInt(e.target.value) || 5)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5"
          />
          <p className="text-xs text-gray-500 mt-1">Between 1 and 20 attempts</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Security Policies</h4>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.requireStrongPasswords}
            onChange={(e) => onUpdate('requireStrongPasswords', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Require strong passwords (uppercase, lowercase, numbers, symbols)
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enableTwoFactor}
            onChange={(e) => onUpdate('enableTwoFactor', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Enable two-factor authentication</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.allowPasswordReset}
            onChange={(e) => onUpdate('allowPasswordReset', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Allow password reset via email</span>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h5 className="font-medium text-amber-800 mb-2">Security Recommendations</h5>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Enable strong password requirements for better security</li>
          <li>• Set session timeout to 30 minutes or less for sensitive environments</li>
          <li>• Consider enabling two-factor authentication for admin users</li>
          <li>• Regularly review login attempts and user access</li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettingsComponent;