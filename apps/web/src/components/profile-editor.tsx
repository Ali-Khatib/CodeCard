'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label } from '@codecard/ui';
import type { Profile } from '@codecard/types';
import { parseProfileUpdate, profileToFormState } from '@/lib/profile/profile-form';

interface ProfileEditorProps {
  profile: Profile;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => profileToFormState(profile));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');

    const parsed = parseProfileUpdate(form);
    if (!parsed.success) {
      setError(parsed.message);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update(parsed.data)
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          placeholder="e.g. Full-stack engineer building developer tools"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Profile URL</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (shown later on profile)</Label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="flex w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. San Francisco, CA"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={form.skillsInput}
          onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
          placeholder="TypeScript, Next.js, C++"
        />
      </div>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-600"
        />
        <span className="text-sm">Make profile public</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
