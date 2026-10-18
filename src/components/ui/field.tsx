'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatPhoneLocal, isValidPhMobile, toE164 } from '@/core';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

// Label + hint + error wrapper. Pass htmlFor to wire the label to a control id.
export function Field({ label, hint, error, required, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-terracotta">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-mute">{hint}</p>
      )}
    </div>
  );
}

const controlBase =
  'w-full bg-chalk border rounded-lg text-sm text-ink placeholder:text-mute/70 ' +
  'transition-colors outline-none focus-visible:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/20 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function TextInput({ invalid, className, ref, ...props }: TextInputProps) {
  return (
    <input
      ref={ref}
      className={cn(controlBase, 'h-10 px-3', invalid ? 'border-danger' : 'border-line', className)}
      {...props}
    />
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextArea({ invalid, className, ref, ...props }: TextAreaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(
        controlBase,
        'min-h-20 px-3 py-2 resize-y',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
}

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  suffix?: string;
}

// Party-size stepper. Clamps to [min,max]; keeps a native number input for typing.
export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  id,
  suffix,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const stepBtn =
    'grid size-10 place-items-center text-mute transition-colors hover:bg-sand hover:text-ink ' +
    'disabled:opacity-40 disabled:pointer-events-none outline-terracotta';
  return (
    <div className="inline-flex items-center h-10 rounded-lg border border-line bg-chalk">
      <button
        type="button"
        aria-label="Decrease"
        className={cn(stepBtn, 'rounded-l-lg border-r border-line')}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </button>
      <div className="flex min-w-14 items-baseline justify-center gap-1 px-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className="w-8 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-mute">{suffix}</span>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        className={cn(stepBtn, 'rounded-r-lg border-l border-line')}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

interface PhoneFieldProps {
  value: string; // E.164, e.g. '+639171234567'
  onChange: (e164: string) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  id?: string;
}

// PH mobile input. Displays as 0917 123 4567 with a fixed +63 prefix, validates
// via isValidPhMobile, and stores E.164 through toE164 in the parent.
export function PhoneField({ value, onChange, label, hint, required, id }: PhoneFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [touched, setTouched] = useState(false);
  const display = value ? formatPhoneLocal(value) : '';
  const valid = value ? isValidPhMobile(value) : !required;
  const error = touched && !valid ? 'Enter a valid PH mobile number' : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <div
        className={cn(
          'flex h-10 items-center rounded-lg border bg-chalk transition-colors',
          'focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/20',
          error ? 'border-danger' : 'border-line',
        )}
      >
        <span className="grid h-full place-items-center border-r border-line px-3 text-sm font-medium text-mute">
          +63
        </span>
        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="0917 123 4567"
          value={display}
          onChange={(e) => onChange(toE164(e.target.value))}
          onBlur={() => setTouched(true)}
          className="h-full flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-mute/70 outline-none"
        />
      </div>
    </Field>
  );
}
