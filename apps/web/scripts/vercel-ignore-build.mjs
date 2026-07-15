/**
 * Per-project branch gate for the shared apps/web root.
 * Exit 1 = build, exit 0 = skip (Vercel Ignored Build Step).
 *
 * code-card-web  → main only
 * codecard-mvp   → mvp only
 */
const projectId = process.env.VERCEL_PROJECT_ID ?? "";
const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";

const MVP_PROJECT_ID = "prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN";
const MAIN_PROJECT_ID = "prj_E5wdwC2T4SYTZsRS6xh20p56LJZn";

const allowedBranch =
  projectId === MVP_PROJECT_ID
    ? "mvp"
    : projectId === MAIN_PROJECT_ID
      ? "main"
      : "main";

process.exit(branch === allowedBranch ? 1 : 0);
