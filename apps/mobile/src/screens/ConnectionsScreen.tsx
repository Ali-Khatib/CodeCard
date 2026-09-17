import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { listOwnerConnections, type OwnerConnection } from '../lib/connections';
import { getMobileAppOrigin, getPublicProfileLinkForShare } from '../lib/public-codecard-url';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export function ConnectionsScreen({ userId }: { userId: string }) {
  const [connections, setConnections] = useState<OwnerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const origin = getMobileAppOrigin();

  const load = useCallback(async () => {
    const result = await listOwnerConnections(supabase, userId);
    if (!result.ok) {
      setError(result.error);
      setConnections([]);
    } else {
      setError('');
      setConnections(result.connections);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openCard(connection: OwnerConnection) {
    if (!origin || !connection.slug || !connection.isPublic) return;
    const url = getPublicProfileLinkForShare(connection.slug, origin);
    if (url) await Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connections</Text>
      <Text style={styles.subtitle}>People you saved from in-person QR scans.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Your connections will appear here. Scan a CodeCard QR to connect with someone.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{item.displayName.slice(0, 1)}</Text>
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.name}>{item.displayName}</Text>
                {item.headline ? <Text style={styles.headline}>{item.headline}</Text> : null}
              </View>
            </View>
            <TouchableOpacity
              style={styles.open}
              onPress={() => void openCard(item)}
              disabled={!item.slug || !item.isPublic}
            >
              <Text style={styles.openText}>
                {item.slug && item.isPublic ? 'Open CodeCard' : 'CodeCard unavailable'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, paddingHorizontal: 24, paddingTop: 12 },
  subtitle: { color: colors.smoke, fontSize: 15, paddingHorizontal: 24, marginTop: 6, marginBottom: 8 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.ink, fontWeight: '700' },
  meta: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600', color: colors.ink },
  headline: { fontSize: 14, color: colors.muted, marginTop: 4 },
  open: { marginTop: 14, minHeight: 44, justifyContent: 'center' },
  openText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  empty: { color: colors.smoke, textAlign: 'center', marginTop: 48, lineHeight: 22, paddingHorizontal: 24 },
  error: { color: colors.danger, paddingHorizontal: 24, marginTop: 8 },
});
