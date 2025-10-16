import React, { useState, useEffect, useRef } from 'react';
import { Client } from '../../../types';
import { ButtonSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';

// Define dynamic field type for clients
interface DynamicField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
  label: string;
  value: any;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

// Enhanced ClientFormData with dynamic fields
interface ClientFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  dynamicFields: DynamicField[];
}

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
  onEmailCheck?: (email: string) => Promise<boolean>; // Optional for duplicate checking on submit
  // error?: string | null;
  submissionError?: string | null;
}

// Define all possible field types for clients
type FormFieldType = 
  | 'companyName' 
  | 'contactPerson' 
  | 'email' 
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'country'
  | 'taxId'
  | 'dynamic';

interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  dynamicField?: DynamicField;
  section?: string;
}

// SIMPLIFIED: Field-specific error state
interface FieldErrors {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  dynamicFields: Record<string, string>;
}

// Drag Handle Component
const DragHandle: React.FC = () => (
  <div className="drag-handle cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  </div>
);

// Custom Drag & Drop Hook
const useDragAndDrop = (items: FormField[], onReorder: (newItems: FormField[]) => void) => {
  const [draggedItem, setDraggedItem] = useState<FormField | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const draggedElement = useRef<HTMLElement | null>(null);

  const handleDragStart = (e: React.DragEvent, item: FormField) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    if (e.currentTarget instanceof HTMLElement) {
      draggedElement.current = e.currentTarget;
      setTimeout(() => {
        if (draggedElement.current) {
          draggedElement.current.style.opacity = '0.5';
        }
      }, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
    if (draggedElement.current) {
      draggedElement.current.style.opacity = '1';
      draggedElement.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, item: FormField) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== item.id) {
      setDraggedOver(item.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTarget: FormField) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === dropTarget.id) {
      return;
    }

    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === dropTarget.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    
    onReorder(newItems);
    setDraggedItem(null);
    setDraggedOver(null);
  };

  return {
    draggedItem,
    draggedOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
};

// Draggable Field Component
interface DraggableFieldComponentProps {
  field: FormField;
  index: number;
  formData: ClientFormData;
  onChange: (updates: Partial<ClientFormData>) => void;
  onDeleteDynamic: (id: string) => void;
  isDragged?: boolean;
  isDraggedOver?: boolean;
  dragHandlers: {
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  errors: FieldErrors;
  onValidate: (field: keyof FieldErrors | string, value: any) => void;
}

const DraggableFieldComponent: React.FC<DraggableFieldComponentProps> = ({
  field,
  formData,
  onChange,
  onDeleteDynamic,
  isDragged = false,
  isDraggedOver = false,
  errors,
  onValidate,
  dragHandlers,
}) => {
  const renderFieldContent = () => {
    switch (field.type) {
      case 'companyName':
        return (
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => {
                onChange({ companyName: e.target.value });
                onValidate('companyName', e.target.value);
              }}
              placeholder="Enter company name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.companyName 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle />
                {errors.companyName}
              </p>
            )}
          </div>
        );

      case 'contactPerson':
        return (
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => {
                onChange({ contactPerson: e.target.value });
                onValidate('contactPerson', e.target.value);
              }}
              placeholder="Enter contact person name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.contactPerson 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.contactPerson && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.contactPerson}
              </p>
            )}
          </div>
        );

      case 'email':
        return (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => {
                onChange({ email: e.target.value });
                onValidate('email', e.target.value);
              }}
              placeholder="Enter email address"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.email}
              </p>
            )}
          </div>
        );

      case 'phone':
        return (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                onChange({ phone: e.target.value });
                onValidate('phone', e.target.value);
              }}
              placeholder="Enter phone number"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.phone 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.phone}
              </p>
            )}
          </div>
        );

      case 'address':
        return (
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => {
                onChange({ address: e.target.value });
                onValidate('address', e.target.value);
              }}
              placeholder="Enter street address"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.address 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.address}
              </p>
            )}
          </div>
        );

      case 'city':
        return (
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => {
                onChange({ city: e.target.value });
                onValidate('city', e.target.value);
              }}
              placeholder="Enter city"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.city 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.city}
              </p>
            )}
          </div>
        );

      case 'state':
        return (
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="state"
              value={formData.state}
              onChange={(e) => {
                onChange({ state: e.target.value });
                onValidate('state', e.target.value);
              }}
              placeholder="Enter state/province"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.state 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.state}
              </p>
            )}
          </div>
        );

      case 'zipCode':
        return (
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => {
                onChange({ zipCode: e.target.value });
                onValidate('zipCode', e.target.value);
              }}
              placeholder="Enter ZIP/postal code"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.zipCode 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.zipCode}
              </p>
            )}
          </div>
        );

      case 'country':
        return (
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => {
                onChange({ country: e.target.value });
                onValidate('country', e.target.value);
              }}
              placeholder="Enter country"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.country 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.country}
              </p>
            )}
          </div>
        );

      case 'taxId':
        return (
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              id="taxId"
              value={formData.taxId}
              onChange={(e) => {
                onChange({ taxId: e.target.value });
                onValidate('taxId', e.target.value);
              }}
              placeholder="Enter tax ID/VAT number"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.taxId 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.taxId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.taxId}
              </p>
            )}
          </div>
        );

      case 'dynamic':
        if (!field.dynamicField) return null;
        
        const dynamicField = field.dynamicField;
        const updateDynamicField = (value: any) => {
          const updatedFields = formData.dynamicFields.map(f =>
            f.id === dynamicField.id ? { ...f, value } : f
          );
          onChange({ dynamicFields: updatedFields });
          onValidate(`dynamic-${dynamicField.id}`, value);
        };

        const dynamicError = errors.dynamicFields[dynamicField.id];

        const renderDynamicInput = () => {
          const inputClasses = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
            dynamicError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`;

          switch (dynamicField.type) {
            case 'text':
            case 'email':
              return (
                <input
                  type={dynamicField.type}
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(e.target.value)}
                  placeholder={dynamicField.placeholder}
                  className={inputClasses}
                />
              );

            case 'phone':
              return (
                <input
                  type="tel"
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(e.target.value)}
                  placeholder={dynamicField.placeholder || 'Enter phone number'}
                  className={inputClasses}
                />
              );

            case 'textarea':
              return (
                <textarea
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(e.target.value)}
                  placeholder={dynamicField.placeholder}
                  rows={3}
                  className={inputClasses}
                />
              );

            case 'number':
              return (
                <input
                  type="number"
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(parseFloat(e.target.value) || 0)}
                  placeholder={dynamicField.placeholder}
                  step="0.01"
                  className={inputClasses}
                />
              );

            case 'select':
              return (
                <select
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select an option</option>
                  {dynamicField.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              );

            case 'checkbox':
              return (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dynamicField.value || false}
                    onChange={(e) => updateDynamicField(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dynamicField.placeholder || 'Check this box'}</span>
                </div>
              );

            case 'date':
              return (
                <input
                  type="date"
                  value={dynamicField.value || ''}
                  onChange={(e) => updateDynamicField(e.target.value)}
                  className={inputClasses}
                />
              );

            default:
              return null;
          }
        };

        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {dynamicField.label}
                {dynamicField.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <button
                type="button"
                onClick={() => onDeleteDynamic(dynamicField.id)}
                className="text-red-600 hover:text-red-800 p-1 transition-colors flex-shrink-0"
                title="Delete field"
              >
                <Icons.X  />
              </button>
            </div>
            {renderDynamicInput()}
            {dynamicError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {dynamicError}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver}
      onDragEnter={dragHandlers.onDragEnter}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={dragHandlers.onDrop}
      className={`p-4 border rounded-lg transition-all duration-200 cursor-move ${
        isDragged 
          ? 'opacity-50 transform rotate-1 scale-105' 
          : 'opacity-100'
      } ${
        isDraggedOver 
          ? 'bg-blue-50 border-blue-300 shadow-lg' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <DragHandle />
        </div>
        <div className="flex-1 min-w-0">
          {renderFieldContent()}
        </div>
      </div>
    </div>
  );
};

// Field Builder Component
interface FieldBuilderProps {
  onAddField: (field: Omit<DynamicField, 'id'>) => void;
}

const FieldBuilder: React.FC<FieldBuilderProps> = ({ onAddField }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newField, setNewField] = useState({
    type: 'text' as DynamicField['type'],
    label: '',
    placeholder: '',
    required: false,
    options: [] as { value: string; label: string }[]
  });

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' }
  ];

  const handleAddField = () => {
    if (!newField.label.trim()) return;

    onAddField({
      ...newField,
      value: newField.type === 'checkbox' ? false : ''
    });

    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: []
    });
    setIsOpen(false);
  };

  const addOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, { value: '', label: '' }]
    }));
  };

  const updateOption = (index: number, field: 'value' | 'label', value: string) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) {
    return (
      <div className="p-4 border rounded-lg bg-white border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <DragHandle />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
          >
            <Icons.Plus  />
            <span className="ml-2">Add Dynamic Field</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white border-gray-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <DragHandle />
        </div>
        <div className="flex-1 p-4 border border-gray-300 rounded-lg bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Field</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icons.X  />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type
                </label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ 
                    ...prev, 
                    type: e.target.value as DynamicField['type'],
                    options: e.target.value === 'select' ? prev.options : []
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter field label"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Text
              </label>
              <input
                type="text"
                value={newField.placeholder}
                onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Enter placeholder text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Required field
              </label>
            </div>

            {newField.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dropdown Options
                </label>
                <div className="space-y-2">
                  {newField.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', e.target.value)}
                        placeholder="Option value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOption(index, 'label', e.target.value)}
                        placeholder="Option label"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <Icons.X  />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddField}
                disabled={!newField.label.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ClientForm Component - SIMPLIFIED
const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading,
  isEdit = false,
  onEmailCheck, // Optional for duplicate checking on submit only
  // error
  submissionError
}) => {
  const [formData, setFormData] = useState<ClientFormData>({
    companyName: client?.companyName || '',
    contactPerson: client?.contactPerson || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    zipCode: client?.zipCode || '',
    country: client?.country || '',
    taxId: client?.taxId || '',
    dynamicFields: client?.customFields ? Object.entries(client.customFields).map(([key, value]) => ({
      id: key,
      type: 'text',
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: value,
      required: false
    })) : []
  });

  // SIMPLIFIED: Basic field errors - just like your example
  const [errors, setErrors] = useState<FieldErrors>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    dynamicFields: {}
  });

  // SIMPLIFIED: Basic validation function - just like your example
  const validateField = (field: keyof FieldErrors | string, value: any) => {
    const newErrors = { ...errors };

    if (field.startsWith('dynamic-')) {
      const dynamicFieldId = field.replace('dynamic-', '');
      const dynamicField = formData.dynamicFields.find(f => f.id === dynamicFieldId);
      
      if (dynamicField?.required && (!value || value.toString().trim() === '')) {
        newErrors.dynamicFields[dynamicFieldId] = `${dynamicField.label} is required`;
      } else {
        delete newErrors.dynamicFields[dynamicFieldId];
      }
    } else {
      switch (field) {
        case 'companyName':
          if (!value?.trim()) {
            newErrors.companyName = 'Company name is required';
          } else {
            newErrors.companyName = '';
          }
          break;
        case 'contactPerson':
          if (!value?.trim()) {
            newErrors.contactPerson = 'Contact person is required';
          } else {
            newErrors.contactPerson = '';
          }
          break;
        case 'email':
          if (!value?.trim()) {
            newErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors.email = 'Invalid email format';
          } else {
            newErrors.email = '';
          }
          break;
        // Add more field validations as needed
        default:
          break;
      }
    }
    
    setErrors(newErrors);
  };

  // Initialize field order
  const [fieldOrder, setFieldOrder] = useState<FormField[]>(() => {
    const baseFields: FormField[] = [
      { id: 'companyName', type: 'companyName', label: 'Company Name', required: true },
      { id: 'contactPerson', type: 'contactPerson', label: 'Contact Person', required: true },
      { id: 'email', type: 'email', label: 'Email Address', required: true },
      { id: 'phone', type: 'phone', label: 'Phone Number' },
      { id: 'address', type: 'address', label: 'Street Address' },
      { id: 'city', type: 'city', label: 'City' },
      { id: 'state', type: 'state', label: 'State/Province' },
      { id: 'zipCode', type: 'zipCode', label: 'ZIP/Postal Code' },
      { id: 'country', type: 'country', label: 'Country' },
      { id: 'taxId', type: 'taxId', label: 'Tax ID/VAT Number' },
    ];

    const dynamicFields: FormField[] = formData.dynamicFields.map(field => ({
      id: `dynamic-${field.id}`,
      type: 'dynamic',
      label: field.label,
      required: field.required,
      dynamicField: field
    }));

    return [...baseFields, ...dynamicFields];
  });

  useEffect(() => {
  if (submissionError) {
    setErrors(prev => ({
      ...prev,
      email: submissionError.toLowerCase().includes('email') ? submissionError : ''
    }));
    
    if (submissionError.toLowerCase().includes('email')) {
      alert('⚠️ Email Already Exists\n\n' + submissionError);
    }
  }
}, [submissionError]); // This is fine, using setErrors with prev avoids needing errors in deps

  // Update field order when dynamic fields change
  useEffect(() => {
    setFieldOrder(prev => {
      const baseFields = prev.filter(f => f.type !== 'dynamic');
      const dynamicFields: FormField[] = formData.dynamicFields.map(field => ({
        id: `dynamic-${field.id}`,
        type: 'dynamic',
        label: field.label,
        required: field.required,
        dynamicField: field
      }));
      return [...baseFields, ...dynamicFields];
    });
  }, [formData.dynamicFields]);

  useEffect(() => {
    if (client && isEdit) {
      setFormData({
        companyName: client.companyName || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        country: client.country || '',
        taxId: client.taxId || '',
        dynamicFields: client.customFields ? Object.entries(client.customFields).map(([key, value]) => ({
          id: key,
          type: 'text',
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value: value,
          required: false
        })) : []
      });
    }
  }, [client, isEdit]);

  const dragAndDropHandlers = useDragAndDrop(fieldOrder, setFieldOrder);

  // const handleFormDataChange = (updates: Partial<ClientFormData>) => {
  //   setFormData(prev => ({ ...prev, ...updates }));
  // };

   const handleFormDataChange = (updates: Partial<ClientFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear errors for changed fields
    if (updates.email !== undefined) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const addDynamicField = (field: Omit<DynamicField, 'id'>) => {
    const newField: DynamicField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setFormData(prev => ({
      ...prev,
      dynamicFields: [...prev.dynamicFields, newField]
    }));
  };

  const deleteDynamicField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dynamicFields: prev.dynamicFields.filter(field => field.id !== id)
    }));
    
    // Clear error for deleted field
    const newErrors = { ...errors };
    delete newErrors.dynamicFields[id];
    setErrors(newErrors);
  };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Full validation on submit
//     let hasErrors = false;
//     const newErrors = { ...errors };

//     // Validate required fields
//     if (!formData.companyName?.trim()) {
//       newErrors.companyName = 'Company name is required';
//       hasErrors = true;
//     }
//     if (!formData.contactPerson?.trim()) {
//       newErrors.contactPerson = 'Contact person is required';
//       hasErrors = true;
//     }
//     if (!formData.email?.trim()) {
//       newErrors.email = 'Email is required';
//       hasErrors = true;
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = 'Invalid email format';
//       hasErrors = true;
//     }

//     if (!newErrors.email && onEmailCheck) {
//   try {
//     const emailExists = await onEmailCheck(formData.email);
//    if (emailExists && (!isEdit || formData.email !== client?.email)) {
//   newErrors.email = 'This email is already registered';
  
//   // Simple browser alert
//   alert('⚠️ Email Already Exists\n\nThis email address is already registered. Please use a different email address.');
  
//   hasErrors = true;
// }
//   } catch (error) {
//     newErrors.email = 'Unable to verify email availability';
//     hasErrors = true;
//   }
// }



//     // Validate dynamic fields
//     formData.dynamicFields.forEach((field) => {
//       if (field.required && (!field.value || field.value.toString().trim() === '')) {
//         newErrors.dynamicFields[field.id] = `${field.label} is required`;
//         hasErrors = true;
//       }
//     });

//     // Optional: Check for duplicate email if onEmailCheck is provided
//     if (onEmailCheck && formData.email && !newErrors.email) {
//       try {
//         const emailExists = await onEmailCheck(formData.email);
//         if (emailExists && (!isEdit || formData.email !== client?.email)) {
//           newErrors.email = 'Email already exists';
//           hasErrors = true;
//         }
//       } catch (error) {
//         newErrors.email = 'Unable to verify email availability';
//         hasErrors = true;
//       }
//     }

//     if (hasErrors) {
//       setErrors(newErrors);
//       return;
//     }

//     // Submit the form
//     const customFields = formData.dynamicFields.reduce((acc, field) => {
//       acc[field.label] = field.value;
//       return acc;
//     }, {} as Record<string, any>);

//     const submitData = {
//       ...formData,
//       customFields: Object.keys(customFields).length > 0 ? customFields : undefined
//     };

//     // Clear all errors on successful validation
//     setErrors({
//       companyName: '',
//       contactPerson: '',
//       email: '',
//       phone: '',
//       address: '',
//       city: '',
//       state: '',
//       zipCode: '',
//       country: '',
//       taxId: '',
//       dynamicFields: {}
//     });

//     onSubmit(submitData as any);
//   };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  let hasErrors = false;
  const newErrors = { ...errors };

  // Basic validations
  if (!formData.companyName?.trim()) {
    newErrors.companyName = 'Company name is required';
    hasErrors = true;
  }
  if (!formData.contactPerson?.trim()) {
    newErrors.contactPerson = 'Contact person is required';
    hasErrors = true;
  }
  if (!formData.email?.trim()) {
    newErrors.email = 'Email is required';
    hasErrors = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email format';
    hasErrors = true;
  }

  // Email duplicate check (ONLY ONCE!)
  if (!newErrors.email && onEmailCheck) {
    try {
      const emailExists = await onEmailCheck(formData.email);
      if (emailExists && (!isEdit || formData.email !== client?.email)) {
        newErrors.email = 'This email is already registered';
        alert('⚠️ Email Already Exists\n\nThis email address is already registered. Please use a different email address.');
        hasErrors = true;
      }
    } catch (error) {
      newErrors.email = 'Unable to verify email availability';
      hasErrors = true;
    }
  }

  // Validate dynamic fields
  formData.dynamicFields.forEach((field) => {
    if (field.required && (!field.value || field.value.toString().trim() === '')) {
      newErrors.dynamicFields[field.id] = `${field.label} is required`;
      hasErrors = true;
    }
  });

  // ❌ REMOVE THIS DUPLICATE CHECK - it's already done above!
  // if (onEmailCheck && formData.email && !newErrors.email) { ... }

  if (hasErrors) {
    setErrors(newErrors);
    return;
  }

  // Submit form
  onSubmit(formData);
};

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {isEdit ? 'Edit Client' : 'Add New Client'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Drag any field to reorder the form layout. {isEdit ? 'Update client information' : 'Add a new client to create quotations and manage business relationships'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Drag and Drop Hint */}
        {/* {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <Icons.AlertCircle />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Submission Error
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )} */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <DragHandle />
            <span className="text-sm font-medium">All fields are draggable! Drag any field using the handle to reorder your form layout.</span>
          </div>
        </div>

        {/* All draggable fields */}
        <div className="space-y-4">
          {fieldOrder.map((field, index) => (
            <DraggableFieldComponent
              key={field.id}
              field={field}
              index={index}
              formData={formData}
              onChange={handleFormDataChange}
              onDeleteDynamic={deleteDynamicField}
              isDragged={dragAndDropHandlers.draggedItem?.id === field.id}
              isDraggedOver={dragAndDropHandlers.draggedOver === field.id}
              errors={errors}
              onValidate={validateField}
              dragHandlers={{
                onDragStart: (e) => dragAndDropHandlers.handleDragStart(e, field),
                onDragEnd: dragAndDropHandlers.handleDragEnd,
                onDragOver: dragAndDropHandlers.handleDragOver,
                onDragEnter: (e) => dragAndDropHandlers.handleDragEnter(e, field),
                onDragLeave: dragAndDropHandlers.handleDragLeave,
                onDrop: (e) => dragAndDropHandlers.handleDrop(e, field),
              }}
            />
          ))}
          
          <FieldBuilder onAddField={addDynamicField} />
        </div>

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
            {isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;