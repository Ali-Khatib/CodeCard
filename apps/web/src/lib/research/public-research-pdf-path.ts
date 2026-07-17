/** Same-origin public research PDF delivery path (no client-supplied URL). */
export function publicResearchPdfPath(paperId: string): string {
  return `/api/public/research/${encodeURIComponent(paperId)}/pdf`;
}

/** Demo research paper ids used on /demo routes (not stored in the database). */
export function isDemoResearchPaperId(paperId: string): boolean {
  return /^research-demo-\d+$/.test(paperId);
}
