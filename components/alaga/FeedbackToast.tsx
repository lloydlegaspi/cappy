import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  kind: ToastKind;
}

interface FeedbackContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    kind: 'info',
  });
  const [fade] = useState(() => new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast((current) => ({ ...current, visible: false }));
    });
  }, [fade]);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      setToast({ visible: true, message, kind });
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      setTimeout(hideToast, 2200);
    },
    [fade, hideToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <FeedbackContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {toast.visible ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.toast,
              toast.kind === 'success' && styles.toastSuccess,
              toast.kind === 'error' && styles.toastError,
              { opacity: fade },
            ]}>
            <Text style={styles.toastText}>{toast.message}</Text>
            <Pressable onPress={hideToast} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#E6F5EC',
    borderWidth: 1,
    borderColor: '#B7E0C5',
  },
  toastError: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F6CACA',
  },
  toastText: {
    flex: 1,
    color: '#1A3A6B',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  closeText: {
    color: '#1A3A6B',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
});
