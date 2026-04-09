'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

export interface ComboboxOption {
  id: string;
  label: string;
}

interface LocationComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export function LocationCombobox({
  options,
  value,
  onChange,
  placeholder = 'Search location...',
}: LocationComboboxProps) {
  const listboxId = useId();
  const selectedOption = options.find((o) => o.id === value) ?? null;
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text when the controlled value changes externally
  useEffect(() => {
    setInputValue(selectedOption?.label ?? '');
  }, [value, selectedOption?.label]);

  // Close dropdown and revert input on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setInputValue(selectedOption?.label ?? '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedOption?.label]);

  const filteredOptions = inputValue.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(inputValue.trim().toLowerCase())
      )
    : options;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setIsOpen(true);
      if (!e.target.value) onChange(null);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      onChange(option.id);
      setInputValue(option.label);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setInputValue('');
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Text input */}
      <div className="relative">
        <input
          type="text"
          className={cn(
            'w-full border-2 border-border bg-card px-3 py-2 pr-8',
            'font-hand text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
            'transition-shadow'
          )}
          style={{ borderRadius: WOBBLY_RADIUS }}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setInputValue(selectedOption?.label ?? '');
            }
          }}
          aria-label="Filter by location"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear location"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={cn(
              'pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]"
          style={{ borderRadius: WOBBLY_RADIUS_MD }}
          id={listboxId}
          role="listbox"
        >
          <div className="scrollbar-hide max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={value === option.id}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full px-3 py-2 text-left font-hand text-sm transition-colors',
                    value === option.id
                      ? 'bg-foreground text-background'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 font-hand text-sm text-muted-foreground">
                No matching location
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
