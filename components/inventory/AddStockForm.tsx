// --- AddStockForm.premium.tsx ---
// Final Premium UI Version — Clean, Clinical, Modern
// With Dynamic Options Saving

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  THEME,
  StockFormData,
  AddStockFormProps,
  INVENTORY_CATEGORIES,
  UNIT_MAPPINGS,
  MASTER_ITEMS_CATALOG,
  InventoryItem,
  UNIQUE_ITEM_NAMES,
  UNIQUE_SUPPLIERS,
} from '../../types/InventoryTypes';
import {
  loadAllCustomOptions,
  addCustomCategory,
  addCustomUnit,
  addCustomItemName,
  addCustomSupplier,
  CustomUnits,
} from '../../src/storage/customOptionsStorage';

type Extras = {
  onCheckDuplicate?: (data: StockFormData) => boolean;
  onCreateNewItem?: (name: string) => void;
  onClose?: () => void;
};

// Custom Dropdown Component with Add New Option
interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  onAddNew?: (newValue: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  allowAddNew?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
  onAddNew,
  error,
  disabled = false,
  icon = 'chevron-down-outline',
  allowAddNew = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newValue, setNewValue] = useState('');

  const handleAddNew = () => {
    if (newValue.trim()) {
      onAddNew?.(newValue.trim());
      onSelect(newValue.trim());
      setNewValue('');
      setShowAddNew(false);
      setModalVisible(false);
    }
  };

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          dropdownStyles.button,
          error && dropdownStyles.buttonError,
          disabled && dropdownStyles.buttonDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[dropdownStyles.buttonText, !value && dropdownStyles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={20} color={disabled ? '#ccc' : THEME.primary} />
      </TouchableOpacity>
      {error && <Text style={dropdownStyles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={dropdownStyles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={dropdownStyles.modalContainer}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={THEME.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Add New Input Section */}
            {allowAddNew && (
              <View style={dropdownStyles.addNewSection}>
                {showAddNew ? (
                  <View style={dropdownStyles.addNewInputRow}>
                    <TextInput
                      style={dropdownStyles.addNewInput}
                      placeholder={`Type new ${label.toLowerCase().replace(' *', '')}...`}
                      value={newValue}
                      onChangeText={setNewValue}
                      autoFocus
                    />
                    <TouchableOpacity 
                      style={dropdownStyles.addNewBtn}
                      onPress={handleAddNew}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={dropdownStyles.cancelNewBtn}
                      onPress={() => { setShowAddNew(false); setNewValue(''); }}
                    >
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={dropdownStyles.addNewTrigger}
                    onPress={() => setShowAddNew(true)}
                  >
                    <Ionicons name="add-circle-outline" size={22} color={THEME.primary} />
                    <Text style={dropdownStyles.addNewTriggerText}>Add New {label.replace(' *', '')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <ScrollView style={dropdownStyles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    dropdownStyles.optionItem,
                    value === option && dropdownStyles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      dropdownStyles.optionText,
                      value === option && dropdownStyles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark-circle" size={22} color={THEME.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Autocomplete Dropdown for Item Names and Suppliers
interface AutocompleteDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  onChangeText: (value: string) => void;
  onAddNew?: (newValue: string) => void;
  error?: string;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
  onChangeText,
  onAddNew,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [options, searchText]);

  const handleOpenModal = () => {
    setSearchText(value);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    if (searchText.trim()) {
      onAddNew?.(searchText.trim());
      onSelect(searchText.trim());
      onChangeText(searchText.trim());
      setModalVisible(false);
    }
  };

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[dropdownStyles.button, error && dropdownStyles.buttonError]}
        onPress={handleOpenModal}
      >
        <Text style={[dropdownStyles.buttonText, !value && dropdownStyles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="search-outline" size={20} color={THEME.primary} />
      </TouchableOpacity>
      {error && <Text style={dropdownStyles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={dropdownStyles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={dropdownStyles.modalContainer}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={THEME.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={dropdownStyles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
              <TextInput
                style={dropdownStyles.searchInput}
                placeholder="Type to search or add new..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>

            <ScrollView style={dropdownStyles.optionsList}>
              {/* Option to add and SAVE typed value if not in list */}
              {searchText && !options.some(o => o.toLowerCase() === searchText.toLowerCase()) && (
                <TouchableOpacity
                  style={[dropdownStyles.optionItem, dropdownStyles.newItemOption]}
                  onPress={handleAddNew}
                >
                  <Ionicons name="add-circle-outline" size={22} color={THEME.primary} />
                  <Text style={[dropdownStyles.optionText, { marginLeft: 8, color: THEME.primary }]}>
                    Add & Save "{searchText}"
                  </Text>
                </TouchableOpacity>
              )}
              
              {filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    dropdownStyles.optionItem,
                    value === option && dropdownStyles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    onChangeText(option);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      dropdownStyles.optionText,
                      value === option && dropdownStyles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark-circle" size={22} color={THEME.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const AddStockForm: React.FC<AddStockFormProps & Extras> = ({
  onStockAdded,
  onCheckDuplicate,
  onCreateNewItem,
  onClose,
}) => {
  const initialFormState: StockFormData = {
    itemName: '',
    category: '',
    quantity: '',
    unit: '',
    supplier: '',
    expiryDate: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof StockFormData, string>>>({});
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [messageVisible, setMessageVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Custom Options State ---
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<CustomUnits>({});
  const [customItemNames, setCustomItemNames] = useState<string[]>([]);
  const [customSuppliers, setCustomSuppliers] = useState<string[]>([]);

  // Load custom options on mount
  useEffect(() => {
    loadAllCustomOptions().then((options) => {
      setCustomCategories(options.categories);
      setCustomUnits(options.units);
      setCustomItemNames(options.itemNames);
      setCustomSuppliers(options.suppliers);
    });
  }, []);

  // Combined options (default + custom)
  const allCategories = useMemo(() => {
    const combined = [...INVENTORY_CATEGORIES, ...customCategories];
    return [...new Set(combined)]; // Remove duplicates
  }, [customCategories]);

  const allItemNames = useMemo(() => {
    const combined = [...UNIQUE_ITEM_NAMES, ...customItemNames];
    return [...new Set(combined)];
  }, [customItemNames]);

  const allSuppliers = useMemo(() => {
    const combined = [...UNIQUE_SUPPLIERS, ...customSuppliers];
    return [...new Set(combined)];
  }, [customSuppliers]);

  const availableUnits = useMemo(() => {
    const defaultUnits = UNIT_MAPPINGS[formData.category] || UNIT_MAPPINGS.Other || [];
    const customUnitList = customUnits[formData.category] || [];
    const combined = [...defaultUnits, ...customUnitList];
    return [...new Set(combined)];
  }, [formData.category, customUnits]);

  // --- Handlers to Add New Options ---
  const handleAddCategory = async (newCategory: string) => {
    const updated = await addCustomCategory(newCategory);
    setCustomCategories(updated);
  };

  const handleAddUnit = async (newUnit: string) => {
    if (formData.category) {
      const updated = await addCustomUnit(formData.category, newUnit);
      setCustomUnits(updated);
    }
  };

  const handleAddItemName = async (newName: string) => {
    const updated = await addCustomItemName(newName);
    setCustomItemNames(updated);
  };

  const handleAddSupplier = async (newSupplier: string) => {
    const updated = await addCustomSupplier(newSupplier);
    setCustomSuppliers(updated);
  };

  const isExpired = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry.getTime() < today.getTime();
  }, []);

  const daysLeft = useMemo(() => {
    if (!formData.expiryDate) return null;
    const exp = new Date(formData.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [formData.expiryDate]);

  const liveValidate = useCallback(
    (field: keyof StockFormData, value: string) => {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];

        if (field === 'quantity') {
          const q = parseFloat(value);
          if (isNaN(q) || q <= 0) next.quantity = 'Quantity must be positive.';
        }

        if (field === 'expiryDate') {
          if (!value) next.expiryDate = 'Expiry date is required.';
          else if (isExpired(value)) next.expiryDate = 'This date is expired.';
        }

        // Unit validation - use dynamic units including custom ones
        if (field === 'unit' || field === 'category') {
          const unit = field === 'unit' ? value : formData.unit;
          const category = field === 'category' ? value : formData.category;
          const defaultUnits = UNIT_MAPPINGS[category] || UNIT_MAPPINGS.Other || [];
          const customUnitList = customUnits[category] || [];
          const allowed = [...defaultUnits, ...customUnitList];
          if (unit && !allowed.includes(unit)) next.unit = 'Invalid unit for this category.';
        }

        return next;
      });
    },
    [formData.unit, formData.category, isExpired, customUnits],
  );

  const findMatch = useCallback((typed: string): InventoryItem | undefined => {
    if (!typed) return undefined;
    const clean = typed.toLowerCase();

    return (
      MASTER_ITEMS_CATALOG.find((i) => i.name.toLowerCase() === clean) ||
      MASTER_ITEMS_CATALOG.find((i) => clean.includes(i.name.toLowerCase())) ||
      MASTER_ITEMS_CATALOG.find((i) => i.name.toLowerCase().includes(clean)) ||
      MASTER_ITEMS_CATALOG.find((i) => i.name.toLowerCase().startsWith(clean))
    );
  }, []);

  const handleChange = useCallback(
    (field: keyof StockFormData, value: string) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };

        if (field === 'category') {
          next.unit = (UNIT_MAPPINGS[value] || [])[0] || '';
        }

        if (field === 'itemName') {
          const match = findMatch(value);
          if (match) {
            next.category = match.category;
            next.unit =
              match.unit || next.unit || (UNIT_MAPPINGS[match.category] || [])[0] || '';
            next.supplier = match.supplier;
          }
        }

        return next;
      });

      liveValidate(field, value);

      setSubmissionMessage(null);
      setMessageVisible(false);
    },
    [findMatch, liveValidate],
  );

  const validate = useCallback(() => {
    const e: Partial<Record<keyof StockFormData, string>> = {};
    let ok = true;

    if (!formData.itemName.trim()) {
      e.itemName = 'Item name is required.';
      ok = false;
    }
    if (!formData.category) {
      e.category = 'Category is required.';
      ok = false;
    }

    const q = parseFloat(formData.quantity);
    if (!q || q <= 0) {
      e.quantity = 'Enter a valid quantity.';
      ok = false;
    }

    if (!formData.expiryDate) {
      e.expiryDate = 'Expiry date required.';
      ok = false;
    } else if (isExpired(formData.expiryDate)) {
      e.expiryDate = 'This date is expired.';
      ok = false;
    }

    // Use dynamic units including custom ones
    const defaultUnits = UNIT_MAPPINGS[formData.category] || [];
    const customUnitList = customUnits[formData.category] || [];
    const allowed = [...defaultUnits, ...customUnitList];
    if (formData.unit && !allowed.includes(formData.unit)) {
      e.unit = 'Invalid unit for this category.';
      ok = false;
    }

    setErrors(e);
    return ok;
  }, [formData, isExpired, customUnits]);

  const handleSubmit = () => {
      setIsSubmitting(true);

      if (!validate()) {
        setSubmissionMessage('🚫 Fix the errors and try again.');
        setMessageVisible(true);
        setIsSubmitting(false);
        return;
      }

      if (onCheckDuplicate && onCheckDuplicate(formData)) {
        setSubmissionMessage('⚠️ This item already exists.');
        setMessageVisible(true);
        setIsSubmitting(false);
        return;
      }

      try {
        onStockAdded(formData);
        setSubmissionMessage('✅ Added Successfully!');
        setMessageVisible(true);

        setTimeout(() => {
          setMessageVisible(false);
          setSubmissionMessage(null);
        }, 1800);

        setFormData({
          ...initialFormState,
          supplier: formData.supplier,
        });
        setErrors({});
      } catch {
        setSubmissionMessage('❌ Unexpected error.');
        setMessageVisible(true);
      } finally {
        setIsSubmitting(false);
      }
    };

  const canAddToCatalog = useMemo(() => {
    const name = formData.itemName.trim();
    if (name.length < 3) return false;
    return !UNIQUE_ITEM_NAMES.some((n) => n.toLowerCase() === name.toLowerCase());
  }, [formData.itemName]);

  // Date picker modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPickerDate, setCurrentPickerDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentPickerDate.getFullYear(), currentPickerDate.getMonth(), day);
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const dateStr = String(selected.getDate()).padStart(2, '0');
    handleChange('expiryDate', `${year}-${month}-${dateStr}`);
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.title}>Add New Inventory Item</Text>

      {submissionMessage && (
        <View style={[
          formStyles.messageBox,
          { backgroundColor: submissionMessage.startsWith('✅') ? THEME.success : THEME.danger }
        ]}>
          <Text style={formStyles.messageText}>{submissionMessage}</Text>
        </View>
      )}

      {/* Item Name - Autocomplete */}
      <AutocompleteDropdown
        label="Item Name *"
        value={formData.itemName}
        placeholder="Type or pick an existing item..."
        options={allItemNames}
        onSelect={(value) => handleChange('itemName', value)}
        onChangeText={(value) => handleChange('itemName', value)}
        onAddNew={handleAddItemName}
        error={errors.itemName}
      />

      {/* Category */}
      <CustomDropdown
        label="Category *"
        value={formData.category}
        placeholder="Select the Material Type"
        options={allCategories}
        onSelect={(value) => handleChange('category', value)}
        onAddNew={handleAddCategory}
        error={errors.category}
        icon="layers-outline"
      />

      {/* Quantity & Unit Row */}
      <View style={formStyles.row}>
        <View style={formStyles.halfField}>
          <Text style={dropdownStyles.label}>Quantity *</Text>
          <TextInput
            style={[formStyles.input, errors.quantity && formStyles.inputError]}
            placeholder="1.0"
            value={formData.quantity}
            onChangeText={(value) => handleChange('quantity', value)}
            keyboardType="decimal-pad"
          />
          {errors.quantity && <Text style={dropdownStyles.errorText}>{errors.quantity}</Text>}
        </View>
        <View style={formStyles.halfField}>
          <CustomDropdown
            label="Unit"
            value={formData.unit}
            placeholder="Select unit"
            options={availableUnits}
            onSelect={(value) => handleChange('unit', value)}
            onAddNew={handleAddUnit}
            error={errors.unit}
            disabled={!formData.category}
            icon="cube-outline"
          />
          {formData.category && availableUnits[0] && (
            <Text style={formStyles.hintText}>Suggested: {availableUnits[0]}</Text>
          )}
        </View>
      </View>

      {/* Supplier */}
      <AutocompleteDropdown
        label="Supplier"
        value={formData.supplier}
        placeholder="Type or select known supplier..."
        options={allSuppliers}
        onSelect={(value) => handleChange('supplier', value)}
        onChangeText={(value) => handleChange('supplier', value)}
        onAddNew={handleAddSupplier}
      />

      {/* Expiry Date */}
      <View style={dropdownStyles.container}>
        <Text style={dropdownStyles.label}>Expiry Date *</Text>
        <TouchableOpacity
          style={[dropdownStyles.button, errors.expiryDate && dropdownStyles.buttonError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[dropdownStyles.buttonText, !formData.expiryDate && dropdownStyles.placeholder]}>
            {formData.expiryDate ? formatDisplayDate(formData.expiryDate) : 'Select expiry date'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={THEME.primary} />
        </TouchableOpacity>
        {errors.expiryDate && <Text style={dropdownStyles.errorText}>{errors.expiryDate}</Text>}
        {daysLeft !== null && (
          <Text style={[formStyles.hintText, daysLeft <= 0 && { color: THEME.danger }]}>
            {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 
             daysLeft === 0 ? 'Expires today' : `Expired ${Math.abs(daysLeft)} day(s) ago`}
          </Text>
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={dropdownStyles.overlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={datePickerStyles.container}>
            <View style={datePickerStyles.header}>
              <TouchableOpacity onPress={() => setCurrentPickerDate(new Date(currentPickerDate.getFullYear(), currentPickerDate.getMonth() - 1))}>
                <Ionicons name="chevron-back" size={24} color={THEME.primary} />
              </TouchableOpacity>
              <Text style={datePickerStyles.monthText}>
                {currentPickerDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setCurrentPickerDate(new Date(currentPickerDate.getFullYear(), currentPickerDate.getMonth() + 1))}>
                <Ionicons name="chevron-forward" size={24} color={THEME.primary} />
              </TouchableOpacity>
            </View>

            <View style={datePickerStyles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={datePickerStyles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={datePickerStyles.daysGrid}>
              {Array.from({ length: getFirstDayOfMonth(currentPickerDate) }).map((_, i) => (
                <View key={`empty-${i}`} style={datePickerStyles.dayCell} />
              ))}
              {Array.from({ length: getDaysInMonth(currentPickerDate) }).map((_, i) => (
                <TouchableOpacity
                  key={i + 1}
                  style={datePickerStyles.dayCell}
                  onPress={() => handleSelectDay(i + 1)}
                >
                  <Text style={datePickerStyles.dayText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={datePickerStyles.closeBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={datePickerStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Submit Button */}
      <TouchableOpacity
        style={[formStyles.submitBtn, isSubmitting && formStyles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={formStyles.submitBtnText}>{isSubmitting ? 'Saving…' : 'Save Stock Item'}</Text>
      </TouchableOpacity>

      {onClose && (
        <TouchableOpacity style={formStyles.closeBtn} onPress={onClose}>
          <Ionicons name="close-circle-outline" size={20} color="#666" style={{ marginRight: 6 }} />
          <Text style={formStyles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Dropdown Styles
const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  buttonError: {
    borderColor: THEME.danger,
  },
  buttonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    color: '#999',
    fontWeight: '400',
  },
  errorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Platform.OS === 'web' ? 400 : '90%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D9E0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#FFF0F5',
  },
  newItemOption: {
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  optionTextSelected: {
    color: THEME.primary,
    fontWeight: '600',
  },
  // Add New Section Styles
  addNewSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addNewTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  addNewTriggerText: {
    marginLeft: 8,
    fontSize: 15,
    color: THEME.primary,
    fontWeight: '600',
  },
  addNewInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.primary,
    color: '#333',
  },
  addNewBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelNewBtn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Form Styles
const formStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    borderTopWidth: 6,
    borderTopColor: THEME.primary,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any,
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 24,
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  messageText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  inputError: {
    borderColor: THEME.danger,
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
});

// Date Picker Styles
const datePickerStyles = StyleSheet.create({
  container: {
    width: Platform.OS === 'web' ? 380 : '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.primary,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.primary,
  },
  closeBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AddStockForm;
