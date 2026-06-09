import { forwardRef } from "react";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, FieldProps>(
  function Input({ label, hint, error, className = "", ...rest }, ref) {
    return (
      <label className="block">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <input
          ref={ref}
          {...rest}
          className={`mt-1.5 h-11 w-full rounded-2xl bg-white px-4 text-sm text-foreground placeholder:text-taupe-400 outline-none ring-1 ring-taupe-200 transition-shadow focus:ring-2 focus:ring-primary ${
            error ? "ring-red-300 focus:ring-red-500" : ""
          } ${className}`}
        />
        {(error || hint) && (
          <span
            className={`mt-1 block text-xs ${
              error ? "text-red-500" : "text-taupe-400"
            }`}
          >
            {error ?? hint}
          </span>
        )}
      </label>
    );
  },
);

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  className = "",
  ...rest
}: TextAreaProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <textarea
        {...rest}
        className={`mt-1.5 min-h-[88px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-foreground placeholder:text-taupe-400 outline-none ring-1 ring-taupe-200 transition-shadow focus:ring-2 focus:ring-primary ${
          error ? "ring-red-300 focus:ring-red-500" : ""
        } ${className}`}
      />
      {(error || hint) && (
        <span
          className={`mt-1 block text-xs ${
            error ? "text-red-500" : "text-taupe-400"
          }`}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  hint,
  error,
  options,
  className = "",
  ...rest
}: SelectProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <select
        {...rest}
        className={`mt-1.5 h-11 w-full appearance-none rounded-2xl bg-white px-4 text-sm text-foreground outline-none ring-1 ring-taupe-200 transition-shadow focus:ring-2 focus:ring-primary ${
          error ? "ring-red-300 focus:ring-red-500" : ""
        } ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {(error || hint) && (
        <span
          className={`mt-1 block text-xs ${
            error ? "text-red-500" : "text-taupe-400"
          }`}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}
