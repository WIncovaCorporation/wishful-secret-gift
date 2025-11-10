import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  min?: string;
  max?: string;
  pattern?: string;
  autoComplete?: string;
  "aria-describedby"?: string;
}

export const FormField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  error,
  multiline = false,
  rows = 3,
  min,
  max,
  pattern,
  autoComplete,
  "aria-describedby": ariaDescribedBy,
}: FormFieldProps) => {
  const inputId = `form-field-${id}`;
  const errorId = `${inputId}-error`;
  const descriptionId = ariaDescribedBy || undefined;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive" aria-label="campo requerido">*</span>}
      </Label>
      
      {multiline ? (
        <Textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : descriptionId}
          className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        />
      ) : (
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          pattern={pattern}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : descriptionId}
          className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        />
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
