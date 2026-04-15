import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DEFAULT_ACTIONS = [{ text: 'OK' }];
const AppDialogContext = createContext({ showDialog: () => {} });

const normalizeAction = (action) => ({
  text: action?.text || 'OK',
  style: action?.style || 'default',
  onPress: typeof action?.onPress === 'function' ? action.onPress : null,
});

const normalizeDialogPayload = (title, message, actions, options) => ({
  title: String(title ?? ''),
  message: String(message ?? ''),
  actions: (Array.isArray(actions) && actions.length > 0 ? actions : DEFAULT_ACTIONS).map(normalizeAction),
  cancelable: Boolean(options?.cancelable),
});

const initialDialogState = {
  visible: false,
  title: '',
  message: '',
  actions: DEFAULT_ACTIONS,
  cancelable: false,
};

const actionTextStyleFor = (style) => {
  if (style === 'destructive') return styles.actionTextDestructive;
  if (style === 'cancel') return styles.actionTextCancel;
  return styles.actionTextDefault;
};

export const AppDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(initialDialogState);
  const queueRef = useRef([]);

  const flushNextDialog = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return;
    setDialog({ visible: true, ...next });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(initialDialogState);
    requestAnimationFrame(flushNextDialog);
  }, [flushNextDialog]);

  const showDialog = useCallback((title, message, actions, options = {}) => {
    const nextDialog = normalizeDialogPayload(title, message, actions, options);
    setDialog((prev) => {
      if (prev.visible) {
        queueRef.current.push(nextDialog);
        return prev;
      }
      return { visible: true, ...nextDialog };
    });
  }, []);

  const handleActionPress = useCallback((action) => {
    closeDialog();
    if (action?.onPress) {
      setTimeout(() => action.onPress(), 0);
    }
  }, [closeDialog]);

  const handleBackdropPress = useCallback(() => {
    if (!dialog.cancelable) return;
    closeDialog();
  }, [closeDialog, dialog.cancelable]);

  const contextValue = useMemo(() => ({ showDialog }), [showDialog]);

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
      >
        <Pressable style={styles.overlay} onPress={handleBackdropPress}>
          <Pressable style={styles.card} onPress={() => {}}>
            {!!dialog.title && <Text style={styles.title}>{dialog.title}</Text>}
            {!!dialog.message && <Text style={styles.message}>{dialog.message}</Text>}
            <View style={styles.actionStack}>
              {dialog.actions.map((action, index) => (
                <Pressable
                  key={`${action.text}-${index}`}
                  style={[styles.actionButton, index > 0 && styles.actionSpacing]}
                  onPress={() => handleActionPress(action)}
                >
                  <Text style={[styles.actionTextBase, actionTextStyleFor(action.style)]}>
                    {action.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => useContext(AppDialogContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#141826',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Agdasima-Bold',
    fontSize: 24,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  message: {
    color: '#B7BED0',
    fontFamily: 'Agdasima',
    fontSize: 18,
    lineHeight: 24,
  },
  actionStack: {
    marginTop: 14,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2030',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.24)',
  },
  actionSpacing: {
    marginTop: 8,
  },
  actionTextBase: {
    fontFamily: 'Agdasima-Bold',
    fontSize: 20,
    letterSpacing: 0.2,
  },
  actionTextDefault: {
    color: '#B8A7FF',
  },
  actionTextCancel: {
    color: '#D6DBE8',
  },
  actionTextDestructive: {
    color: '#FF7A7A',
  },
});
