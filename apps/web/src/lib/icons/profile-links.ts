import type { IconType } from 'react-icons';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { SiX, SiYoutube, SiGitlab } from 'react-icons/si';
import { HiOutlineGlobeAlt, HiOutlineDocumentText, HiOutlineEnvelope } from 'react-icons/hi2';

export interface ProfileLinkItem {
  type: string;
  label: string | null;
  url: string;
}

export function resolveProfileLinkIcon(type: string): IconType {
  const t = type.toLowerCase();
  if (t === 'github') return FaGithub;
  if (t === 'linkedin') return FaLinkedin;
  if (t === 'twitter' || t === 'x') return SiX;
  if (t === 'youtube') return SiYoutube;
  if (t === 'gitlab') return SiGitlab;
  if (t === 'resume') return HiOutlineDocumentText;
  if (t === 'email') return HiOutlineEnvelope;
  return HiOutlineGlobeAlt;
}

export function getProfileLinkAria(type: string, label: string | null): string {
  if (label) return label;
  const labels: Record<string, string> = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    website: 'Website',
    resume: 'Resume',
    email: 'Email',
    twitter: 'X',
  };
  return labels[type.toLowerCase()] ?? 'External link';
}
