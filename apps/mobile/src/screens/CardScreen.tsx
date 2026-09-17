import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Linking,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../lib/supabase';
import { buildOwnerCardPresentation } from '../lib/card-view';
import { getMobileAppOrigin } from '../lib/public-codecard-url';
import { colors } from '../theme';

type OwnerProfile = {
  id: string;
  tenant_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

export function CardScreen({
  userId,
  onScan,
  onOpenSettings,
}: {
  userId: string;
  onScan: () => void;
  onOpenSettings: () => void;
}) {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const origin = useMemo(() => getMobileAppOrigin(), []);

  const load = useCallback(async () => {
    setError('');
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, tenant_id, slug, display_name, headline, avatar_url, is_public')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile((data as OwnerProfile | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const card = profile && origin ? buildOwnerCardPresentation(profile, origin) : null;
  const shareUrl = card?.shareUrl ?? null;
  const qrUrl = card?.qrUrl ?? null;

  async function shareCard() {
    if (!shareUrl) return;
    await Share.share({
      message: shareUrl,
      url: shareUrl,
      title: 'My CodeCard',
    });
  }

  async function openPublicCard() {
    if (!card?.publicUrl) return;
    await Linking.openURL(card.publicUrl);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Finish your CodeCard on the web</Text>
        <Text style={styles.emptyBody}>
          This app shows the CodeCard you already published. Create your identity in the web
          workspace, then come back here to share it in person.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.secondary} onPress={onOpenSettings}>
          <Text style={styles.secondaryText}>Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.kicker}>Your card</Text>
        <TouchableOpacity onPress={onOpenSettings} hitSlop={12} style={styles.settingsHit}>
          <Text style={styles.settingsLink}>Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.identity}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{profile.display_name.slice(0, 1)}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
        <Text style={styles.visibility}>
          {profile.is_public ? 'Published' : 'Private — publish on the web to share'}
        </Text>
      </View>

      <View style={styles.qrCard}>
        {qrUrl && profile.is_public ? (
          <>
            <View style={styles.qrWell}>
              <QRCode value={qrUrl} size={220} backgroundColor={colors.qrLight} color="#111111" />
            </View>
            <Text style={styles.qrHint}>Scan to open this public CodeCard</Text>
          </>
        ) : (
          <Text style={styles.qrHint}>
            Publish your CodeCard on the web to show a scannable QR.
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.primary} onPress={onScan}>
        <Text style={styles.primaryText}>Scan a CodeCard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => void shareCard()} disabled={!shareUrl}>
        <Text style={styles.secondaryText}>Share link</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghost} onPress={() => void openPublicCard()} disabled={!shareUrl}>
        <Text style={styles.ghostText}>Open public CodeCard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    minHeight: 44,
  },
  kicker: { color: colors.smoke, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' },
  settingsHit: { minHeight: 44, justifyContent: 'center' },
  settingsLink: { color: colors.accent, fontSize: 16 },
  identity: { alignItems: 'center', marginTop: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.paper },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.ink, fontSize: 32, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 28, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  headline: { color: colors.muted, fontSize: 16, marginTop: 6, textAlign: 'center' },
  visibility: { color: colors.smoke, fontSize: 14, marginTop: 8 },
  qrCard: {
    marginTop: 28,
    backgroundColor: colors.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  qrWell: { backgroundColor: colors.qrLight, padding: 16, borderRadius: 16 },
  qrHint: { color: colors.smoke, fontSize: 14, marginTop: 14, textAlign: 'center' },
  primary: {
    marginTop: 24,
    backgroundColor: colors.accentStrong,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondary: {
    marginTop: 12,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  ghost: { marginTop: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.accent, fontSize: 16 },
  emptyTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: colors.smoke, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  error: { color: colors.danger, marginTop: 12, textAlign: 'center' },
});
