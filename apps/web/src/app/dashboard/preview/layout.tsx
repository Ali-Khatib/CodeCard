/** Passthrough — each preview route permanently redirects to `/demo/*`. */
export default function PreviewAliasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
