import { permanentRedirect } from 'next/navigation';

/** Bibliography lives at /research — keep old URL working. */
export default function ResearchReferencesRedirect() {
  permanentRedirect('/research');
}
