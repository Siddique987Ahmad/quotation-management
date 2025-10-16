import React from 'react';
import { NotificationSettings } from '../types';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (field: keyof NotificationSettings, value: any) => void;
}

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
  settings,
  onUpdate
}) => {
  const handleReminderDayToggle = (day: number, checked: boolean) => {
    const newDays = checked
      ? [...settings.reminderDays, day].sort((a, b) => a - b)
      : settings.reminderDays.filter(d => d !== day);
    onUpdate('reminderDays', newDays);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h4>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => onUpdate('emailNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 font-medium">Enable email notifications</span>
          </label>

          <div className="ml-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.quotationApproved}
                onChange={(e) => onUpdate('quotationApproved', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.emailNotifications}
              />
              <span className={`ml-2 text-sm ${!settings.emailNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                Quotation approved notifications
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.invoiceGenerated}
                onChange={(e) => onUpdate('invoiceGenerated', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.emailNotifications}
              />
              <span className={`ml-2 text-sm ${!settings.emailNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                Invoice generated notifications
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.paymentReceived}
                onChange={(e) => onUpdate('paymentReceived', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.emailNotifications}
              />
              <span className={`ml-2 text-sm ${!settings.emailNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                Payment received notifications
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.overdueReminders}
                onChange={(e) => onUpdate('overdueReminders', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.emailNotifications}
              />
              <span className={`ml-2 text-sm ${!settings.emailNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                Overdue payment reminders
              </span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Reminder Schedule (Days after due date)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[7, 14, 30, 60].map((day) => (
            <label key={day} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.reminderDays.includes(day)}
                onChange={(e) => handleReminderDayToggle(day, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.overdueReminders || !settings.emailNotifications}
              />
              <span className={`ml-2 text-sm ${(!settings.overdueReminders || !settings.emailNotifications) ? 'text-gray-400' : 'text-gray-700'}`}>
                {day} days
              </span>
            </label>
          ))}
        </div>
        
        {settings.reminderDays.length > 0 && settings.emailNotifications && settings.overdueReminders && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Reminders will be sent {settings.reminderDays.join(', ')} days after the due date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;