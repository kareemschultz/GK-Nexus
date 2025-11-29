import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useEscapeKey, useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = "md",
  closeOnOverlayClick = true,
}: ModalProps) {
  const modalRef = useFocusTrap(isOpen);

  // Handle escape key
  useEscapeKey(onClose, isOpen);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const modalContent = (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      {/* Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        className={cn(
          "relative w-full rounded-lg bg-background shadow-lg",
          sizeClasses[size],
          className
        )}
        ref={modalRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold text-lg" id="modal-title">
            {title}
          </h2>
          <Button
            aria-label="Close modal"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default Modal;
