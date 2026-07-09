import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './src/hooks/useAuth';
import { SignInScreen } from './src/screens/SignInScreen';
import { SavedConnectionsScreen } from './src/screens/SavedConnectionsScreen';
import { supabase } from './src/lib/supabase';

type Tab = 'connections' | 'collections' | 'settings';

export default function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('connections');
  const [, setRefresh] = useState(0);

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
        <SignInScreen onSuccess={() => setRefresh((n) => n + 1)} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>
          Code<Text style={styles.accent}>Card</Text>
        </Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {tab === 'connections' && (
        <SavedConnectionsScreen userId={user.id} onSelect={() => {}} />
      )}
      {tab === 'collections' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Collections: organize saved profiles</Text>
        </View>
      )}
      {tab === 'settings' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Settings</Text>
          <Text style={styles.placeholderText}>
            Manage your account on the web.{'\n'}
            Subscriptions are not purchased in this app.
          </Text>
        </View>
      )}

      <View style={styles.tabBar}>
        {(['connections', 'collections', 'settings'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' },
  logo: { fontSize: 24, fontWeight: '700', color: '#fafafa' },
  accent: { color: '#a78bfa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  signOut: { color: '#a78bfa', fontSize: 14 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: '600', color: '#fafafa', marginBottom: 8 },
  placeholderText: { color: '#71717a', textAlign: 'center', lineHeight: 22 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: '500' },
  tabActive: { color: '#a78bfa' },
});
