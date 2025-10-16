// =============================================================================
// FIXED USER FORM COMPONENT - Better Password Validation & Handling
// =============================================================================

import React, { useState, useEffect } from 'react';
import { User, Role } from '../../../types';
import { ButtonSpinner } from '../../../components/LoadingSpinner';
import { UserFormData } from '../types';

interface UserFormProps {
  user?: User | null;
  availableRoles: { value: Role; label: string }[];
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

// FIX: Improved validation for password updates
const validateUserForm = (data: UserFormData, isEdit: boolean = false): string[] => {
  const errors: string[] = [];

  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Password validation for create mode
  if (!isEdit && !data.password?.trim()) {
    errors.push('Password is required');
  }

  // Password validation for both create and edit modes
  if (data.password && data.password.trim()) {
    if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    // Only check password confirmation if password is provided
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
  } else if (isEdit && data.confirmPassword && data.confirmPassword.trim()) {
    // In edit mode, if confirm password is provided but password is empty
    errors.push('Please enter new password to confirm');
  }

  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  }

  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  }

  return errors;
};

const UserForm: React.FC<UserFormProps> = ({
  user,
  availableRoles,
  onSubmit,
  onCancel,
  loading,
  isEdit = false
}) => {
  // const [formData, setFormData] = useState<UserFormData>({
  //   email: user?.email || '',
  //   password: '',
  //   confirmPassword: '',
  //   firstName: user?.firstName || '',
  //   lastName: user?.lastName || '',
  //   role: user?.role || Role.USER
  // });
  const [formData, setFormData] = useState<UserFormData>({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: Role.USER
});
  const [errors, setErrors] = useState<string[]>([]);

  // FIX: Update form data when user prop changes (important for edit mode)
  // useEffect(() => {
  //   if (user && isEdit) {
  //     setFormData(prev => ({
  //       ...prev,
  //       email: user.email || '',
  //       firstName: user.firstName || '',
  //       lastName: user.lastName || '',
  //       role: user.role || Role.USER
  //       // Note: Don't populate password fields in edit mode for security
  //     }));
  //   }
  // }, [user, isEdit]);
  useEffect(() => {
  if (isEdit && user) {
    // Only populate form data in edit mode with valid user
    setFormData({
      email: user.email || '',
      password: '',
      confirmPassword: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || Role.USER
    });
  } else {
    // Always reset to blank form in create mode
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: Role.USER
    });
  }
}, [user, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateUserForm(formData, isEdit);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    
    // FIX: Better data preparation for submission
    const submitData = { ...formData };
    
    // In edit mode, only include password if it was actually changed
    if (isEdit && !submitData.password.trim()) {
      submitData.password = '';
      submitData.confirmPassword = '';
    }
    
    console.log('Submitting form data:', { 
      ...submitData, 
      password: submitData.password ? '[PROVIDED]' : '[EMPTY]' 
    }); // Debug log
    
    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // FIX: Add password strength indicator for better UX
  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (!password) return { strength: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { strength: 'Weak', color: 'text-red-600' };
    if (score < 4) return { strength: 'Medium', color: 'text-yellow-600' };
    return { strength: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? 'Update employee information and optionally change password' : 'Create a new employee account to give them access to the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Debug Info for Edit Mode */}
        {isEdit && user && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
            <p className="text-sm">
              Editing user: <strong>{user.firstName} {user.lastName}</strong> ({user.email})
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={handleInputChange('role')}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Determines what features this employee can access
          </p>
        </div>

        {/* Password Section with Better UX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder={isEdit ? "Enter new password" : "Enter password"}
            />
            {/* Password Strength Indicator */}
            {formData.password && (
              <p className={`text-xs mt-1 ${passwordStrength.color}`}>
                Password strength: {passwordStrength.strength}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {isEdit ? 'Confirm New Password' : 'Confirm Password *'}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Confirm password"
            />
            {/* Password Match Indicator */}
            {formData.password && formData.confirmPassword && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        {/* Password Update Warning for Edit Mode */}
        {isEdit && (formData.password || formData.confirmPassword) && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            <p className="text-sm">
              <strong>Password Update:</strong> The user will need to use the new password for their next login.
              Make sure to inform them about the password change.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading && <ButtonSpinner />}
            {isEdit ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;