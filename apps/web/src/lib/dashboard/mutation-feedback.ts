/**
 * Shared mutation feedback helpers for authenticated dashboard actions.
 * Keeps user-facing copy safe and consistent across profile/project/research flows.
 */

export type MutationFeedbackVariant = 'success' | 'error';

export type MutationFeedbackItem = {
  id: string;
  variant: MutationFeedbackVariant;
  message: string;
  createdAt: number;
};

export const MUTATION_FEEDBACK = {
  profile: {
    saved: 'Profile saved',
    published: 'Profile published',
    unpublished: 'Profile unpublished',
    photoUpdated: 'Profile photo updated',
    linkAdded: 'Link added',
    linkUpdated: 'Link updated',
    linkDeleted: 'Link deleted',
    linkOrderUpdated: 'Link order updated',
    saveFailed: 'We couldn’t save your profile. Try again.',
    publishFailed: 'We couldn’t update profile visibility. Try again.',
    photoFailed: 'We couldn’t update your profile photo. Try again.',
    linkFailed: 'We couldn’t update that link. Try again.',
  },
  project: {
    created: 'Project created',
    saved: 'Project saved',
    published: 'Project published',
    unpublished: 'Project unpublished',
    deleted: 'Project deleted',
    createFailed: 'We couldn’t create this project. Try again.',
    saveFailed: 'We couldn’t update this project. Try again.',
    publishFailed: 'We couldn’t update project visibility. Try again.',
    deleteFailed: 'The project could not be deleted. Try again.',
  },
  research: {
    created: 'Research paper created',
    saved: 'Research paper saved',
    published: 'Research paper published',
    unpublished: 'Research paper unpublished',
    deleted: 'Research paper deleted',
    figureAdded: 'Figure added',
    figureRemoved: 'Figure removed',
    figureOrderSaved: 'Figure order saved',
    captionSaved: 'Caption saved',
    createFailed: 'We couldn’t create this research paper. Try again.',
    saveFailed: 'We couldn’t save this research paper. Try again.',
    publishFailed: 'We couldn’t update research visibility. Try again.',
    deleteFailed: 'The research paper could not be deleted. Try again.',
    figureFailed: 'We couldn’t update that figure. Try again.',
  },
  account: {
    exportReady: 'Account export ready',
    exportFailed: 'We couldn’t prepare your export. Your account was not changed.',
    exportDemo: 'Demo export only — no account data was downloaded.',
    deleted: 'Your CodeCard account has been deleted.',
    deleteFailed: 'We couldn’t delete your account. Nothing was changed.',
    deleteDemo: 'Demo only — no account was deleted.',
  },
  sessionExpired: 'Your session expired. Sign in again.',
  genericFailure: 'Something went wrong. Try again.',
} as const;

const UNSAFE_ERROR_PATTERN =
  /postgres|supabase|pgrst|jwt|stack trace|bucket\/|storage\/|service.?role|sk_(live|test)|whsec_|sqlstate|relation "|column "|foreign key|violates|uuid[_\s-]?[0-9a-f-]{8}|tenant_id|user_id|stripe_(customer|subscription)|ECONNREFUSED|ENOENT/i;

/** Product messages already authored for users — safe to surface when exact. */
const KNOWN_SAFE_MESSAGES = new Set<string>([
  ...Object.values(MUTATION_FEEDBACK.profile),
  ...Object.values(MUTATION_FEEDBACK.project),
  ...Object.values(MUTATION_FEEDBACK.research),
  ...Object.values(MUTATION_FEEDBACK.account),
  MUTATION_FEEDBACK.sessionExpired,
  MUTATION_FEEDBACK.genericFailure,
]);

/**
 * Map an unknown mutation error into safe user-facing text.
 * Never forwards raw SQL, storage paths, IDs, or provider internals.
 */
export function sanitizeMutationError(
  raw: unknown,
  fallback: string = MUTATION_FEEDBACK.genericFailure,
): string {
  if (typeof raw !== 'string') return fallback;
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return fallback;
  if (KNOWN_SAFE_MESSAGES.has(text)) return text;
  if (text.length > 160) return fallback;
  if (UNSAFE_ERROR_PATTERN.test(text)) return fallback;
  // Allow short validation-style guidance from our own cores (no internals).
  if (/^[A-Za-z0-9].*[.!?]?$/.test(text) && !/[<>{}]/.test(text) && text.split(' ').length <= 28) {
    return text;
  }
  return fallback;
}

export function createMutationFeedbackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
