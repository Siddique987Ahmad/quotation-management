import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Copy, Send, Eye, 
  Power, Mail, FileText, User, Cog, Paintbrush
} from 'lucide-react';

// Import actual API and types
import { emailTemplatesAPI } from '../../services/api';
import { 
  EmailTemplate, 
  EmailTemplateCategory, 
  EmailTemplateType,
  CreateTemplateData,
  UpdateTemplateData,
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  DEFAULT_TEMPLATES
} from '../../types';

// Notification type
interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Preview data type
interface PreviewData {
  html: string;
  subject?: string;
  text?: string | null;
  variables?: string[]; // optional list of template variables returned by preview API
  fallbackPreview?: string; // optional fallback preview content
}


const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<EmailTemplateCategory | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [testEmail, setTestEmail] = useState<string>('');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Form states with proper typing
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    templateKey: '',
    description: '',
    category: EmailTemplateCategory.CUSTOM,
    type: EmailTemplateType.CUSTOM,
    subject: '',
    htmlContent: DEFAULT_TEMPLATES.basic,
    variables: [],
    sections: {}   // ✅ added default empty object
  });

  const htmlEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // const loadTemplates = async (): Promise<void> => {
  //   try {
  //     setLoading(true);
  //     const response = await emailTemplatesAPI.getAll();
  //     const templatesData = response.data.data?.templates || [];
      
  //     // Handle both array and object responses from backend
  //     const templatesArray = Array.isArray(templatesData) 
  //       ? templatesData 
  //       : Object.values(templatesData);
      
  //     setTemplates(templatesArray);
      
  //     // If no templates exist, seed defaults
  //     if (templatesArray.length === 0) {
  //       await seedDefaultTemplates();
  //     }
  //   } catch (error) {
  //     console.error('Failed to load templates:', error);
  //     showNotification('Failed to load templates', 'error');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const loadTemplates = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await emailTemplatesAPI.getAll();
      const templatesData = response.data.data?.templates || [];
      
      // Handle both array and object responses from backend with proper typing
      const templatesArray: EmailTemplate[] = Array.isArray(templatesData) 
        ? templatesData as EmailTemplate[]
        : Object.values(templatesData) as EmailTemplate[];
      
      setTemplates(templatesArray);
      
      // If no templates exist, seed defaults
      if (templatesArray.length === 0) {
        await seedDefaultTemplates();
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      showNotification('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultTemplates = async (): Promise<void> => {
    try {
      await emailTemplatesAPI.seedDefaults();
      showNotification('Default templates created successfully', 'success');
      // Reload templates after seeding
      setTimeout(() => loadTemplates(), 1000);
    } catch (error) {
      console.error('Failed to create default templates:', error);
      showNotification('Failed to create default templates', 'error');
    }
  };

  const showNotification = (message: string, type: NotificationState['type'] = 'info'): void => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (): Promise<void> => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.htmlContent.trim()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const templateData: CreateTemplateData = {
        ...formData,
        templateKey: formData.templateKey || generateTemplateKey(formData.name),
        variables: extractVariablesFromHTML(formData.htmlContent),
        htmlContent: formData.htmlContent.trim()
      };

      await emailTemplatesAPI.create(templateData);
      showNotification('Template created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      showNotification('Failed to create template', 'error');
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!selectedTemplate || !formData.name.trim() || !formData.subject.trim() || !formData.htmlContent.trim()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const updateData: UpdateTemplateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        subject: formData.subject,
        htmlContent: formData.htmlContent,
        variables: extractVariablesFromHTML(formData.htmlContent),
        sections: formData.sections || {}  // ✅ ensure sections is always an object
      };

      await emailTemplatesAPI.update(selectedTemplate.templateKey, updateData);
      showNotification('Template updated successfully', 'success');
      setShowEditModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      showNotification('Failed to update template', 'error');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedTemplate) return;

    try {
      await emailTemplatesAPI.delete(selectedTemplate.templateKey);
      showNotification('Template deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showNotification('Failed to delete template', 'error');
    }
  };

  const handleDuplicate = async (template: EmailTemplate): Promise<void> => {
    try {
      const newName = `${template.name} Copy`;
      const newKey = generateTemplateKey(newName);
      
      await emailTemplatesAPI.duplicate(template.templateKey, {
        newTemplateKey: newKey,
        newName: newName
      });
      
      showNotification('Template duplicated successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      showNotification('Failed to duplicate template', 'error');
    }
  };

  const handleToggle = async (template: EmailTemplate): Promise<void> => {
    try {
      await emailTemplatesAPI.toggle(template.templateKey);
      showNotification(`Template ${template.enabled ? 'disabled' : 'enabled'}`, 'success');
      loadTemplates();
    } catch (error) {
      console.error('Failed to toggle template:', error);
      showNotification('Failed to toggle template', 'error');
    }
  };

  // const handlePreview = async (template: EmailTemplate): Promise<void> => {
  //   try {
  //     setSelectedTemplate(template);
  //     const response = await emailTemplatesAPI.preview({
  //       templateKey: template.templateKey
  //     });
      
  //     const previewResult = response.data.data?.template || { html: template.htmlContent };
  //     setPreviewData(previewResult);
  //     setShowPreviewModal(true);
  //   } catch (error) {
  //     console.error('Failed to generate preview:', error);
  //     showNotification('Failed to generate preview', 'error');
  //   }
  // };
  
  const handlePreview = async (template: EmailTemplate): Promise<void> => {
  try {
    setSelectedTemplate(template);
    
    const response = await emailTemplatesAPI.preview({
      templateKey: template.templateKey
    });
    
    // Handle different response structures
    const responseData = response.data.data;
    const previewResult = responseData?.template || { 
      html: template.htmlContent || '<p>No content available</p>',
      subject: template.subject,
      text: template.textContent || null
    };
    
    setPreviewData(previewResult);
    setShowPreviewModal(true);
    
    // Show warnings if any (guard with a runtime type check to satisfy TypeScript)
    const warnings = (responseData as any)?.warnings;
    if (Array.isArray(warnings) && warnings.length > 0) {
      warnings.forEach((warning: string) => {
        showNotification(warning, 'info');
      });
    }
    
  } catch (error) {
    console.error('Failed to generate preview:', error);
    
    // Fallback to showing basic template content
    const fallbackPreview = {
      html: template.htmlContent || '<p>Template content not available</p>',
      subject: template.subject,
      text: template.textContent || null
    };
    
    setSelectedTemplate(template);
    setPreviewData(fallbackPreview);
    setShowPreviewModal(true);
    
    showNotification('Preview generated with limited data', 'info');
  }
};
  
  const handleTestSend = async (): Promise<void> => {
    if (!testEmail.trim()) {
      showNotification('Please enter a test email address', 'error');
      return;
    }

    if (!selectedTemplate) {
      showNotification('No template selected', 'error');
      return;
    }

    try {
      await emailTemplatesAPI.testSend({
        templateKey: selectedTemplate.templateKey,
        testEmail: testEmail.trim()
      });
      showNotification(`Test email sent to ${testEmail}`, 'success');
      setTestEmail('');
    } catch (error) {
      console.error('Failed to send test email:', error);
      showNotification('Failed to send test email', 'error');
    }
  };

  const openEditModal = (template: EmailTemplate): void => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      templateKey: template.templateKey,
      description: template.description || '',
      category: template.category,
      type: template.type,
      subject: template.subject,
      htmlContent: template.htmlContent,
      variables: template.variables || []
    });
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setFormData({
      name: '',
      templateKey: '',
      description: '',
      category: EmailTemplateCategory.CUSTOM,
      type: EmailTemplateType.CUSTOM,
      subject: '',
      htmlContent: DEFAULT_TEMPLATES.basic,
      variables: []
    });
    setSelectedTemplate(null);
  };

  const generateTemplateKey = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  };

  const extractVariablesFromHTML = (html: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const filteredTemplates = templates.filter((template: EmailTemplate) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = template.name.toLowerCase().includes(searchLower) ||
                         template.description?.toLowerCase().includes(searchLower) ||
                         template.templateKey.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'ALL' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const insertVariable = (variable: string): void => {
    const variableTag = `{{${variable}}}`;
    setFormData(prev => ({
      ...prev,
      htmlContent: prev.htmlContent + ' ' + variableTag
    }));
  };

  const getCategoryIcon = (category: EmailTemplateCategory) => {
    switch (category) {
      case EmailTemplateCategory.QUOTATION:
        return <FileText className="w-4 h-4" />;
      case EmailTemplateCategory.INVOICE:
        return <FileText className="w-4 h-4" />;
      case EmailTemplateCategory.USER:
        return <User className="w-4 h-4" />;
      case EmailTemplateCategory.SYSTEM:
        return <Cog className="w-4 h-4" />;
      case EmailTemplateCategory.CUSTOM:
        return <Paintbrush className="w-4 h-4" />;
      default:
        return <Paintbrush className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: EmailTemplateCategory): string => {
    const colors = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colors[TEMPLATE_CATEGORIES[category]?.color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-2">Manage your email templates and customize communications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as EmailTemplateCategory | 'ALL')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.templateKey} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(template.category)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.templateKey}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                      {TEMPLATE_CATEGORIES[template.category]?.label}
                    </span>
                    {template.isSystem && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Variables: {template.variables?.length || 0}</span>
                  <span className={template.enabled ? 'text-green-600' : 'text-red-600'}>
                    {template.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handlePreview(template)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(template)}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  {!template.isSystem && (
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new email template.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              New Template
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {showEditModal ? 'Edit Template' : 'Create New Template'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        templateKey: showCreateModal ? generateTemplateKey(name) : prev.templateKey
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Key
                  </label>
                  <input
                    type="text"
                    value={formData.templateKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateKey: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    disabled={showEditModal}
                    placeholder="auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as EmailTemplateCategory }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EmailTemplateType }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.keys(EmailTemplateType).map((key) => (
                      <option key={key} value={key}>{key.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description for this template"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to {{companyName}}, {{clientName}}!"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Available Variables */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES[formData.type]?.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* HTML Content Editor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content *
                </label>
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">HTML Editor</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, htmlContent: DEFAULT_TEMPLATES.basic }))}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Basic Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, htmlContent: DEFAULT_TEMPLATES.quotation }))}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Quotation Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, htmlContent: DEFAULT_TEMPLATES.invoice }))}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Invoice Template
                        </button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    ref={htmlEditorRef}
                    rows={12}
                    value={formData.htmlContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="Enter your HTML content here..."
                    className="w-full px-4 py-3 border-0 focus:ring-0 font-mono text-sm resize-none"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Use variables like {`{clientName}`} in your HTML. Click the template buttons above for starter templates.
                </p>
              </div>

              {/* Live Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Preview
                </label>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formData.htmlContent.replace(/\{\{(\w+)\}\}/g, '<span style="background-color: yellow; padding: 2px 4px; border-radius: 3px; font-size: 12px;">$1</span>')
                    }} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showEditModal ? handleUpdate : handleCreate}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {showEditModal ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedTemplate.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {/* {showPreviewModal && previewData && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={handleTestSend}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Test Send
                  </button>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Subject:</h4>
                <p className="text-gray-900">{selectedTemplate.subject}</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
              </div>
            </div>
          </div>
        </div>
      )} */}

      {showPreviewModal && previewData && selectedTemplate && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Preview</h3>
          <p className="text-sm text-gray-500">{selectedTemplate.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleTestSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Test Send
            </button>
          </div>
          <button
            onClick={() => setShowPreviewModal(false)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {/* Subject Line */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-1">Subject Line:</h4>
          <div className="bg-gray-50 p-3 rounded border">
            <p className="text-gray-900">{previewData.subject || selectedTemplate.subject}</p>
          </div>
        </div>
        
        {/* Variables Info */}
        {previewData.variables && previewData.variables.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Template Variables:</h4>
            <div className="flex flex-wrap gap-2">
              {previewData.variables.map((variable: string) => (
                <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* HTML Preview */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Email Content:</h4>
          <div className="border rounded-lg p-4 bg-white min-h-[200px] overflow-auto">
            {previewData.html ? (
              <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
            ) : (
              <div className="text-gray-500 italic">No content available</div>
            )}
          </div>
        </div>
        
        {/* Text Version (if available) */}
        {previewData.text && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Plain Text Version:</h4>
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap">
              {previewData.text}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;