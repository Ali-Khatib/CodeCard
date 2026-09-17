import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
} from 'react-native';
import { signInSchema, signUpSchema } from '@codecard/validation';
import { supabase } from '../lib/supabase';
import { getMobileAppOrigin } from '../lib/public-codecard-url';
import { colors } from '../theme';

interface SignInScreenProps {
  onSuccess: () => void;
}

export function SignInScreen({ onSuccess }: SignInScreenProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const appOrigin = useMemo(() => getMobileAppOrigin(), []);

  async function handleSignIn() {
    setError('');
    setNotice('');
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    onSuccess();
  }

  async function handleSignUp() {
    setError('');
    setNotice('');
    const parsed = signUpSchema.safeParse({
      email,
      password,
      display_name: displayName,
      slug,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    const redirectTo = appOrigin ? `${appOrigin}/auth/confirmed` : undefined;
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          display_name: parsed.data.display_name,
          slug: parsed.data.slug,
        },
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      onSuccess();
      return;
    }

    setNotice('Check your email to confirm this account, then sign in.');
    setMode('sign-in');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>
          Code<Text style={styles.accent}>Card</Text>
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'sign-in' ? 'Sign in to carry your CodeCard' : 'Create your CodeCard account'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.smoke}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.smoke}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'sign-in' ? 'password' : 'password-new'}
        />
        {mode === 'sign-up' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={colors.smoke}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={styles.input}
              placeholder="Public username"
              placeholderTextColor={colors.smoke}
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={mode === 'sign-in' ? handleSignIn : handleSignUp}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>
          )}
        </TouchableOpacity>

        {appOrigin ? (
          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => void Linking.openURL(`${appOrigin}/forgot-password`)}
          >
            <Text style={styles.switchText}>Forgot password</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => {
            setError('');
            setNotice('');
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          style={styles.switchMode}
        >
          <Text style={styles.switchText}>
            {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Same CodeCard account as the web app. Projects, research, and billing stay on the web.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  accent: { color: colors.accent },
  subtitle: { color: colors.smoke, textAlign: 'center', marginTop: 8, marginBottom: 32, fontSize: 16 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    color: colors.ink,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 52,
  },
  button: {
    backgroundColor: colors.accentStrong,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 17 },
  error: { color: colors.danger, marginBottom: 8, textAlign: 'center' },
  notice: { color: colors.accent, marginBottom: 8, textAlign: 'center' },
  switchMode: { marginTop: 20, minHeight: 44, justifyContent: 'center' },
  switchText: { color: colors.accent, textAlign: 'center', fontSize: 15 },
  note: { color: colors.dim, fontSize: 13, textAlign: 'center', marginTop: 28, lineHeight: 18 },
});
