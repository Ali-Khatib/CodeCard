import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { SignInScreen } from './src/screens/SignInScreen';
import { CardScreen } from './src/screens/CardScreen';
import { ConnectionsScreen } from './src/screens/ConnectionsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ScannedProfileScreen } from './src/screens/ScannedProfileScreen';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

type Tab = 'card' | 'connections';
type Overlay =
  | { name: 'none' }
  | { name: 'settings' }
  | { name: 'scan' }
  | { name: 'scanned'; slug: string; fromQr: boolean };

type OwnerProfileIds = {
  id: string;
  tenant_id: string;
};

export default function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('card');
  const [overlay, setOverlay] = useState<Overlay>({ name: 'none' });
  const [owner, setOwner] = useState<OwnerProfileIds | null>(null);

  const loadOwner = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    setOwner((data as OwnerProfileIds | null) ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setOwner(null);
      setOverlay({ name: 'none' });
      setTab('card');
      return;
    }
    void loadOwner(user.id);
  }, [user, loadOwner]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.logo}>
          Code<Text style={styles.accent}>Card</Text>
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="light" />
        <SignInScreen onSuccess={() => undefined} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {overlay.name === 'settings' ? (
        <SettingsScreen email={user.email} onBack={() => setOverlay({ name: 'none' })} />
      ) : overlay.name === 'scan' ? (
        <ScanScreen
          onCancel={() => setOverlay({ name: 'none' })}
          onDetected={(slug, fromQr) => setOverlay({ name: 'scanned', slug, fromQr })}
        />
      ) : overlay.name === 'scanned' && owner ? (
        <ScannedProfileScreen
          slug={overlay.slug}
          fromQr={overlay.fromQr}
          ownerUserId={user.id}
          ownerProfileId={owner.id}
          ownerTenantId={owner.tenant_id}
          onDone={() => {
            setOverlay({ name: 'none' });
            setTab('connections');
          }}
        />
      ) : overlay.name === 'scanned' ? (
        <View style={styles.loading}>
          <Text style={styles.muted}>Finish your CodeCard on the web before connecting.</Text>
          <TouchableOpacity onPress={() => setOverlay({ name: 'none' })}>
            <Text style={styles.accent}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {tab === 'card' ? (
            <CardScreen
              userId={user.id}
              onScan={() => setOverlay({ name: 'scan' })}
              onOpenSettings={() => setOverlay({ name: 'settings' })}
            />
          ) : (
            <ConnectionsScreen userId={user.id} />
          )}

          <View style={styles.tabBar}>
            {([
              { id: 'card' as const, label: 'Card' },
              { id: 'connections' as const, label: 'Connections' },
            ]).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.tab}
                onPress={() => setTab(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === item.id }}
              >
                <Text style={[styles.tabText, tab === item.id && styles.tabActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 24 },
  logo: { fontSize: 28, fontWeight: '700', color: colors.ink },
  accent: { color: colors.accent },
  muted: { color: colors.smoke, textAlign: 'center', marginBottom: 16 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, minHeight: 52 },
  tabText: { color: colors.smoke, fontSize: 14, fontWeight: '600' },
  tabActive: { color: colors.accent },
});
