import { Text, View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { getMobileAppOrigin } from '../lib/public-codecard-url';
import { colors } from '../theme';

export function SettingsScreen({
  email,
  onBack,
}: {
  email?: string | null;
  onBack: () => void;
}) {
  const origin = getMobileAppOrigin();
  const dashboardUrl = origin ? `${origin}/dashboard` : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.body}>
        {email ? email : 'Signed in'}
      </Text>
      <Text style={styles.hint}>
        Profile editing, projects, research, analytics, and billing stay on the web.
      </Text>
      {dashboardUrl ? (
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => void Linking.openURL(dashboardUrl)}
        >
          <Text style={styles.secondaryText}>Open web dashboard</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={styles.danger}
        onPress={() => void supabase.auth.signOut()}
      >
        <Text style={styles.dangerText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 12 },
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700', marginTop: 12 },
  body: { color: colors.muted, fontSize: 16, marginTop: 8 },
  hint: { color: colors.smoke, fontSize: 15, marginTop: 16, lineHeight: 22 },
  secondary: {
    marginTop: 28,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  danger: { marginTop: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
