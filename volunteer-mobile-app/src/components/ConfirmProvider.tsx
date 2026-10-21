import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm>(() => {
  throw new Error("useConfirm must be used inside a ConfirmProvider");
});

// Resolves true on confirm and false on cancel
export function useConfirm() {
  return useContext(ConfirmContext);
}

// ------------------------------------------------------------ //

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    if (resolveRef.current) return Promise.resolve(false);
    setOptions(next);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = (confirmed: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setVisible(false);
    resolve?.(confirmed);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog
          visible={visible}
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel ?? "Cancel"}
          destructive={options.destructive}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

//----------------------------------- END OF FILE ---------------------------------//
