'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon, TrashIcon, PencilIcon, FolderIcon, FolderPlusIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { FormConfig, FormField, FieldType } from '@/lib/types/form';
import { getFormConfig, saveFormConfig } from '@/lib/firebase/form';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'date', label: 'Date' },
];

interface SortableFieldProps {
  field: FormField;
  isEditing: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onGroupChange: (id: string, group: string) => void;
  groups: string[];
}

function OptionEditor({ options, onChange }: { options: { label: string; value: string }[]; onChange: (opts: { label: string; value: string }[]) => void }) {
  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = { label: value, value };
    onChange(newOptions);
  };
  const handleAddOption = () => onChange([...options, { label: '', value: '' }]);
  const handleRemoveOption = (idx: number) => onChange(options.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            value={opt.label}
            onChange={e => handleOptionChange(idx, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            placeholder={`Option ${idx + 1}`}
          />
          <button type="button" onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={handleAddOption} className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-1"><PlusIcon className="h-4 w-4" />Add Option</button>
    </div>
  );
}

function SortableField({ field, isEditing, onEdit, onDelete, onUpdate, onGroupChange, groups }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 p-4 border border-gray-200 rounded-lg bg-white"
    >
      {isEditing === field.id ? (
        <div className="space-y-4">
          <div>
            <label htmlFor={`label-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              id={`label-${field.id}`}
              type="text"
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter field label"
            />
          </div>
          <div>
            <label htmlFor={`description-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Field Description
            </label>
            <textarea
              id={`description-${field.id}`}
              value={field.description || ''}
              onChange={(e) => onUpdate(field.id, { description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter field description"
              rows={2}
            />
          </div>
          <div>
            <label htmlFor={`type-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              id={`type-${field.id}`}
              value={field.type}
              onChange={e => {
                const newType = e.target.value as FieldType;
                const updates: Partial<FormField> = { type: newType };
                if (["select", "checkbox", "radio"].includes(newType) && !field.options) {
                  updates.options = [{ label: '', value: '' }];
                } else if (!["select", "checkbox", "radio"].includes(newType)) {
                  updates.options = undefined;
                }
                onUpdate(field.id, updates);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`group-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Field Group
            </label>
            <div className="flex gap-2">
              <select
                id={`group-${field.id}`}
                value={field.group || ''}
                onChange={(e) => onGroupChange(field.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Group</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const newGroup = prompt('Enter new group name:');
                  if (newGroup && !groups.includes(newGroup)) {
                    onGroupChange(field.id, newGroup);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FolderPlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <input
              id={`required-${field.id}`}
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-900">
              Required
            </label>
          </div>
          {["select", "checkbox", "radio"].includes(field.type) && (
            <OptionEditor options={field.options || [{ label: '', value: '' }]} onChange={opts => onUpdate(field.id, { options: opts })} />
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onEdit('')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{field.label}</h3>
            {field.description && (
              <p className="text-sm text-gray-500 mt-1">{field.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{field.type}</span>
              {field.group && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {field.group}
                </span>
              )}
              {field.required && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Required
                </span>
              )}
            </div>
            {field.options && field.options.length > 0 && (
              <ul className="mt-2 ml-4 list-disc text-xs text-gray-600">
                {field.options.map((opt, i) => <li key={i}>{opt.label}</li>)}
              </ul>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(field.id)}
              className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Edit field"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(field.id)}
              className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label="Delete field"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <div
              {...attributes}
              {...listeners}
              className="p-1 text-gray-400 hover:text-gray-500 cursor-move"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Default config for new/empty form
const defaultFormConfig: FormConfig = {
  id: 'default-form',
  title: 'Default Form',
  fields: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default function FormEditor() {
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<string[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupSelect, setShowGroupSelect] = useState(false);
  const [pendingFieldGroup, setPendingFieldGroup] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadFormConfig();
  }, []);

  useEffect(() => {
    // Update groups list whenever fields change
    const uniqueGroups = Array.from(new Set(
      formConfig.fields
        .map(field => field.group)
        .filter((group): group is string => !!group)
    ));
    setGroups(uniqueGroups);
  }, [formConfig.fields]);

  const loadFormConfig = async () => {
    try {
      const config = await getFormConfig();
      setFormConfig(config || { ...defaultFormConfig, createdAt: Date.now(), updatedAt: Date.now() });
    } catch (error) {
      console.error('Error loading form config:', error);
      toast.error('Failed to load form configuration');
      setFormConfig({ ...defaultFormConfig, createdAt: Date.now(), updatedAt: Date.now() });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = formConfig.fields.findIndex((field) => field.id === active.id);
      const newIndex = formConfig.fields.findIndex((field) => field.id === over.id);

      setFormConfig({
        ...formConfig,
        fields: arrayMove(formConfig.fields, oldIndex, newIndex),
      });
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      setGroups([...groups, newGroupName.trim()]);
      setNewGroupName("");
      setShowAddGroup(false);
    }
  };

  const addField = () => {
    setShowGroupSelect(true);
    setPendingFieldGroup('');
    setNewGroupName('');
  };

  const handleAddFieldToGroup = (group: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      description: '',
      required: false,
      group: group === 'Individual' ? '' : group,
      options: undefined,
    };
    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, newField],
      updatedAt: Date.now(),
    });
    setIsEditing(newField.id);
    setShowGroupSelect(false);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    const fields = formConfig.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFormConfig({ ...formConfig, fields, updatedAt: Date.now() });
  };

  const handleGroupChange = (fieldId: string, group: string) => {
    updateField(fieldId, { group });
  };

  const deleteField = (fieldId: string) => {
    const fields = formConfig.fields.filter(field => field.id !== fieldId);
    setFormConfig({ ...formConfig, fields, updatedAt: Date.now() });
  };

  const saveConfig = async () => {
    try {
      const cleanedFields = formConfig.fields.map(field => {
        const cleaned = { ...field };
        if (cleaned.options === undefined) {
          delete cleaned.options;
        }
        return cleaned;
      });
      await saveFormConfig({
        title: formConfig.title,
        fields: cleanedFields,
      });
      toast.success('Form configuration saved successfully');
    } catch (error) {
      console.error('Error saving form config:', error);
      toast.error('Failed to save form configuration');
    }
  };

  // Grouped fields for rendering
  const groupedFields: { [group: string]: FormField[] } = {};
  formConfig.fields.forEach(field => {
    const group = field.group || "Ungrouped";
    if (!groupedFields[group]) groupedFields[group] = [];
    groupedFields[group].push(field);
  });

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Form Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={addField}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Add Field
          </button>
          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Save Configuration
          </button>
        </div>
      </div>
      {showAddGroup && (
        <div className="flex gap-2 items-center mb-4">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            placeholder="New group name"
            autoFocus
          />
          <button onClick={handleAddGroup} className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add</button>
          <button onClick={() => setShowAddGroup(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
        </div>
      )}
      {/* Group select modal/dialog */}
      <Dialog open={showGroupSelect} onClose={() => setShowGroupSelect(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded-lg max-w-sm w-full mx-auto p-6 z-20">
            <Dialog.Title className="text-lg font-bold mb-4 text-gray-900">Select Group for New Field</Dialog.Title>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-left text-gray-900 font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleAddFieldToGroup('Individual')}
              >
                Individual <span className="text-xs text-gray-500">(No group)</span>
              </button>
              {groups.map(group => (
                <button
                  key={group}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-left text-gray-900 font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleAddFieldToGroup(group)}
                >
                  {group}
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New group name"
                />
                <button
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={() => {
                    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
                      setGroups([...groups, newGroupName.trim()]);
                      handleAddFieldToGroup(newGroupName.trim());
                      setNewGroupName('');
                    }
                  }}
                  disabled={!newGroupName.trim() || groups.includes(newGroupName.trim())}
                >
                  Add
                </button>
              </div>
            </div>
            <button
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowGroupSelect(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Dialog>
      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group} className="mb-8">
          <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <Bars3Icon className="h-5 w-5" /> {group}
          </h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map(field => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isEditing={isEditing}
                  onEdit={setIsEditing}
                  onDelete={deleteField}
                  onUpdate={updateField}
                  onGroupChange={handleGroupChange}
                  groups={groups}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  );
} 