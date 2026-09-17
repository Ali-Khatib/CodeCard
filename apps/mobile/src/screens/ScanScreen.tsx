import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getMobileAppOrigin, parseScannedCodeCardUrl } from '../lib/public-codecard-url';
import { colors } from '../theme';

export function ScanScreen({
  onCancel,
  onDetected,
}: {
  onCancel: () => void;
  onDetected: (slug: string, fromQr: boolean) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  const origin = getMobileAppOrigin();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const onBarcodeScanned = useCallback(
    (result: { data?: string }) => {
      if (locked || !origin || !result.data) return;
      const parsed = parseScannedCodeCardUrl(result.data, origin);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setLocked(true);
      onDetected(parsed.slug, parsed.fromQr);
    },
    [locked, origin, onDetected],
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.body}>
          CodeCard uses the camera only to scan another person’s public CodeCard QR.
        </Text>
        <TouchableOpacity style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={onCancel}>
          <Text style={styles.ghostText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!origin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>App URL missing</Text>
        <Text style={styles.body}>Set EXPO_PUBLIC_APP_URL so scans resolve to public CodeCards.</Text>
        <TouchableOpacity style={styles.ghost} onPress={onCancel}>
          <Text style={styles.ghostText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.back} onPress={onCancel}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Point at a CodeCard QR</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.smoke, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  primary: {
    marginTop: 24,
    backgroundColor: colors.accentStrong,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  ghost: { marginTop: 16, minHeight: 44, justifyContent: 'center' },
  ghostText: { color: colors.accent, fontSize: 16 },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  back: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  hint: { color: '#fff', textAlign: 'center', fontSize: 16, marginBottom: 24 },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 12 },
});
