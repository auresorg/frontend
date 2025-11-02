'use client'
import React from 'react';
import { Button } from '../Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/Dialog';

export type DialogType = 'error' | 'warning' | 'info' | 'success';

export interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

// Hook to use the dialog
export const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

// Dialog Provider Component
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dialogOptions, setDialogOptions] = React.useState<DialogOptions | null>(null);

  const showDialog = (options: DialogOptions) => {
    setDialogOptions(options);
    setIsOpen(true);
  };

  const hideDialog = () => {
    setIsOpen(false);
    setDialogOptions(null);
  };

  const handleConfirm = () => {
    dialogOptions?.onConfirm?.();
    hideDialog();
  };

  const handleCancel = () => {
    dialogOptions?.onCancel?.();
    hideDialog();
  };

  const getTypeStyles = (type: DialogType = 'info') => {
    const styles = {
      info: {
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      success: {
        button: 'bg-green-600 hover:bg-green-700',
      },
      warning: {
        button: 'bg-yellow-600 hover:bg-yellow-700',
      },
      error: {
        button: 'bg-red-600 hover:bg-red-700',
      },
    };
    return styles[type];
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      
      {/* Dialog Component - Using YOUR Dialog components */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          {dialogOptions && (
            <>
              <DialogHeader>
                <DialogTitle>{dialogOptions.title}</DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6">
                  {dialogOptions.message}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6">
                {dialogOptions.cancelText !== "DONOT SHOW CANCEL" && (
                  <DialogClose asChild>
                    <Button
                      className="mt-2 w-full sm:mt-0 sm:w-fit"
                      variant="secondary"
                      onClick={handleCancel}
                    >
                      {dialogOptions.cancelText || 'Cancel'}
                    </Button>
                  </DialogClose>
                )}
                <DialogClose asChild>
                  <Button 
                    className={`w-full sm:w-fit ${getTypeStyles(dialogOptions.type).button}`}
                    onClick={handleConfirm}
                  >
                    {dialogOptions.confirmText || 'OK'}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};