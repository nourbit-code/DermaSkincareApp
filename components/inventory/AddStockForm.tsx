// --- AddStockForm.premium.tsx ---
// Final Premium UI Version — Clean, Clinical, Modern

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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

type Extras = {
  onCheckDuplicate?: (data: StockFormData) => boolean;
  onCreateNewItem?: (name: string) => void;
  onClose?: () => void;
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

  const itemNameRef = useRef<HTMLInputElement | null>(null);

  const availableUnits = useMemo(() => {
    return UNIT_MAPPINGS[formData.category] || UNIT_MAPPINGS.Other || [];
  }, [formData.category]);

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

        if (field === 'unit' || field === 'category') {
          const unit = field === 'unit' ? value : formData.unit;
          const allowed = UNIT_MAPPINGS[field === 'category' ? value : formData.category] || [];
          if (unit && !allowed.includes(unit)) next.unit = 'Invalid unit for this category.';
        }

        return next;
      });
    },
    [formData.unit, formData.category, isExpired],
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

  const handleItemNameKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const typed = formData.itemName.trim().toLowerCase();
      const exact = MASTER_ITEMS_CATALOG.find(
        (i) => i.name.toLowerCase() === typed,
      );
      if (!exact) return;

      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        itemName: exact.name,
        category: exact.category,
        unit:
          exact.unit ||
          (UNIT_MAPPINGS[exact.category] || [])[0] ||
          prev.unit,
        supplier: exact.supplier,
      }));
    },
    [formData.itemName],
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

    const allowed = UNIT_MAPPINGS[formData.category] || [];
    if (formData.unit && !allowed.includes(formData.unit)) {
      e.unit = 'Invalid unit for this category.';
      ok = false;
    }

    setErrors(e);
    return ok;
  }, [formData, isExpired]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
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
    },
    [formData, initialFormState, validate, onCheckDuplicate],
  );

  const canAddToCatalog = useMemo(() => {
    const name = formData.itemName.trim();
    if (name.length < 3) return false;
    return !UNIQUE_ITEM_NAMES.some((n) => n.toLowerCase() === name.toLowerCase());
  }, [formData.itemName]);

  useEffect(() => {
    const id = 'premium-stock-style';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      @keyframes shake {
        0%,100%{transform:translateX(0)}
        20%,60%{transform:translateX(-4px)}
        40%,80%{transform:translateX(4px)}
      }
      .ashake { animation: shake 0.25s; }
      .focus-ring:focus {
        outline: 3px solid ${THEME.primary}22;
        border-color: ${THEME.primary};
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (errors.expiryDate) {
      const el = document.getElementById('expiryDate');
      if (!el) return;
      el.classList.add('ashake');
      const t = setTimeout(() => el.classList.remove('ashake'), 260);
      return () => clearTimeout(t);
    }
  }, [errors.expiryDate]);

  const baseText = THEME.text;

  const formStyle: React.CSSProperties = {
    position: 'relative',
    padding: 36,
    background: '#ffffff',
    borderRadius: 18,
    border: '1px solid #e7e9ec',
    maxWidth: 620,
    margin: '40px auto',
    color: baseText,
    fontFamily: 'Inter, system-ui, sans-serif',
    borderTop: `6px solid ${THEME.primary}`,
    transition: '0.25s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    margin: '6px 0 16px 0',
    border: '1px solid #d3d8df',
    borderRadius: 10,
    color: '#1f2937',
    backgroundColor: '#fff',
    fontSize: '0.96rem',
    transition: '0.18s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    color: '#4b5563',
    display: 'block',
    marginBottom: 6,
    fontWeight: 600,
    fontSize: '0.93rem',
    letterSpacing: '0.2px',
  };

  const errorTextStyle: React.CSSProperties = {
    color: THEME.danger,
    fontSize: '0.85rem',
    marginTop: '-8px',
    marginBottom: '10px',
    display: 'block',
  };

  const submissionMessageStyle = (success: boolean): React.CSSProperties => ({
    padding: '12px 14px',
    borderRadius: 10,
    textAlign: 'center',
    fontWeight: 700,
    marginTop: 18,
    backgroundColor: success ? THEME.success : THEME.danger,
    color: '#fff',
    opacity: messageVisible ? 1 : 0,
    transform: messageVisible ? 'translateY(0)' : 'translateY(-8px)',
    transition: '0.25s ease',
  });

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 28, fontSize: '1.55rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.5px' }}>
        Add New Inventory Item
      </h2>

      {submissionMessage && <div style={submissionMessageStyle(submissionMessage.startsWith('✅'))}>{submissionMessage}</div>}

      <label htmlFor="itemName" style={labelStyle}>Item Name *</label>
      <input
        id="itemName"
        ref={itemNameRef}
        type="text"
        list="item-names"
        value={formData.itemName}
        onChange={(e) => handleChange('itemName', e.target.value)}
        onKeyDown={handleItemNameKey}
        placeholder="Type or pick an existing item..."
        className="focus-ring"
        autoComplete="off"
        style={{ ...inputStyle, borderColor: errors.itemName ? THEME.danger : '#d3d8df' }}
      />
      {errors.itemName && <span style={errorTextStyle}>{errors.itemName}</span>}

      <datalist id="item-names">{UNIQUE_ITEM_NAMES.map((name) => <option key={name} value={name} />)}</datalist>

      {canAddToCatalog && (
        <button
          type="button"
          onClick={() => onCreateNewItem ? onCreateNewItem(formData.itemName.trim()) : alert(`Create "${formData.itemName.trim()}" in catalog`)}
          style={{ border: 'none', background: 'transparent', color: THEME.primary, cursor: 'pointer', padding: 0, marginBottom: 12 }}
        >
          + Add "{formData.itemName.trim()}" to catalog
        </button>
      )}

      <label htmlFor="category" style={labelStyle}>Category *</label>
      <select
        id="category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="focus-ring"
        style={{ ...inputStyle, borderColor: errors.category ? THEME.danger : '#d3d8df' }}
      >
        <option value="" disabled>Select the Material Type</option>
        {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {errors.category && <span style={errorTextStyle}>{errors.category}</span>}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="quantity" style={labelStyle}>Quantity *</label>
          <input
            id="quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            className="focus-ring"
            placeholder="1.0"
            style={{ ...inputStyle, borderColor: errors.quantity ? THEME.danger : '#d3d8df' }}
          />
          {errors.quantity && <span style={errorTextStyle}>{errors.quantity}</span>}
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="unit" style={labelStyle}>Unit</label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            disabled={!formData.category}
            className="focus-ring"
            style={{ ...inputStyle, borderColor: errors.unit ? THEME.danger : '#d3d8df' }}
          >
            {availableUnits.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {formData.category && availableUnits[0] && <small style={{ color: '#888', display: 'block', marginTop: 6 }}>Suggested unit: {availableUnits[0]}</small>}
          {errors.unit && <span style={errorTextStyle}>{errors.unit}</span>}
        </div>
      </div>

      <label htmlFor="supplier" style={labelStyle}>Supplier</label>
      <input id="supplier" type="text" list="supplier-names" value={formData.supplier} onChange={(e) => handleChange('supplier', e.target.value)} placeholder="Type or select known supplier..." className="focus-ring" style={inputStyle} />
      <datalist id="supplier-names">{UNIQUE_SUPPLIERS.map((s) => <option key={s} value={s} />)}</datalist>

      <label htmlFor="expiryDate" style={labelStyle}>Expiry Date *</label>
      <input
        id="expiryDate"
        type="date"
        value={formData.expiryDate}
        onChange={(e) => handleChange('expiryDate', e.target.value)}
        className="focus-ring"
        style={{ ...inputStyle, borderColor: errors.expiryDate || (formData.expiryDate && isExpired(formData.expiryDate)) ? THEME.danger : '#d3d8df' }}
      />
      {errors.expiryDate && <span style={errorTextStyle}>{errors.expiryDate}</span>}

      {daysLeft !== null && (
        <div style={{ marginTop: -6, marginBottom: 8 }}>
          {daysLeft > 0 ? <small style={{ color: THEME.secondary }}>Expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}</small> :
            <small style={{ color: THEME.danger }}>{daysLeft === 0 ? 'Expires today' : `Expired ${Math.abs(daysLeft)} day(s) ago`}</small>}
        </div>
      )}

      {/* BUTTONS CENTERED, NO SHADOW */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button type="submit" disabled={isSubmitting} style={{ padding: '13px 26px', background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryLight})`, color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 700, borderRadius: 12, border: 'none', fontSize: '0.95rem', transform: 'none', transition: '0.2s ease' }}>
          {isSubmitting ? 'Saving…' : 'Save Stock Item'}
        </button>

        {onClose && <button type="button" onClick={onClose} style={{ padding: '13px 22px', background: '#f3f4f6', border: '1px solid #e1e4e8', borderRadius: 12, color: '#4b5563', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: '0.18s ease' }}>✖ Close</button>}
      </div>
    </form>
  );
};

export default AddStockForm;
