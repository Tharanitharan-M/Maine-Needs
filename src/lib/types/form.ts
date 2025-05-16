export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  conditional?: {
    fieldId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number | boolean;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  description?: string;
  group?: string;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: number;
  updatedAt: number;
} 