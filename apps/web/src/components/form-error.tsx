import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FormErrorProps = {
  message?: string;
  className?: string;
  id?: string;
};

export function FormError({ message, className, id }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn("flex items-center gap-2 text-destructive", className)}
      id={id}
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="h-4 w-4" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default FormError;
