import React, { useState, useEffect, useRef } from 'react';
import { Quotation, Client } from '../../../types';
import { ButtonSpinner } from '../../../components/LoadingSpinner';
import { Icons } from '../../../components/Icons/Icons';
import { DynamicField } from '../types';
import { useCurrency } from '../../../contexts/CurrencyContext';

// Updated form data interface to include taxation options
export interface QuotationFormData {
  title: string;
  description: string;
  clientId: string;
  subtotal: number;
  taxationType: 'gst' | 'pst' | 'both' | 'none';
  gstPercentage: number;
  pstPercentage: number;
  taxPercentage: number;
  validUntil: string;
  notes: string;
  dynamicFields: DynamicField[];
}

interface QuotationFormProps {
  quotation?: Quotation | null;
  clients: Client[];
  onSubmit: (data: QuotationFormData) => void;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

// Define all possible field types
type FormFieldType = 
  | 'title' 
  | 'client' 
  | 'description' 
  | 'subtotal' 
  | 'taxation'
  | 'validUntil' 
  | 'notes' 
  | 'dynamic'
  | 'financial-summary';

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
  title: string;
  clientId: string;
  description: string;
  subtotal: string;
  gstPercentage: string;
  pstPercentage: string;
  validUntil: string;
  notes: string;
  dynamicFields: Record<string, string>;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Calculate tax amounts based on taxation type
const calculateTaxAmounts = (subtotal: number, taxationType: string, gstPercentage: number, pstPercentage: number) => {
  let gstAmount = 0;
  let pstAmount = 0;

  if (taxationType === 'gst') {
    gstAmount = (subtotal * gstPercentage) / 100;
  } else if (taxationType === 'pst') {
    pstAmount = (subtotal * pstPercentage) / 100;
  } else if (taxationType === 'both') {
    gstAmount = (subtotal * gstPercentage) / 100;
    pstAmount = (subtotal * pstPercentage) / 100;
  }

  const totalTax = gstAmount + pstAmount;
  const totalAmount = subtotal + totalTax;

  return { gstAmount, pstAmount, totalTax, totalAmount };
};

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
  const { format } = useCurrency();

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
  formData: QuotationFormData;
  clients: Client[];
  onChange: (updates: Partial<QuotationFormData>) => void;
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
  clients,
  onChange,
  onDeleteDynamic,
  isDragged = false,
  isDraggedOver = false,
  dragHandlers,
  errors,
  onValidate,
}) => {
  const { format } = useCurrency();

  const renderFieldContent = () => {
    switch (field.type) {
      case 'title':
        return (
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                onChange({ title: e.target.value });
                onValidate('title', e.target.value);
              }}
              placeholder="Enter quotation title"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.title 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle />
                {errors.title}
              </p>
            )}
          </div>
        );

      case 'client':
        return (
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => {
                onChange({ clientId: e.target.value });
                onValidate('clientId', e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.clientId 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select a client</option>
              {Array.isArray(clients) && clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName} - {client.contactPerson}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle />
                {errors.clientId}
              </p>
            )}
          </div>
        );

      case 'description':
        return (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                onChange({ description: e.target.value });
                onValidate('description', e.target.value);
              }}
              placeholder="Enter quotation description"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.description 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.description}
              </p>
            )}
          </div>
        );

      case 'subtotal':
        return (
          <div>
            <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              id="subtotal"
              value={formData.subtotal}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onChange({ subtotal: value });
                onValidate('subtotal', value);
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.subtotal 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.subtotal && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle />
                {errors.subtotal}
              </p>
            )}
          </div>
        );

      case 'taxation':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{field.label}</h4>
            
            {/* Taxation Type Selector */}
            <div>
              <label htmlFor="taxationType" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Type
              </label>
              <select
                id="taxationType"
                value={formData.taxationType}
                onChange={(e) => {
                  const newTaxationType = e.target.value as QuotationFormData['taxationType'];
                  onChange({ 
                    taxationType: newTaxationType,
                    gstPercentage: newTaxationType === 'gst' || newTaxationType === 'both' ? formData.gstPercentage : 0,
                    pstPercentage: newTaxationType === 'pst' || newTaxationType === 'both' ? formData.pstPercentage : 0
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">No Tax</option>
                <option value="gst">GST Only</option>
                <option value="pst">PST Only</option>
                <option value="both">Both GST & PST</option>
              </select>
            </div>

            {/* GST Input Field */}
            {(formData.taxationType === 'gst' || formData.taxationType === 'both') && (
              <div>
                <label htmlFor="gstPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  GST Percentage (%)
                </label>
                <input
                  type="number"
                  id="gstPercentage"
                  value={formData.gstPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onChange({ gstPercentage: value });
                    onValidate('gstPercentage', value);
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                    errors.gstPercentage 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.gstPercentage && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <Icons.AlertCircle  />
                    {errors.gstPercentage}
                  </p>
                )}
              </div>
            )}

            {/* PST Input Field */}
            {(formData.taxationType === 'pst' || formData.taxationType === 'both') && (
              <div>
                <label htmlFor="pstPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  PST Percentage (%)
                </label>
                <input
                  type="number"
                  id="pstPercentage"
                  value={formData.pstPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onChange({ pstPercentage: value });
                    onValidate('pstPercentage', value);
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                    errors.pstPercentage 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.pstPercentage && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <Icons.AlertCircle  />
                    {errors.pstPercentage}
                  </p>
                )}
              </div>
            )}

            {/* Tax Preview */}
            {formData.taxationType !== 'none' && formData.subtotal > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Tax Preview</h5>
                <div className="space-y-1 text-sm text-blue-800">
                  {formData.taxationType === 'gst' && (
                    <>
                      <div>GST ({formData.gstPercentage}%): {format((formData.subtotal * formData.gstPercentage) / 100)}</div>
                      <div className="font-medium">Total Tax: {format((formData.subtotal * formData.gstPercentage) / 100)}</div>
                    </>
                  )}
                  {formData.taxationType === 'pst' && (
                    <>
                      <div>PST ({formData.pstPercentage}%): {format((formData.subtotal * formData.pstPercentage) / 100)}</div>
                      <div className="font-medium">Total Tax: {format((formData.subtotal * formData.pstPercentage) / 100)}</div>
                    </>
                  )}
                  {formData.taxationType === 'both' && (
                    <>
                      <div>GST ({formData.gstPercentage}%): {format((formData.subtotal * formData.gstPercentage) / 100)}</div>
                      <div>PST ({formData.pstPercentage}%): {format((formData.subtotal * formData.pstPercentage) / 100)}</div>
                      <div className="font-medium">Total Tax: {format(((formData.subtotal * formData.gstPercentage) + (formData.subtotal * formData.pstPercentage)) / 100)}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'validUntil':
        return (
          <div>
            <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="date"
              id="validUntil"
              value={formData.validUntil}
              onChange={(e) => {
                onChange({ validUntil: e.target.value });
                onValidate('validUntil', e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.validUntil 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.validUntil && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.validUntil}
              </p>
            )}
          </div>
        );

      case 'notes':
        return (
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => {
                onChange({ notes: e.target.value });
                onValidate('notes', e.target.value);
              }}
              placeholder="Enter any additional notes"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.notes 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icons.AlertCircle  />
                {errors.notes}
              </p>
            )}
          </div>
        );

      case 'financial-summary':
        const { gstAmount, pstAmount, totalTax, totalAmount } = calculateTaxAmounts(
          formData.subtotal,
          formData.taxationType,
          formData.gstPercentage,
          formData.pstPercentage
        );

        return (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">{field.label}</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{format(formData.subtotal)}</span>
                </div>
                
                {formData.taxationType !== 'none' && (
                  <>
                    {(formData.taxationType === 'gst' || formData.taxationType === 'both') && gstAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>GST ({formData.gstPercentage}%):</span>
                        <span>{format(gstAmount)}</span>
                      </div>
                    )}
                    
                    {(formData.taxationType === 'pst' || formData.taxationType === 'both') && pstAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>PST ({formData.pstPercentage}%):</span>
                        <span>{format(pstAmount)}</span>
                      </div>
                    )}
                    
                    {totalTax > 0 && (
                      <div className="flex justify-between text-sm border-t pt-1">
                        <span>Total Tax:</span>
                        <span>{format(totalTax)}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-between text-lg font-medium border-t pt-2">
                  <span>Total Amount:</span>
                  <span>{format(totalAmount)}</span>
                </div>
              </div>
            </div>
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

// Field Builder Component (keeping existing functionality)
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

// Main QuotationForm Component
const QuotationForm: React.FC<QuotationFormProps> = ({
  quotation,
  clients,
  onSubmit,
  onCancel,
  loading,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<QuotationFormData>({
    title: quotation?.title || '',
    description: quotation?.description || '',
    clientId: quotation?.clientId || '',
    subtotal: quotation?.subtotal ? parseFloat(quotation.subtotal.toString()) : 0,
    taxationType: 'none',
    gstPercentage: quotation?.gstPercentage ? parseFloat(quotation.gstPercentage.toString()) : 0,
    pstPercentage: quotation?.pstPercentage ? parseFloat(quotation.pstPercentage.toString()) : 0,
    taxPercentage: quotation?.taxPercentage ? parseFloat(quotation.taxPercentage.toString()) : 0,
    validUntil: quotation?.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
    notes: quotation?.notes || '',
    dynamicFields: quotation?.formData ? Object.entries(quotation.formData).map(([key, value]) => ({
      id: key,
      type: 'text',
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: value,
      required: false
    })) : []
  });

  // SIMPLIFIED: Basic field errors - just like ClientForm
  const [errors, setErrors] = useState<FieldErrors>({
    title: '',
    clientId: '',
    description: '',
    subtotal: '',
    gstPercentage: '',
    pstPercentage: '',
    validUntil: '',
    notes: '',
    dynamicFields: {}
  });

  // SIMPLIFIED: Basic validation function
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
        case 'title':
          if (!value?.trim()) {
            newErrors.title = 'Title is required';
          } else if (value.trim().length < 5) {
  newErrors.title = 'Title must be at least 5 characters long';
} else {
            newErrors.title = '';
          }
          break;
        case 'clientId':
          if (!value) {
            newErrors.clientId = 'Client is required';
          } else {
            newErrors.clientId = '';
          }
          break;
        case 'subtotal':
          if (!value || value <= 0) {
            newErrors.subtotal = 'Subtotal must be greater than 0';
          } else {
            newErrors.subtotal = '';
          }
          break;
        case 'gstPercentage':
          if (formData.taxationType === 'gst' || formData.taxationType === 'both') {
            if (value < 0 || value > 100) {
              newErrors.gstPercentage = 'GST percentage must be between 0 and 100';
            } else {
              newErrors.gstPercentage = '';
            }
          }
          break;
        case 'pstPercentage':
          if (formData.taxationType === 'pst' || formData.taxationType === 'both') {
            if (value < 0 || value > 100) {
              newErrors.pstPercentage = 'PST percentage must be between 0 and 100';
            } else {
              newErrors.pstPercentage = '';
            }
          }
          break;
        default:
          break;
      }
    }
    
    setErrors(newErrors);
  };

  // Determine initial tax type based on existing quotation data
  useEffect(() => {
    if (quotation && isEdit) {
      const gst = quotation.gstPercentage ? parseFloat(quotation.gstPercentage.toString()) : 0;
      const pst = quotation.pstPercentage ? parseFloat(quotation.pstPercentage.toString()) : 0;
      const legacyTax = quotation.taxPercentage ? parseFloat(quotation.taxPercentage.toString()) : 0;
      
      let taxationType: QuotationFormData['taxationType'] = 'none';
      
      if (gst > 0 && pst > 0) {
        taxationType = 'both';
      } else if (gst > 0) {
        taxationType = 'gst';
      } else if (pst > 0) {
        taxationType = 'pst';
      } else if (legacyTax > 0) {
        taxationType = 'gst';
      }
      
      setFormData(prev => ({ 
        ...prev, 
        taxationType,
        gstPercentage: gst || (taxationType === 'gst' && legacyTax > 0 ? legacyTax : 0),
        pstPercentage: pst,
        taxPercentage: legacyTax
      }));
    }
  }, [quotation, isEdit]);

  // Initialize field order
  const [fieldOrder, setFieldOrder] = useState<FormField[]>(() => {
    const baseFields: FormField[] = [
      { id: 'title', type: 'title', label: 'Quotation Title', required: true },
      { id: 'client', type: 'client', label: 'Client', required: true },
      { id: 'description', type: 'description', label: 'Description' },
      { id: 'subtotal', type: 'subtotal', label: 'Subtotal', required: true },
      { id: 'taxation', type: 'taxation', label: 'Taxation' },
      { id: 'financial-summary', type: 'financial-summary', label: 'Financial Summary' },
      { id: 'validUntil', type: 'validUntil', label: 'Valid Until' },
      { id: 'notes', type: 'notes', label: 'Notes' },
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

  const dragAndDropHandlers = useDragAndDrop(fieldOrder, setFieldOrder);

  const handleFormDataChange = (updates: Partial<QuotationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Full validation on submit
    let hasErrors = false;
    const newErrors = { ...errors };

    // Validate required fields
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
      hasErrors = true;
    }
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
      hasErrors = true;
    }
    if (!formData.subtotal || formData.subtotal <= 0) {
      newErrors.subtotal = 'Subtotal must be greater than 0';
      hasErrors = true;
    }

    // Validate tax percentages
    if (formData.taxationType === 'gst' || formData.taxationType === 'both') {
      if (formData.gstPercentage < 0 || formData.gstPercentage > 100) {
        newErrors.gstPercentage = 'GST percentage must be between 0 and 100';
        hasErrors = true;
      }
    }
    if (formData.taxationType === 'pst' || formData.taxationType === 'both') {
      if (formData.pstPercentage < 0 || formData.pstPercentage > 100) {
        newErrors.pstPercentage = 'PST percentage must be between 0 and 100';
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

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Clear all errors on successful validation
    setErrors({
      title: '',
      clientId: '',
      description: '',
      subtotal: '',
      gstPercentage: '',
      pstPercentage: '',
      validUntil: '',
      notes: '',
      dynamicFields: {}
    });

    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {isEdit ? 'Edit Quotation' : 'Create New Quotation'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Drag any field to reorder the form layout. {isEdit ? 'Update quotation information with taxation options' : 'Create a new quotation with custom taxation and fields'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Drag and Drop Hint */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <DragHandle />
            <span className="text-sm font-medium">All fields are draggable! Drag any field using the handle to reorder your form layout. Configure taxation options with GST/PST support.</span>
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
              clients={clients}
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

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
          >
            {loading && <ButtonSpinner />}
            {isEdit ? 'Update Quotation' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;