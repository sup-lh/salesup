'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cva } from 'class-variance-authority';
import { format as formatDate, isValid } from 'date-fns';
import { CheckIcon, ChevronDown, X } from 'lucide-react';
import { Slot } from 'radix-ui';
import { useControllableState } from 'radix-ui/internal';
import type { DateRange, Matcher } from 'react-day-picker';

// ============================================================================
// Types
// ============================================================================

/** Visual style variant for the filter trigger */
export type FilterVariant = 'gray' | 'outlined' | 'white';
/** Shape variant for the filter trigger */
export type FilterShape = 'rectangle' | 'rounded';
/** Size variant for the filter trigger */
export type FilterSize = 'xs' | 'sm' | 'md';

/** Value type for number range filter */
export interface NumberRangeValue {
  /** Minimum value of the range */
  min?: number;
  /** Maximum value of the range */
  max?: number;
}

/** Option type for select and multi-select filters */
export interface FilterOption {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

// ============================================================================
// Context
// ============================================================================

interface FilterContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  variant: FilterVariant;
  shape: FilterShape;
  size: FilterSize;
  disabled: boolean;
  valueSummary?: string;
  setValueSummary: (summary: string | undefined) => void;
  // New: value control at root level
  value: unknown;
  setValue: (value: unknown) => void;
}

const FilterContext = React.createContext<FilterContextValue | null>(null);

interface TypedFilterContextValue<T>
  extends Omit<FilterContextValue, 'value' | 'setValue'> {
  value: T | undefined;
  setValue: (value: T | undefined) => void;
}

function useFilter<T = unknown>(): TypedFilterContextValue<T> {
  const context = React.useContext(FilterContext);
  if (!context) {
    throw new Error('Filter components must be used within Filter');
  }
  return context as TypedFilterContextValue<T>;
}

// ============================================================================
// Utils
// ============================================================================

function formatNumberRangeValue(
  value: NumberRangeValue | undefined,
  unit?: string,
): string {
  if (!value) return '';
  const { min, max } = value;
  const unitSuffix = unit ? ` ${unit}` : '';
  if (min !== undefined && max !== undefined) {
    return `${min}~${max}${unitSuffix}`;
  }
  if (min !== undefined) {
    return `>=${min}${unitSuffix}`;
  }
  if (max !== undefined) {
    return `<=${max}${unitSuffix}`;
  }
  return '';
}

function formatDateRangeValue(
  value: DateRange | undefined,
  formatStr = 'yyyy-MM-dd',
): string {
  if (!value) return '';
  const { from, to } = value;
  const fromStr = from && isValid(from) ? formatDate(from, formatStr) : '';
  const toStr = to && isValid(to) ? formatDate(to, formatStr) : '';
  if (fromStr && toStr) {
    return `${fromStr} ~ ${toStr}`;
  }
  if (fromStr) {
    return `>= ${fromStr}`;
  }
  if (toStr) {
    return `<= ${toStr}`;
  }
  return '';
}

function formatSelectValue(
  value: string | undefined,
  options: FilterOption[],
): string {
  if (!value) return '';
  const option = options.find((opt) => opt.value === value);
  return option?.label || value;
}

function formatMultiSelectValue(
  value: string[] | undefined,
  options: FilterOption[],
  maxCount = 2,
): string {
  if (!value || value.length === 0) return '';
  const labels = value.slice(0, maxCount).map((v) => {
    const option = options.find((opt) => opt.value === v);
    return option?.label || v;
  });
  if (value.length > maxCount) {
    return `${labels.join(', ')} +${value.length - maxCount}`;
  }
  return labels.join(', ');
}

function isValueEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.values(obj).every((v) => v === undefined || v === null);
  }
  return false;
}

// ============================================================================
// Filter (Root)
// ============================================================================

export interface FilterProps<T = unknown>
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'children' | 'defaultValue'
  > {
  /** Filter content (Trigger + Content) */
  children: React.ReactNode;

  // Value control (new)
  /** Controlled filter value */
  value?: T;
  /** Default value for uncontrolled mode */
  defaultValue?: T;
  /** Callback when value changes */
  onValueChange?: (value: T | undefined) => void;

  // Open control (existing)
  /** Controlled open state */
  open?: boolean;
  /** Default open state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;

  // Style (existing)
  /** Visual style variant */
  variant?: FilterVariant;
  /** Shape variant */
  shape?: FilterShape;
  /** Size variant */
  size?: FilterSize;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Initial value summary to display (for SSR/initial render) */
  initialValueSummary?: string;
  /** Render as child element using Radix Slot */
  asChild?: boolean;
}

function FilterInner<T = unknown>(
  {
    children,
    value: controlledValue,
    defaultValue,
    onValueChange,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    variant = 'gray',
    shape = 'rectangle',
    size = 'sm',
    disabled = false,
    className,
    initialValueSummary,
    asChild = false,
    ...props
  }: FilterProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  const [value, setValue] = useControllableState<T | undefined>({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });

  const [valueSummary, setValueSummary] = React.useState<string | undefined>(
    initialValueSummary,
  );

  const contextValue = React.useMemo<FilterContextValue>(
    () => ({
      open: open ?? false,
      setOpen,
      variant,
      shape,
      size,
      disabled,
      valueSummary,
      setValueSummary,
      value,
      setValue: setValue as (value: unknown) => void,
    }),
    [
      open,
      setOpen,
      variant,
      shape,
      size,
      disabled,
      valueSummary,
      value,
      setValue,
    ],
  );

  const Comp = asChild ? Slot.Root : 'div';

  return (
    <FilterContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        <Comp
          ref={ref}
          data-slot="filter"
          className={cn('inline-flex', className)}
          {...props}
        >
          {children}
        </Comp>
      </Popover>
    </FilterContext.Provider>
  );
}

const Filter = React.forwardRef(FilterInner) as <T = unknown>(
  props: FilterProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

(Filter as React.FC).displayName = 'Filter';

// ============================================================================
// FilterTrigger
// ============================================================================

const filterTriggerVariants = cva(
  "group inline-flex items-center justify-between gap-1 whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        gray: 'bg-secondary text-foreground hover:bg-secondary/80 data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
        outlined:
          'border border-input bg-background hover:border-primary/50 hover:bg-accent/50 data-[state=open]:border-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
        white:
          'bg-background text-foreground shadow-sm hover:bg-accent/50 data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
      },
      shape: {
        rectangle: 'rounded-md',
        rounded: 'rounded-full',
      },
      size: {
        xs: 'h-7 gap-0.5 px-2 text-xs',
        sm: 'h-8 gap-1 px-3 text-sm',
        md: 'h-9 gap-1 px-3 text-sm',
      },
      hasValue: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'gray',
        hasValue: true,
        className:
          'bg-primary/10 text-blue-900 hover:bg-primary/15 dark:text-blue-200',
      },
      {
        variant: 'outlined',
        hasValue: true,
        className:
          'border-primary/30 bg-primary/5 text-blue-900 hover:border-primary/50 hover:bg-primary/10 dark:text-blue-200',
      },
      {
        variant: 'white',
        hasValue: true,
        className: 'bg-primary/5 text-blue-900 dark:text-blue-200',
      },
    ],
    defaultVariants: {
      variant: 'gray',
      shape: 'rectangle',
      size: 'sm',
      hasValue: false,
    },
  },
);

export interface FilterTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Label text displayed on the trigger */
  label: string;
  /** Custom icon to display before the label */
  icon?: React.ReactNode;
  /** Hide the chevron indicator */
  hideChevron?: boolean;
  /** Render as child element using Radix Slot (note: closable won't work in this mode) */
  asChild?: boolean;
  /** Custom trigger content when using asChild */
  children?: React.ReactNode;
  /** Show close button when filter has a value */
  closable?: boolean;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

const FilterTrigger = React.forwardRef<HTMLButtonElement, FilterTriggerProps>(
  (
    {
      className,
      label,
      icon,
      hideChevron = false,
      asChild = false,
      children,
      closable,
      onClose,
      ...props
    },
    ref,
  ) => {
    const {
      open,
      variant,
      shape,
      size,
      disabled,
      valueSummary,
      setValueSummary,
      setValue,
    } = useFilter();

    const hasValue = !!valueSummary;

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setValue(undefined); // Clear value from context
      setValueSummary(undefined);
      onClose?.();
    };

    const triggerContent = (
      <>
        <span className="flex items-center gap-1">
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{label}</span>
          {hasValue && (
            <>
              <span className="opacity-60">:</span>
              <span className="max-w-32 truncate">{valueSummary}</span>
            </>
          )}
        </span>

        <span className="flex items-center">
          {!hideChevron && (
            <ChevronDown
              className={cn(
                'opacity-60 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          )}

          {hasValue && closable && !disabled && (
            <>
              <span
                data-slot="filter-divider"
                className="mx-1 h-3.5 w-px bg-current opacity-20"
              />
              <button
                type="button"
                tabIndex={0}
                onClick={handleCloseClick}
                aria-label="Close"
                className="inline-flex size-3.5 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="size-3" />
              </button>
            </>
          )}
        </span>
      </>
    );

    const Comp = asChild ? Slot.Root : 'button';

    return (
      <PopoverTrigger asChild disabled={disabled}>
        <Comp
          ref={ref}
          type={asChild ? undefined : 'button'}
          data-slot="filter-trigger"
          data-state={open ? 'open' : 'closed'}
          aria-expanded={open}
          aria-haspopup="dialog"
          disabled={disabled}
          className={cn(
            filterTriggerVariants({ variant, shape, size, hasValue }),
            className,
          )}
          {...props}
        >
          {asChild && children ? children : triggerContent}
        </Comp>
      </PopoverTrigger>
    );
  },
);
FilterTrigger.displayName = 'FilterTrigger';

// ============================================================================
// FilterContent
// ============================================================================

export interface FilterContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof PopoverContent>, 'align'> {
  align?: 'start' | 'center' | 'end';
  /** Render as child element using Radix Slot */
  asChild?: boolean;
}

const FilterContent = React.forwardRef<HTMLDivElement, FilterContentProps>(
  (
    { className, align = 'start', sideOffset = 4, children, asChild, ...props },
    ref,
  ) => {
    useFilter();

    return (
      <PopoverContent
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        data-slot="filter-content"
        className={cn('w-auto p-0', className)}
        asChild={asChild}
        {...props}
      >
        {children}
      </PopoverContent>
    );
  },
);
FilterContent.displayName = 'FilterContent';

// ============================================================================
// FilterTextContent
// ============================================================================

export interface FilterTextContentProps {
  /** @deprecated Use value prop on Filter instead */
  value?: string;
  /** @deprecated Use defaultValue prop on Filter instead */
  defaultValue?: string;
  /** @deprecated Use onValueChange prop on Filter instead */
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  name?: string;
  className?: string;
}

const FilterTextContent = React.forwardRef<
  HTMLDivElement,
  FilterTextContentProps
>(
  (
    {
      value: legacyValue,
      defaultValue: legacyDefaultValue,
      onValueChange: legacyOnValueChange,
      placeholder = '请输入',
      maxLength,
      multiline = false,
      name,
      className,
    },
    ref,
  ) => {
    const {
      setOpen,
      setValueSummary,
      value: contextValue,
      setValue: setContextValue,
    } = useFilter<string>();

    // Support both legacy (value on Content) and new (value on Root) API
    const isLegacyMode =
      legacyValue !== undefined ||
      legacyDefaultValue !== undefined ||
      legacyOnValueChange !== undefined;

    const [legacyInternalValue, setLegacyInternalValue] = useControllableState<
      string | undefined
    >({
      prop: legacyValue,
      defaultProp: legacyDefaultValue,
      onChange: legacyOnValueChange,
    });

    // Use legacy value if in legacy mode, otherwise use context value
    const value = isLegacyMode ? legacyInternalValue : contextValue;
    const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;

    const [inputValue, setInputValue] = React.useState(value || '');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      const summary = isValueEmpty(value) ? undefined : value;
      setValueSummary(summary);
    }, [value, setValueSummary]);

    React.useEffect(() => {
      setInputValue(value || '');
    }, [value]);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (multiline) {
          textareaRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 0);
      return () => clearTimeout(timer);
    }, [multiline]);

    const commitValue = () => {
      const trimmedValue = inputValue.trim();
      setValue(trimmedValue || undefined);
    };

    const handleClear = () => {
      setValue(undefined);
      setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        commitValue();
        setOpen(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(value || '');
        setOpen(false);
      }
    };

    const handleBlur = () => {
      commitValue();
    };

    const handleClearClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleClear();
      if (multiline) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    };

    return (
      <div ref={ref} data-slot="filter-text-content" className={className}>
        {multiline ? (
          <div className="flex flex-col gap-2 p-3">
            <Textarea
              ref={textareaRef}
              name={name}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setInputValue(value || '');
                  setOpen(false);
                }
              }}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={3}
              className="min-w-56 resize-none"
            />
            {maxLength && (
              <p className="text-xs text-muted-foreground">
                {inputValue.length}/{maxLength}
              </p>
            )}
          </div>
        ) : (
          <div
            data-slot="filter-text-input"
            className={cn(
              'flex h-8 min-w-56 items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm',
              'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20',
            )}
          >
            <input
              ref={inputRef}
              name={name}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              maxLength={maxLength}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearClick}
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
                <span className="sr-only">Clear</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
FilterTextContent.displayName = 'FilterTextContent';

// ============================================================================
// FilterNumberContent
// ============================================================================

export interface FilterNumberContentProps {
  /** @deprecated Use value prop on Filter instead */
  value?: NumberRangeValue;
  /** @deprecated Use defaultValue prop on Filter instead */
  defaultValue?: NumberRangeValue;
  /** @deprecated Use onValueChange prop on Filter instead */
  onValueChange?: (value: NumberRangeValue | undefined) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment for number inputs */
  step?: number;
  /** Decimal precision for rounding */
  precision?: number;
  /** Unit label displayed after the inputs */
  unit?: string;
  /** Placeholder for minimum input */
  minPlaceholder?: string;
  /** Placeholder for maximum input */
  maxPlaceholder?: string;
  /** Additional CSS class name */
  className?: string;
  /** Error message for invalid range (min > max) */
  invalidRangeMessage?: string;
}

const FilterNumberContent = React.forwardRef<
  HTMLDivElement,
  FilterNumberContentProps
>(
  (
    {
      value: legacyValue,
      defaultValue: legacyDefaultValue,
      onValueChange: legacyOnValueChange,
      min,
      max,
      step = 1,
      precision,
      unit,
      minPlaceholder = '最小值',
      maxPlaceholder = '最大值',
      invalidRangeMessage = '最小值不能大于最大值',
      className,
    },
    ref,
  ) => {
    const {
      setOpen,
      setValueSummary,
      value: contextValue,
      setValue: setContextValue,
    } = useFilter<NumberRangeValue>();

    // Support both legacy (value on Content) and new (value on Root) API
    const isLegacyMode =
      legacyValue !== undefined ||
      legacyDefaultValue !== undefined ||
      legacyOnValueChange !== undefined;

    const [legacyInternalValue, setLegacyInternalValue] = useControllableState<
      NumberRangeValue | undefined
    >({
      prop: legacyValue,
      defaultProp: legacyDefaultValue,
      onChange: legacyOnValueChange,
    });

    // Use legacy value if in legacy mode, otherwise use context value
    const value = isLegacyMode ? legacyInternalValue : contextValue;
    const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;

    const [minValue, setMinValue] = React.useState<string>(
      value?.min?.toString() || '',
    );
    const [maxValue, setMaxValue] = React.useState<string>(
      value?.max?.toString() || '',
    );

    const minInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const summary = isValueEmpty(value)
        ? undefined
        : formatNumberRangeValue(value, unit);
      setValueSummary(summary);
    }, [value, unit, setValueSummary]);

    React.useEffect(() => {
      setMinValue(value?.min?.toString() || '');
      setMaxValue(value?.max?.toString() || '');
    }, [value]);

    React.useEffect(() => {
      const timer = setTimeout(() => minInputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }, []);

    const parseNumber = (str: string): number | undefined => {
      if (str === '') return undefined;
      const num = parseFloat(str);
      if (isNaN(num)) return undefined;
      if (precision !== undefined) {
        return parseFloat(num.toFixed(precision));
      }
      return num;
    };

    // Validate that min is not greater than max
    const isRangeInvalid = React.useMemo(() => {
      const minNum = parseNumber(minValue);
      const maxNum = parseNumber(maxValue);
      if (minNum !== undefined && maxNum !== undefined) {
        return minNum > maxNum;
      }
      return false;
    }, [minValue, maxValue]);

    const commitValue = () => {
      // Don't commit if range is invalid
      if (isRangeInvalid) {
        return;
      }
      const minNum = parseNumber(minValue);
      const maxNum = parseNumber(maxValue);
      if (minNum === undefined && maxNum === undefined) {
        setValue(undefined);
      } else {
        setValue({ min: minNum, max: maxNum });
      }
    };

    const handleClear = () => {
      setValue(undefined);
      setMinValue('');
      setMaxValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isRangeInvalid) {
          commitValue();
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMinValue(value?.min?.toString() || '');
        setMaxValue(value?.max?.toString() || '');
        setOpen(false);
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      const container = e.currentTarget.closest(
        '[data-slot="filter-number-input"]',
      );
      if (container && !container.contains(e.relatedTarget as Node)) {
        commitValue();
      }
    };

    const handleClearClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleClear();
      minInputRef.current?.focus();
    };

    const hasInputValue = minValue !== '' || maxValue !== '';

    return (
      <div ref={ref} data-slot="filter-number-content" className={className}>
        <div
          data-slot="filter-number-input"
          data-invalid={isRangeInvalid || undefined}
          className={cn(
            'flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm',
            'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20',
            isRangeInvalid &&
              'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
          )}
        >
          <input
            ref={minInputRef}
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={minPlaceholder}
            min={min}
            max={max}
            step={step}
            aria-invalid={isRangeInvalid || undefined}
            className="w-20 flex-1 [appearance:textfield] bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {hasInputValue && (
            <button
              type="button"
              onClick={handleClearClick}
              aria-label="Clear"
              className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
          <span className="shrink-0 text-sm text-muted-foreground">-</span>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={maxPlaceholder}
            min={min}
            max={max}
            step={step}
            aria-invalid={isRangeInvalid || undefined}
            className="w-20 flex-1 [appearance:textfield] bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {isRangeInvalid && (
          <p className="mt-1.5 text-xs text-destructive" role="alert">
            {invalidRangeMessage}
          </p>
        )}
      </div>
    );
  },
);
FilterNumberContent.displayName = 'FilterNumberContent';

// ============================================================================
// FilterDateRangeContent
// ============================================================================

export interface FilterDateRangeContentProps {
  /** @deprecated Use value prop on Filter instead */
  value?: DateRange;
  /** @deprecated Use defaultValue prop on Filter instead */
  defaultValue?: DateRange;
  /** @deprecated Use onValueChange prop on Filter instead */
  onValueChange?: (value: DateRange | undefined) => void;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  className?: string;
}

const FilterDateRangeContent = React.forwardRef<
  HTMLDivElement,
  FilterDateRangeContentProps
>(
  (
    {
      value: legacyValue,
      defaultValue: legacyDefaultValue,
      onValueChange: legacyOnValueChange,
      format: formatStr = 'yyyy-MM-dd',
      minDate,
      maxDate,
      numberOfMonths = 1,
      className,
    },
    ref,
  ) => {
    const {
      setValueSummary,
      value: contextValue,
      setValue: setContextValue,
    } = useFilter<DateRange>();

    // Support both legacy (value on Content) and new (value on Root) API
    const isLegacyMode =
      legacyValue !== undefined ||
      legacyDefaultValue !== undefined ||
      legacyOnValueChange !== undefined;

    const [legacyInternalValue, setLegacyInternalValue] = useControllableState<
      DateRange | undefined
    >({
      prop: legacyValue,
      defaultProp: legacyDefaultValue,
      onChange: legacyOnValueChange,
    });

    // Use legacy value if in legacy mode, otherwise use context value
    const value = isLegacyMode ? legacyInternalValue : contextValue;
    const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;

    React.useEffect(() => {
      const summary = isValueEmpty(value)
        ? undefined
        : formatDateRangeValue(value, formatStr);
      setValueSummary(summary);
    }, [value, formatStr, setValueSummary]);

    const handleSelect = (range: DateRange | undefined) => {
      setValue(range);
      // Popover closes when clicking outside, not when selecting dates
    };

    const disabledDates: Matcher[] = [];
    if (minDate) {
      disabledDates.push({ before: minDate });
    }
    if (maxDate) {
      disabledDates.push({ after: maxDate });
    }

    return (
      <div
        ref={ref}
        data-slot="filter-date-range-content"
        className={className}
      >
        <Calendar
          mode="range"
          selected={value ? { from: value.from, to: value.to } : undefined}
          onSelect={handleSelect}
          defaultMonth={value?.from}
          numberOfMonths={numberOfMonths}
          disabled={disabledDates.length > 0 ? disabledDates : undefined}
          initialFocus
          className={cn(
            '[&_td_button[data-range-end=true]]:hover:bg-primary/90 [&_td_button[data-range-end=true]]:hover:text-primary-foreground [&_td_button[data-range-start=true]]:hover:bg-primary/90 [&_td_button[data-range-start=true]]:hover:text-primary-foreground',
          )}
        />
      </div>
    );
  },
);
FilterDateRangeContent.displayName = 'FilterDateRangeContent';

// ============================================================================
// FilterSelectContent
// ============================================================================

export interface FilterSelectContentProps {
  /** @deprecated Use value prop on Filter instead */
  value?: string;
  /** @deprecated Use defaultValue prop on Filter instead */
  defaultValue?: string;
  /** @deprecated Use onValueChange prop on Filter instead */
  onValueChange?: (value: string | undefined) => void;
  options: FilterOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

const FilterSelectContent = React.forwardRef<
  HTMLDivElement,
  FilterSelectContentProps
>(
  (
    {
      value: legacyValue,
      defaultValue: legacyDefaultValue,
      onValueChange: legacyOnValueChange,
      options,
      searchable = true,
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      className,
    },
    ref,
  ) => {
    const {
      setOpen,
      setValueSummary,
      value: contextValue,
      setValue: setContextValue,
    } = useFilter<string>();

    // Support both legacy (value on Content) and new (value on Root) API
    const isLegacyMode =
      legacyValue !== undefined ||
      legacyDefaultValue !== undefined ||
      legacyOnValueChange !== undefined;

    const [legacyInternalValue, setLegacyInternalValue] = useControllableState<
      string | undefined
    >({
      prop: legacyValue,
      defaultProp: legacyDefaultValue,
      onChange: legacyOnValueChange,
    });

    // Use legacy value if in legacy mode, otherwise use context value
    const value = isLegacyMode ? legacyInternalValue : contextValue;
    const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;

    React.useEffect(() => {
      const summary = isValueEmpty(value)
        ? undefined
        : formatSelectValue(value, options);
      setValueSummary(summary);
    }, [value, options, setValueSummary]);

    const handleSelect = (selectedValue: string) => {
      if (value === selectedValue) {
        setValue(undefined);
      } else {
        setValue(selectedValue);
      }
      setOpen(false);
    };

    return (
      <div
        ref={ref}
        data-slot="filter-select-content"
        className={cn('w-52', className)}
      >
        <Command>
          {searchable && (
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer justify-between"
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      'h-4 w-4 text-primary',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  },
);
FilterSelectContent.displayName = 'FilterSelectContent';

// ============================================================================
// FilterMultiSelectContent
// ============================================================================

export interface FilterMultiSelectContentProps {
  /** @deprecated Use value prop on Filter instead */
  value?: string[];
  /** @deprecated Use defaultValue prop on Filter instead */
  defaultValue?: string[];
  /** @deprecated Use onValueChange prop on Filter instead */
  onValueChange?: (value: string[] | undefined) => void;
  options: FilterOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  maxCount?: number;
  className?: string;
}

const FilterMultiSelectContent = React.forwardRef<
  HTMLDivElement,
  FilterMultiSelectContentProps
>(
  (
    {
      value: legacyValue,
      defaultValue: legacyDefaultValue,
      onValueChange: legacyOnValueChange,
      options,
      searchable = true,
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      maxCount,
      className,
    },
    ref,
  ) => {
    const {
      setValueSummary,
      value: contextValue,
      setValue: setContextValue,
    } = useFilter<string[]>();

    // Support both legacy (value on Content) and new (value on Root) API
    const isLegacyMode =
      legacyValue !== undefined ||
      legacyDefaultValue !== undefined ||
      legacyOnValueChange !== undefined;

    const [legacyInternalValue, setLegacyInternalValue] = useControllableState<
      string[] | undefined
    >({
      prop: legacyValue,
      defaultProp: legacyDefaultValue,
      onChange: legacyOnValueChange,
    });

    // Use legacy value if in legacy mode, otherwise use context value
    const value = isLegacyMode ? legacyInternalValue : contextValue;
    const setValue = isLegacyMode ? setLegacyInternalValue : setContextValue;

    const selectedValues = value || [];

    React.useEffect(() => {
      const summary =
        isValueEmpty(value) || selectedValues.length === 0
          ? undefined
          : formatMultiSelectValue(value, options, maxCount);
      setValueSummary(summary);
    }, [value, selectedValues.length, options, maxCount, setValueSummary]);

    const handleSelect = (selectedValue: string) => {
      const newValues = selectedValues.includes(selectedValue)
        ? selectedValues.filter((v) => v !== selectedValue)
        : [...selectedValues, selectedValue];
      setValue(newValues.length > 0 ? newValues : undefined);
    };

    return (
      <div
        ref={ref}
        data-slot="filter-multi-select-content"
        className={cn('w-52', className)}
      >
        <Command>
          {searchable && (
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer justify-between"
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        'h-4 w-4 text-primary',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  },
);
FilterMultiSelectContent.displayName = 'FilterMultiSelectContent';

// ============================================================================
// FilterGroup
// ============================================================================

const filterGroupVariants = cva('flex flex-wrap items-center', {
  variants: {
    gap: {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
});

export interface FilterGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  /** Render as child element using Radix Slot */
  asChild?: boolean;
}

const FilterGroup = React.forwardRef<HTMLDivElement, FilterGroupProps>(
  ({ children, className, gap = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'div';
    return (
      <Comp
        ref={ref}
        data-slot="filter-group"
        className={cn(filterGroupVariants({ gap }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
FilterGroup.displayName = 'FilterGroup';

// ============================================================================
// Exports
// ============================================================================

export {
  // Core components
  Filter,
  FilterTrigger,
  filterTriggerVariants,
  FilterContent,
  FilterTextContent,
  FilterNumberContent,
  FilterDateRangeContent,
  FilterSelectContent,
  FilterMultiSelectContent,
  FilterGroup,
  filterGroupVariants,
};

// Re-export types
export type { DateRange } from 'react-day-picker';
