"use client";

import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";

const TOAST_DURATION = 3000;

const ToastContext = React.createContext<{
  toast: (props: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
  }) => void;
} | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    {
      id: string;
      title?: React.ReactNode;
      description?: React.ReactNode;
      variant?: "default" | "destructive";
    }[]
  >([]);

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
  }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        <ToastViewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
        {toasts.map(({ id, title, description, variant }) => (
          <Toast key={id} variant={variant}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  );
}
