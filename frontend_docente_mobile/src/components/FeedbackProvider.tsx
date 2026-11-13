import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type FeedbackKind = 'success' | 'error' | 'warning';
type ConfirmationOptions = { title: string; message: string; confirmText?: string; destructive?: boolean };
type FeedbackContextValue = {
  notify: (message: string, kind?: FeedbackKind) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: FeedbackKind } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolver = useRef<((result: boolean) => void) | null>(null);

  const notify = useCallback((message: string, kind: FeedbackKind = 'warning') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const confirm = useCallback((options: ConfirmationOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setConfirmation(options);
  }), []);

  const resolveConfirmation = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setConfirmation(null);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    resolver.current?.(false);
  }, []);

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toast ? (
          <View
            pointerEvents="none"
            style={[
              styles.toast,
              toast.kind === 'success' ? styles.toast_success
                : toast.kind === 'error' ? styles.toast_error
                  : styles.toast_warning,
            ]}
          >
            <Text style={styles.toastTitle}>
              {toast.kind === 'success' ? 'Sucesso' : toast.kind === 'error' ? 'Erro' : 'Aviso'}
            </Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
          </View>
        ) : null}
      </View>
      <Modal
        transparent
        visible={confirmation !== null}
        animationType="fade"
        onRequestClose={() => resolveConfirmation(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmation?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmation?.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => resolveConfirmation(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Voltar</Text>
              </Pressable>
              <Pressable
                onPress={() => resolveConfirmation(true)}
                style={[styles.confirmButton, confirmation?.destructive && styles.destructiveButton]}
              >
                <Text style={styles.confirmText}>{confirmation?.confirmText ?? 'Confirmar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback deve ser usado dentro de FeedbackProvider.');
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
  toast_success: { backgroundColor: '#ecfdf5', borderLeftWidth: 4, borderLeftColor: '#059669' },
  toast_error: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  toast_warning: { backgroundColor: '#fffbeb', borderLeftWidth: 4, borderLeftColor: '#d97706' },
  toastTitle: { color: '#111827', fontSize: 13, fontWeight: '800' },
  toastMessage: { color: '#374151', fontSize: 12, lineHeight: 18, marginTop: 3 },
  confirmOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17,24,39,0.48)' },
  confirmCard: { borderRadius: 12, backgroundColor: '#fff', padding: 20 },
  confirmTitle: { color: '#111827', fontSize: 17, fontWeight: '800' },
  confirmMessage: { color: '#4b5563', fontSize: 14, lineHeight: 20, marginTop: 8 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: '#4b5563', fontSize: 13, fontWeight: '700' },
  confirmButton: { borderRadius: 7, backgroundColor: '#e30613', paddingHorizontal: 15, paddingVertical: 10 },
  destructiveButton: { backgroundColor: '#b91c1c' },
  confirmText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
