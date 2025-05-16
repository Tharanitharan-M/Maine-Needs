'use client';

import { useState, useEffect } from 'react';
import { FormConfig, FormField } from '@/lib/types/form';
import { getFormConfig } from '@/lib/firebase/form';
import toast from 'react-hot-toast';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function NewRequest() {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFormConfig();
  }, []);

  const loadFormConfig = async () => {
    try {
      const config = await getFormConfig();
      setFormConfig(config);
      if (config) {
        const initialData = config.fields.reduce((acc, field) => {
          acc[field.id] = '';
          return acc;
        }, {} as Record<string, any>);
        setFormData(initialData);
      }
    } catch (error) {
      toast.error('Failed to load form configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional) return true;

    const { fieldId, operator, value } = field.conditional;
    const dependentValue = formData[fieldId];

    switch (operator) {
      case 'equals':
        return dependentValue === value;
      case 'notEquals':
        return dependentValue !== value;
      case 'contains':
        return String(dependentValue).includes(String(value));
      case 'greaterThan':
        return Number(dependentValue) > Number(value);
      case 'lessThan':
        return Number(dependentValue) < Number(value);
      default:
        return true;
    }
  };

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      placeholder: field.placeholder,
      className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 text-base",
      value: formData[field.id] || '',
      onChange: (e: any) => handleInputChange(field.id, e.target.value),
    };

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type}
            {...commonProps}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            {...commonProps}
            checked={formData[field.id] || false}
            onChange={(e) => handleInputChange(field.id, e.target.checked)}
            className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-gray-300 rounded"
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  value={option.value}
                  checked={formData[field.id] === option.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-gray-300"
                />
                <label htmlFor={`${field.id}-${option.value}`} className="ml-2 block text-sm text-gray-900">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'requests'), {
        ...formData,
        submittedAt: new Date().toISOString(),
      });
      toast.success('Form submitted successfully');
      setFormData({}); // Optionally reset form
    } catch (err) {
      toast.error('Failed to submit request');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!formConfig) {
    return <div className="text-center text-red-600">No form configuration found</div>;
  }

  // Group fields by group name
  const groupedFields: { [group: string]: typeof formConfig.fields } = {};
  formConfig.fields.forEach(field => {
    const group = field.group || 'Individual';
    if (!groupedFields[group]) groupedFields[group] = [];
    groupedFields[group].push(field);
  });

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-[#003366] mb-2">{formConfig.title || 'Request Form'}</h2>
      {formConfig.description ? (
        <p className="text-gray-600 mb-6">{formConfig.description}</p>
      ) : (
        <p className="text-gray-500 mb-6">Please fill out the form below to submit your request. All information will be kept confidential.</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(groupedFields).map(([group, fields]) => (
          <div key={group} className="mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">{group}</h3>
            <div className="space-y-6">
              {fields.map(field => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.description && (
                    <div className="text-xs text-gray-500 mb-1">{field.description}</div>
                  )}
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="bg-[#003366] text-white px-6 py-2 rounded-md hover:bg-[#0052A3] font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366]"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
} 