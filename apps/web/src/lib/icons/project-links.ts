import type { IconType } from 'react-icons';
import { FaGithub } from 'react-icons/fa6';
import {
  HiOutlineGlobeAlt,
  HiOutlineDocumentText,
  HiOutlinePlay,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';

export function resolveProjectLinkIcon(type: string): IconType {
  const t = type.toLowerCase();
  if (t === 'repo' || t === 'github') return FaGithub;
  if (t === 'paper' || t === 'research') return HiOutlineDocumentText;
  if (t === 'live' || t === 'demo') return HiOutlinePlay;
  if (t === 'website') return HiOutlineGlobeAlt;
  return HiOutlineArrowTopRightOnSquare;
}

export function getProjectLinkAria(type: string, label: string | null): string {
  if (label) return label;
  const labels: Record<string, string> = {
    repo: 'GitHub repository',
    github: 'GitHub',
    live: 'Live demo',
    demo: 'Live demo',
    paper: 'Research paper',
    website: 'Website',
  };
  return labels[type.toLowerCase()] ?? 'External link';
}
