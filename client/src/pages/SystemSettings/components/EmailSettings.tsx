import React from 'react';
import { EmailSettings } from '../types';
import { Icons } from '../../../components/Icons/Icons';

interface EmailSettingsProps {
  settings: EmailSettings;
  testEmailAddress: string;
  testingEmail: boolean;
  onUpdate: (field: keyof EmailSettings, value: any) => void;
  onTestEmailAddressChange: (value: string) => void;
  onTestEmail: () => void;
}

const EmailSettingsComponent: React.FC<EmailSettingsProps> = ({
  settings,
  testEmailAddress,
  testingEmail,
  onUpdate,
  onTestEmailAddressChange,
  onTestEmail
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host *
          </label>
          <input
            type="text"
            value={settings.host}
            onChange={(e) => onUpdate('host', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="smtp.gmail.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port *
          </label>
          <input
            type="number"
            value={settings.port}
            onChange={(e) => onUpdate('port', parseInt(e.target.value) || 587)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="587"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={settings.username}
            onChange={(e) => onUpdate('username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your-email@gmail.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            value={settings.password}
            onChange={(e) => onUpdate('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="App Password"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            For Gmail, use an App Password instead of your regular password
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={settings.fromName}
            onChange={(e) => onUpdate('fromName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email
          </label>
          <input
            type="email"
            value={settings.fromEmail}
            onChange={(e) => onUpdate('fromEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="noreply@yourcompany.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reply To Email
          </label>
          <input
            type="email"
            value={settings.replyTo}
            onChange={(e) => onUpdate('replyTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="support@yourcompany.com"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.secure}
            onChange={(e) => onUpdate('secure', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Use SSL/TLS (recommended for port 465)</span>
        </label>
      </div>

      {/* Test Email Section */}
      {/* <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Test Email Configuration</h4>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => onTestEmailAddressChange(e.target.value)}
              placeholder="Enter test email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onTestEmail}
            disabled={testingEmail || !testEmailAddress.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2"
          >
            {testingEmail ? <Icons.Spinner /> : <Icons.Mail />}
            <span>{testingEmail ? 'Testing...' : 'Send Test Email'}</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Send a test email to verify your SMTP configuration is working correctly.
        </p>
      </div> */}
    </div>
  );
};

export default EmailSettingsComponent;