/** Distinct pastel fills for project accordion / cards (Hume-friendly) */
export const PROJECT_CARD_COLORS = [
  { bg: '#DAE8FC', border: '#6B9ED9', glow: '107, 158, 217', label: 'blue' },
  { bg: '#D5F5E3', border: '#58D68D', glow: '88, 214, 141', label: 'green' },
  { bg: '#FADBD8', border: '#E57373', glow: '229, 115, 115', label: 'red' },
  { bg: '#EDE7F6', border: '#B39DDB', glow: '179, 157, 219', label: 'purple' },
  { bg: '#FFE8CC', border: '#FFB74D', glow: '255, 183, 77', label: 'orange' },
] as const;

export function projectColorAt(index: number) {
  return PROJECT_CARD_COLORS[index % PROJECT_CARD_COLORS.length];
}
