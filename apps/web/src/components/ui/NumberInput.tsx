'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'slate' | 'white' | 'flat-white' | 'custom';
  className?: string; // Container classes
  inputClassName?: string;
  unitClassName?: string;
  hideStepper?: boolean;
  precision?: number;
  id?: string;
  name?: string;
  ariaLabel?: string;
}

// Compute precision based on step
function getStepPrecision(step: number): number {
  const stepStr = step.toString();
  if (stepStr.includes('.')) {
    return stepStr.split('.')[1].length;
  }
  return 0;
}

function clamp(val: number, min?: number, max?: number): number {
  let res = val;
  if (min !== undefined && res < min) res = min;
  if (max !== undefined && res > max) res = max;
  return res;
}

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  label,
  labelClassName,
  placeholder,
  disabled = false,
  readOnly = false,
  size = 'sm',
  variant = 'slate',
  className = '',
  inputClassName = '',
  unitClassName = '',
  hideStepper = false,
  precision,
  id,
  name,
  ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const decimals = precision !== undefined ? precision : getStepPrecision(step);

  // Maintain local string to allow typing decimals like "1." without premature snapping
  const [localText, setLocalText] = useState<string>(() =>
    isNaN(value) ? '' : String(roundTo(value, decimals))
  );
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalText(isNaN(value) ? '' : String(roundTo(value, decimals)));
    }
  }, [value, decimals, isFocused]);

  const commitValue = useCallback(
    (newVal: number) => {
      const clamped = clamp(roundTo(newVal, decimals), min, max);
      setLocalText(String(clamped));
      onChange(clamped);
    },
    [decimals, min, max, onChange]
  );

  const handleStep = useCallback(
    (direction: 'up' | 'down', multiplier = 1) => {
      if (disabled || readOnly) return;
      const currentVal = isNaN(value) ? (min ?? 0) : value;
      const delta = step * multiplier * (direction === 'up' ? 1 : -1);
      commitValue(currentVal + delta);
    },
    [disabled, readOnly, value, min, step, commitValue]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);

    // If user deleted everything, don't force snap yet
    if (raw === '' || raw === '-' || raw === '.') {
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // Don't clamp strictly while typing to allow typing numbers like 10 when min is 5
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(localText);
    if (isNaN(parsed)) {
      parsed = min !== undefined ? min : 0;
    }
    commitValue(parsed);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep('up', e.shiftKey ? 10 : 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep('down', e.shiftKey ? 10 : 1);
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Sizing definitions
  const sizeClasses = {
    xs: 'h-7 text-[11px]',
    sm: 'h-[32px] text-xs',
    md: 'h-[36px] text-xs sm:text-sm',
    lg: 'h-[42px] text-sm',
  }[size];

  // Variant styling definitions - soft light-blue ring matching Image 2
  const variantClasses = {
    slate:
      'bg-slate-50 hover:bg-white border-slate-200 focus:bg-white focus:border-[#70a7ff] focus:ring-4 focus:ring-blue-100 rounded-xl text-slate-800',
    white:
      'bg-white hover:border-slate-300 border-slate-200 focus:border-[#70a7ff] focus:ring-4 focus:ring-blue-100 rounded-xl text-slate-800',
    'flat-white':
      'bg-white hover:bg-slate-50/70 border-0 shadow-none focus:ring-2 focus:ring-[#78C841]/30 rounded-xl text-slate-800',
    custom: '',
  }[variant];

  const hasBorder = variant !== 'custom' && variant !== 'flat-white';
  const canIncrement = max === undefined || value < max;
  const canDecrement = min === undefined || value > min;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={labelClassName || 'block text-[11px] font-medium text-slate-500 mb-1'}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Core Input Field - directly styled with rounded-xl and single outer blue focus ring */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={localText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-label={ariaLabel || label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className={`w-full ${hasBorder ? 'border' : 'border-0'} font-semibold outline-none transition-all pl-2.5 ${
            unit ? 'pr-12' : !hideStepper ? 'pr-6' : 'pr-2.5'
          } ${sizeClasses} ${variantClasses} ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
          } ${className} ${inputClassName}`}
        />

        {/* Custom Sleek Micro Stepper & Unit on the right */}
        <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 select-none pointer-events-none">
          {!hideStepper && !readOnly && !disabled && (
            <div className="flex flex-col items-center justify-center pointer-events-auto">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep('up')}
                disabled={!canIncrement}
                className={`p-0.5 leading-none rounded transition-colors ${
                  canIncrement
                    ? 'text-slate-400 hover:text-blue-600 active:scale-95 cursor-pointer'
                    : 'text-slate-300 opacity-40 cursor-not-allowed'
                }`}
                title={`Tăng (+${step})`}
              >
                <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => handleStep('down')}
                disabled={!canDecrement}
                className={`p-0.5 leading-none rounded transition-colors -mt-0.5 ${
                  canDecrement
                    ? 'text-slate-400 hover:text-blue-600 active:scale-95 cursor-pointer'
                    : 'text-slate-300 opacity-40 cursor-not-allowed'
                }`}
                title={`Giảm (-${step})`}
              >
                <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {unit && (
            <span
              className={`text-[10px] font-medium text-slate-400 select-none ${unitClassName}`}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberInput;
