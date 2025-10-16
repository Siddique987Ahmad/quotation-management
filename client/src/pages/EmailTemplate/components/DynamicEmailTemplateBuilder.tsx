import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit3, Eye, Settings, 
  ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Type, Hash, Calendar, DollarSign, 
  ToggleLeft, List, FileText, User,
  X, Check, AlertTriangle, Info, Save
} from 'lucide-react';

// Field type definitions based on your models
interface FieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'decimal' | 'date' | 'boolean' | 'enum' | 'json';
  description: string;
  required?: boolean;
  format?: string;
  options?: string[];
  icon: React.ReactNode;
  category: 'basic' | 'financial' | 'dates' | 'metadata';
}

interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  customLabel?: string;
  format?: string;
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'exists';
    value: any;
  };
  styling?: {
    bold: boolean;
    italic: boolean;
    color?: string;
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  };
}

interface TemplateSection {
  id: string;
  name: string;
  title: string;
  enabled: boolean;
  fields: TemplateField[];
  styling?: {
    backgroundColor?: string;
    borderColor?: string;
    padding?: string;
  };
}

const DynamicEmailTemplateBuilder: React.FC = () => {
  // Available fields based on your models
  const quotationFields: FieldDefinition[] = [
    // Basic Information
    { key: 'quotationNumber', label: 'Quotation Number', type: 'string', description: 'Unique quotation identifier', required: true, icon: <Hash size={16} />, category: 'basic' },
    { key: 'title', label: 'Quotation Title', type: 'string', description: 'Title of the quotation', required: true, icon: <Type size={16} />, category: 'basic' },
    { key: 'description', label: 'Description', type: 'string', description: 'Detailed description', icon: <FileText size={16} />, category: 'basic' },
    { key: 'status', label: 'Status', type: 'enum', description: 'Current quotation status', options: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'], icon: <ToggleLeft size={16} />, category: 'basic' },
    
    // Financial Information
    { key: 'subtotal', label: 'Subtotal', type: 'decimal', description: 'Amount before taxes', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'taxPercentage', label: 'Tax Percentage', type: 'decimal', description: 'Tax rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'taxAmount', label: 'Tax Amount', type: 'decimal', description: 'Calculated tax amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'gstPercentage', label: 'GST Percentage', type: 'decimal', description: 'GST rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'gstAmount', label: 'GST Amount', type: 'decimal', description: 'Calculated GST amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'pstPercentage', label: 'PST Percentage', type: 'decimal', description: 'PST rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'pstAmount', label: 'PST Amount', type: 'decimal', description: 'Calculated PST amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'combinedTaxAmount', label: 'Combined Tax Amount', type: 'decimal', description: 'Total of all taxes', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'totalAmount', label: 'Total Amount', type: 'decimal', description: 'Final total amount', format: 'currency', required: true, icon: <DollarSign size={16} />, category: 'financial' },
    
    // Dates
    { key: 'validUntil', label: 'Valid Until', type: 'date', description: 'Quotation expiry date', format: 'date', icon: <Calendar size={16} />, category: 'dates' },
    { key: 'createdAt', label: 'Created Date', type: 'date', description: 'When quotation was created', format: 'datetime', icon: <Calendar size={16} />, category: 'dates' },
    { key: 'updatedAt', label: 'Updated Date', type: 'date', description: 'Last modification date', format: 'datetime', icon: <Calendar size={16} />, category: 'dates' },
    
    // Metadata
    { key: 'notes', label: 'Notes', type: 'string', description: 'Additional notes', icon: <FileText size={16} />, category: 'metadata' },
    { key: 'emailSent', label: 'Email Sent', type: 'boolean', description: 'Whether email was sent', icon: <ToggleLeft size={16} />, category: 'metadata' },
    { key: 'emailSentAt', label: 'Email Sent Date', type: 'date', description: 'When email was sent', format: 'datetime', icon: <Calendar size={16} />, category: 'metadata' },
    { key: 'formData', label: 'Form Data', type: 'json', description: 'Dynamic form data', icon: <List size={16} />, category: 'metadata' }
  ];

  const invoiceFields: FieldDefinition[] = [
    // Basic Information
    { key: 'invoiceNumber', label: 'Invoice Number', type: 'string', description: 'Unique invoice identifier', required: true, icon: <Hash size={16} />, category: 'basic' },
    { key: 'quotationId', label: 'Related Quotation', type: 'string', description: 'Associated quotation ID', icon: <Hash size={16} />, category: 'basic' },
    { key: 'type', label: 'Invoice Type', type: 'enum', description: 'Type of invoice', options: ['TAX_INVOICE_1', 'TAX_INVOICE_2', 'SIMPLE_INVOICE'], icon: <Type size={16} />, category: 'basic' },
    { key: 'status', label: 'Status', type: 'enum', description: 'Current invoice status', options: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'], icon: <ToggleLeft size={16} />, category: 'basic' },
    
    // Financial Information (similar to quotation)
    { key: 'subtotal', label: 'Subtotal', type: 'decimal', description: 'Amount before taxes', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'taxPercentage', label: 'Tax Percentage', type: 'decimal', description: 'Tax rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'taxAmount', label: 'Tax Amount', type: 'decimal', description: 'Calculated tax amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'gstPercentage', label: 'GST Percentage', type: 'decimal', description: 'GST rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'gstAmount', label: 'GST Amount', type: 'decimal', description: 'Calculated GST amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'pstPercentage', label: 'PST Percentage', type: 'decimal', description: 'PST rate percentage', format: 'percentage', icon: <Hash size={16} />, category: 'financial' },
    { key: 'pstAmount', label: 'PST Amount', type: 'decimal', description: 'Calculated PST amount', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'combinedTaxAmount', label: 'Combined Tax Amount', type: 'decimal', description: 'Total of all taxes', format: 'currency', icon: <DollarSign size={16} />, category: 'financial' },
    { key: 'totalAmount', label: 'Total Amount', type: 'decimal', description: 'Final total amount', format: 'currency', required: true, icon: <DollarSign size={16} />, category: 'financial' },
    
    // Dates
    { key: 'dueDate', label: 'Due Date', type: 'date', description: 'Payment due date', format: 'date', icon: <Calendar size={16} />, category: 'dates' },
    { key: 'paidDate', label: 'Paid Date', type: 'date', description: 'Date when payment was received', format: 'date', icon: <Calendar size={16} />, category: 'dates' },
    { key: 'createdAt', label: 'Created Date', type: 'date', description: 'When invoice was created', format: 'datetime', icon: <Calendar size={16} />, category: 'dates' },
    { key: 'updatedAt', label: 'Updated Date', type: 'date', description: 'Last modification date', format: 'datetime', icon: <Calendar size={16} />, category: 'dates' },
    
    // Metadata
    { key: 'emailSent', label: 'Email Sent', type: 'boolean', description: 'Whether email was sent', icon: <ToggleLeft size={16} />, category: 'metadata' },
    { key: 'emailSentAt', label: 'Email Sent Date', type: 'date', description: 'When email was sent', format: 'datetime', icon: <Calendar size={16} />, category: 'metadata' },
    { key: 'pdfPath', label: 'PDF Path', type: 'string', description: 'Path to generated PDF', icon: <FileText size={16} />, category: 'metadata' }
  ];

  // Client fields (common to both)
  const clientFields: FieldDefinition[] = [
    { key: 'client.firstName', label: 'Client First Name', type: 'string', description: 'Client first name', icon: <User size={16} />, category: 'basic' },
    { key: 'client.lastName', label: 'Client Last Name', type: 'string', description: 'Client last name', icon: <User size={16} />, category: 'basic' },
    { key: 'client.email', label: 'Client Email', type: 'string', description: 'Client email address', icon: <User size={16} />, category: 'basic' },
    { key: 'client.phone', label: 'Client Phone', type: 'string', description: 'Client phone number', icon: <User size={16} />, category: 'basic' },
    { key: 'client.company', label: 'Client Company', type: 'string', description: 'Client company name', icon: <User size={16} />, category: 'basic' }
  ];

  // State management
  const [selectedCategory, setSelectedCategory] = useState<'QUOTATION' | 'INVOICE' | 'USER'>('QUOTATION');
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([
    {
      id: 'header',
      name: 'header',
      title: 'Email Header',
      enabled: true,
      fields: []
    },
    {
      id: 'main_content',
      name: 'main_content', 
      title: 'Main Content',
      enabled: true,
      fields: []
    },
    {
      id: 'financial_summary',
      name: 'financial_summary',
      title: 'Financial Summary',
      enabled: true,
      fields: []
    },
    {
      id: 'footer',
      name: 'footer',
      title: 'Email Footer', 
      enabled: true,
      fields: []
    }
  ]);
  const [expandedSection, setExpandedSection] = useState<string>('main_content');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basic: true,
    financial: true,
    dates: false,
    metadata: false
  });

  // Template configuration
  const [templateConfig, setTemplateConfig] = useState({
    templateKey: '',
    name: '',
    description: '',
    category: 'QUOTATION' as 'QUOTATION' | 'INVOICE' | 'USER',
    type: 'QUOTATION_SENT' as string,
    subject: '',
    sections: {} as Record<string, any>,
    variables: [] as string[]
  });

  // Update available fields when category changes
  useEffect(() => {
    let fields: FieldDefinition[] = [];
    
    switch (selectedCategory) {
      case 'QUOTATION':
        fields = [...quotationFields, ...clientFields];
        setTemplateConfig(prev => ({
          ...prev,
          category: 'QUOTATION',
          type: 'QUOTATION_SENT',
          subject: 'Quotation {{quotationNumber}} - {{title}}'
        }));
        break;
      case 'INVOICE':
        fields = [...invoiceFields, ...clientFields];
        setTemplateConfig(prev => ({
          ...prev,
          category: 'INVOICE',
          type: 'INVOICE_SENT',
          subject: 'Invoice {{invoiceNumber}} - Payment Required'
        }));
        break;
      case 'USER':
        // Add user-specific fields here
        fields = [
          { key: 'firstName', label: 'First Name', type: 'string', description: 'User first name', icon: <User size={16} />, category: 'basic' },
          { key: 'lastName', label: 'Last Name', type: 'string', description: 'User last name', icon: <User size={16} />, category: 'basic' },
          { key: 'email', label: 'Email', type: 'string', description: 'User email address', icon: <User size={16} />, category: 'basic' },
          { key: 'role', label: 'User Role', type: 'string', description: 'User role in system', icon: <User size={16} />, category: 'basic' },
        ];
        setTemplateConfig(prev => ({
          ...prev,
          category: 'USER',
          type: 'USER_WELCOME',
          subject: 'Welcome {{firstName}} - Account Created'
        }));
        break;
    }
    
    setAvailableFields(fields);
  }, [selectedCategory]);

  // Group fields by category
  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);

  // Add field to section
  const addFieldToSection = (field: FieldDefinition, sectionId: string) => {
    const newField: TemplateField = {
      id: `${sectionId}_${field.key}_${Date.now()}`,
      key: field.key,
      label: field.label,
      type: field.type,
      enabled: true,
      customLabel: field.label,
      format: field.format,
      styling: {
        bold: field.required || false,
        italic: false,
        fontSize: 'base'
      }
    };

    setTemplateSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, fields: [...section.fields, newField] }
        : section
    ));
  };

  // Remove field from section
  const removeFieldFromSection = (sectionId: string, fieldId: string) => {
    setTemplateSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, fields: section.fields.filter(f => f.id !== fieldId) }
        : section
    ));
  };

  // Update field properties
  const updateField = (sectionId: string, fieldId: string, updates: Partial<TemplateField>) => {
    setTemplateSections(prev => prev.map(section =>
      section.id === sectionId
        ? { 
            ...section, 
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    ));
  };

  // Move field up/down within section
  const moveField = (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    setTemplateSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
        if (fieldIndex === -1) return section;
        
        const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
        if (newIndex < 0 || newIndex >= section.fields.length) return section;
        
        const newFields = [...section.fields];
        [newFields[fieldIndex], newFields[newIndex]] = [newFields[newIndex], newFields[fieldIndex]];
        
        return { ...section, fields: newFields };
      }
      return section;
    }));
  };

  // Add new section
  const addSection = () => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      name: `custom_section_${Date.now()}`,
      title: 'New Section',
      enabled: true,
      fields: []
    };
    
    setTemplateSections(prev => [...prev, newSection]);
    setExpandedSection(newSection.id);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setTemplateSections(prev => prev.filter(section => section.id !== sectionId));
    if (expandedSection === sectionId) {
      setExpandedSection(templateSections[0]?.id || '');
    }
  };

  // Generate template configuration
  const generateTemplateConfig = () => {
    const sections: Record<string, any> = {};
    const variables: string[] = [];

    templateSections.forEach(section => {
      if (section.enabled && section.fields.length > 0) {
        sections[section.name] = {
          enabled: true,
          title: section.title,
          fields: section.fields.reduce((acc, field) => {
            if (field.enabled) {
              acc[field.key] = {
                enabled: true,
                label: field.customLabel || field.label,
                format: field.format,
                styling: field.styling,
                conditional: field.conditional
              };
              
              // Add to variables list
              if (!variables.includes(field.key)) {
                variables.push(field.key);
              }
            }
            return acc;
          }, {} as Record<string, any>),
          styling: section.styling
        };
      }
    });

    return { sections, variables };
  };

  const categoryOptions = [
    { value: 'QUOTATION', label: 'Quotation Templates', icon: '📋', description: 'Templates for quotation emails with financial data' },
    { value: 'INVOICE', label: 'Invoice Templates', icon: '📄', description: 'Templates for invoice emails with payment details' }, 
    { value: 'USER', label: 'User Templates', icon: '👤', description: 'Templates for user account related emails' }
  ];

  const categoryColors = {
    basic: 'bg-blue-50 border-blue-200 text-blue-800',
    financial: 'bg-green-50 border-green-200 text-green-800',
    dates: 'bg-purple-50 border-purple-200 text-purple-800',
    metadata: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const categoryLabels = {
    basic: 'Basic Information',
    financial: 'Financial Data',
    dates: 'Date Fields',
    metadata: 'Additional Data'
  };

  // Auto-populate common sections based on category
  const autoPopulateTemplate = () => {
    let sectionsToPopulate: { [sectionId: string]: FieldDefinition[] } = {};
    
    if (selectedCategory === 'QUOTATION') {
      sectionsToPopulate = {
        main_content: availableFields.filter(f => ['quotationNumber', 'title', 'description', 'status', 'client.firstName', 'client.lastName'].includes(f.key)),
        financial_summary: availableFields.filter(f => ['subtotal', 'gstAmount', 'pstAmount', 'totalAmount'].includes(f.key))
      };
    } else if (selectedCategory === 'INVOICE') {
      sectionsToPopulate = {
        main_content: availableFields.filter(f => ['invoiceNumber', 'type', 'status', 'client.firstName', 'client.lastName'].includes(f.key)),
        financial_summary: availableFields.filter(f => ['subtotal', 'gstAmount', 'pstAmount', 'totalAmount', 'dueDate'].includes(f.key))
      };
    }
    
    // Clear existing fields and populate with suggested fields
    setTemplateSections(prev => prev.map(section => {
      if (sectionsToPopulate[section.id]) {
        const newFields: TemplateField[] = sectionsToPopulate[section.id].map(field => ({
          id: `${section.id}_${field.key}_${Date.now()}`,
          key: field.key,
          label: field.label,
          type: field.type,
          enabled: true,
          customLabel: field.label,
          format: field.format,
          styling: {
            bold: field.required || false,
            italic: false,
            fontSize: 'base'
          }
        }));
        return { ...section, fields: newFields };
      }
      return section;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dynamic Email Template Builder</h1>
        <p className="text-gray-600">Create dynamic email templates by selecting and configuring fields from your data models</p>
      </div>

      {/* Template Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
            <input
              type="text"
              value={templateConfig.name}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter template name..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Key *</label>
            <input
              type="text"
              value={templateConfig.templateKey}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, templateKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="template_key"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject *</label>
          <input
            type="text"
            value={templateConfig.subject}
            onChange={(e) => setTemplateConfig(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email subject with variables like {{clientName}}"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={templateConfig.description}
            onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Describe what this template is used for..."
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Template Category</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {categoryOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedCategory(option.value as any)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedCategory === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="font-medium mb-1">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
        
        <button
          onClick={autoPopulateTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Auto-populate Common Fields
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Available Fields Panel */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="text-green-600" size={20} />
                Available {selectedCategory} Fields
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click to add fields to sections
              </p>
            </div>
            
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <div key={category} className="mb-6">
                  <button
                    onClick={() => setExpandedCategories(prev => ({ 
                      ...prev, 
                      [category]: !prev[category] 
                    }))}
                    className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span className="uppercase tracking-wide">{categoryLabels[category as keyof typeof categoryLabels]} ({fields.length})</span>
                    {expandedCategories[category] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedCategories[category] && (
                    <div className="mt-2 space-y-2">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${categoryColors[field.category]}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-gray-600">{field.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{field.label}</div>
                              <div className="text-xs text-gray-600">{field.description}</div>
                              {field.required && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">Required</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1 flex-wrap">
                            {templateSections.map(section => (
                              <button
                                key={section.id}
                                onClick={() => addFieldToSection(field, section.id)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                + {section.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Sections Panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="text-blue-600" size={20} />
                  Template Structure
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configure your email template sections and fields
                </p>
              </div>
              
              <button 
                onClick={addSection}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add Section
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {templateSections.map(section => (
                <div key={section.id} className="border border-gray-200 rounded-lg">
                  {/* Section Header */}
                  <div 
                    className="p-4 bg-gray-50 border-b cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedSection(expandedSection === section.id ? '' : section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-gray-400 hover:text-gray-600">
                        {expandedSection === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          setTemplateSections(prev => prev.map(s => 
                            s.id === section.id ? { ...s, title: e.target.value } : s
                          ));
                        }}
                        className="font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                        {section.fields.length} fields
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => {
                          setTemplateSections(prev => prev.map(s => 
                            s.id === section.id ? { ...s, enabled: e.target.checked } : s
                          ));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {expandedSection === section.id && (
                    <div className="p-4">
                      {section.fields.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <Plus size={24} className="mx-auto mb-2 text-gray-400" />
                          <p>No fields added yet. Click on fields from the left panel to add them here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {section.fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col gap-1 pt-1">
                                  <button
                                    onClick={() => moveField(section.id, field.id, 'up')}
                                    disabled={index === 0}
                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    onClick={() => moveField(section.id, field.id, 'down')}
                                    disabled={index === section.fields.length - 1}
                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                                
                                <input
                                  type="checkbox"
                                  checked={field.enabled}
                                  onChange={(e) => updateField(section.id, field.id, { enabled: e.target.checked })}
                                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <input
                                      type="text"
                                      value={field.customLabel || field.label}
                                      onChange={(e) => updateField(section.id, field.id, { customLabel: e.target.value })}
                                      className="font-medium bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none"
                                    />
                                    
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                      {field.key}
                                    </span>
                                    
                                    {field.format && (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        {field.format}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm">
                                    <label className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={field.styling?.bold || false}
                                        // onChange={(e) => updateField(section.id, field.id, { 
                                        //   styling: { ...field.styling, bold: e.target.checked }
                                        // })}
                                        onChange={(e) =>
                                            updateField(section.id, field.id, { 
                                                styling: { 
                                                bold: e.target.checked, 
                                                italic: field.styling?.italic ?? false,   // ✅ ensure it exists
                                                color: field.styling?.color,
                                                fontSize: field.styling?.fontSize
                                                }
                                            })
                                            }
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                      />
                                      Bold
                                    </label>
                                    
                                    <select
                                      value={field.styling?.fontSize || 'base'}
                                    //   onChange={(e) => updateField(section.id, field.id, { 
                                    //     styling: { ...field.styling, fontSize: e.target.value as any }
                                    //   })}
                                    onChange={(e) =>
                                        updateField(section.id, field.id, {
                                            styling: {
                                            bold: field.styling?.bold ?? false,
                                            italic: field.styling?.italic ?? false,
                                            color: field.styling?.color,
                                            fontSize: e.target.value as "base" | "sm" | "lg" | "xl",
                                            },
                                        })
                                        }
                                      className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                      <option value="sm">Small</option>
                                      <option value="base">Normal</option>
                                      <option value="lg">Large</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => removeFieldFromSection(section.id, field.id)}
                                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generated Configuration Preview */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="text-gray-600" size={16} />
              Generated Configuration
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Sections ({Object.keys(generateTemplateConfig().sections).length})</h5>
                <div className="bg-white rounded border p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-600">
                    {JSON.stringify(generateTemplateConfig().sections, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Variables ({generateTemplateConfig().variables.length})</h5>
                <div className="bg-white rounded border p-3 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {generateTemplateConfig().variables.map(variable => (
                      <span key={variable} className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded font-mono">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  const config = generateTemplateConfig();
                  console.log('Template Configuration:', {
                    ...templateConfig,
                    sections: config.sections,
                    variables: config.variables
                  });
                  alert('Configuration logged to console. Ready to save template!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Generate Template
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Eye size={16} />
                Preview Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicEmailTemplateBuilder;