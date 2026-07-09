import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { SavedConnection } from '@codecard/types';

interface SavedConnectionsScreenProps {
  userId: string;
  onSelect: (connectionId: string) => void;
}

interface ConnectionWithProfile extends SavedConnection {
  profile?: { display_name: string; headline: string | null; slug: string };
}

export function SavedConnectionsScreen({ userId, onSelect }: SavedConnectionsScreenProps) {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('saved_connections')
        .select('*, profile:saved_profile_id(display_name, headline, slug)')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      setConnections((data as ConnectionWithProfile[]) ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Connections</Text>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved connections yet. Save profiles from the web.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item.id)}>
            <Text style={styles.name}>
              {(item as ConnectionWithProfile & { profile: { display_name: string } }).profile
                ?.display_name ?? 'Unknown'}
            </Text>
            <Text style={styles.headline}>
              {(item as ConnectionWithProfile & { profile: { headline: string | null } }).profile
                ?.headline ?? ''}
            </Text>
            <Text style={styles.source}>via {item.source}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' },
  title: { fontSize: 24, fontWeight: '700', color: '#fafafa', padding: 24, paddingBottom: 8 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#fafafa' },
  headline: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  source: { fontSize: 12, color: '#52525b', marginTop: 8 },
  empty: { color: '#71717a', textAlign: 'center', marginTop: 48 },
});
