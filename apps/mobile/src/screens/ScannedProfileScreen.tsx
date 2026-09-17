import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { connectFromQrScan, loadPublicProfileBySlug, type PublicTargetProfile } from '../lib/connections';
import { getMobileAppOrigin, getPublicProfileLinkForShare } from '../lib/public-codecard-url';
import { colors } from '../theme';

export function ScannedProfileScreen({
  slug,
  fromQr,
  ownerUserId,
  ownerProfileId,
  ownerTenantId,
  onDone,
}: {
  slug: string;
  fromQr: boolean;
  ownerUserId: string;
  ownerProfileId: string;
  ownerTenantId: string;
  onDone: () => void;
}) {
  const [profile, setProfile] = useState<PublicTargetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const origin = useMemo(() => getMobileAppOrigin(), []);
  const publicUrl = origin ? getPublicProfileLinkForShare(slug, origin) : null;

  useEffect(() => {
    let cancelled = false;
    void loadPublicProfileBySlug(supabase, slug).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setProfile(null);
      } else {
        setProfile(result.profile);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function connect() {
    if (!profile || !fromQr) return;
    setBusy(true);
    setError('');
    const result = await connectFromQrScan(supabase, {
      ownerUserId,
      ownerTenantId,
      ownerProfileId,
      target: profile,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(
      result.alreadyConnected
        ? `${profile.display_name} is already in Connections.`
        : `Connected with ${profile.display_name}.`,
    );
  }

  async function openPublic() {
    if (!publicUrl) return;
    await Linking.openURL(publicUrl);
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
        <Text style={styles.title}>Could not open this CodeCard</Text>
        <Text style={styles.body}>{error || 'This profile is not public.'}</Text>
        <TouchableOpacity style={styles.ghost} onPress={onDone}>
          <Text style={styles.ghostText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={onDone}>
        <Text style={styles.backText}>Done</Text>
      </TouchableOpacity>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarLetter}>{profile.display_name.slice(0, 1)}</Text>
        </View>
      )}
      <Text style={styles.name}>{profile.display_name}</Text>
      {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}

      {fromQr ? (
        <TouchableOpacity style={styles.primary} onPress={() => void connect()} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Connect'}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.note}>
          Connect in person. Scan their CodeCard QR — ordinary links are just for viewing.
        </Text>
      )}

      <TouchableOpacity style={styles.secondary} onPress={() => void openPublic()}>
        <Text style={styles.secondaryText}>Open public CodeCard</Text>
      </TouchableOpacity>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  avatar: { width: 96, height: 96, borderRadius: 48, marginTop: 24, backgroundColor: colors.paper },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: 24,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.ink, fontSize: 36, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 28, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  headline: { color: colors.muted, fontSize: 16, marginTop: 6, textAlign: 'center' },
  primary: {
    marginTop: 32,
    backgroundColor: colors.accentStrong,
    borderRadius: 16,
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondary: {
    marginTop: 12,
    borderRadius: 16,
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  ghost: { marginTop: 16, minHeight: 44, justifyContent: 'center' },
  ghostText: { color: colors.accent, fontSize: 16 },
  note: { color: colors.smoke, textAlign: 'center', marginTop: 28, lineHeight: 22, fontSize: 15 },
  status: { color: colors.accent, marginTop: 16, textAlign: 'center' },
  error: { color: colors.danger, marginTop: 12, textAlign: 'center' },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.smoke, fontSize: 16, textAlign: 'center', marginTop: 12 },
});
