/**
 * Per-project branch gate.
 * Exit 1 = build, exit 0 = skip (Vercel Ignored Build Step).
 *
 * codecard-mvp   → mvp only
 * code-card-web  → main only
 * codecard       → main only (monorepo-root project; must not build mvp)
 * anything else  → main only
 */
const projectId = process.env.VERCEL_PROJECT_ID ?? "";
const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";

const MVP_PROJECT_ID = "prj_ZTosasXt5TxnUQf4WTfcTbN8k1UN";
// code-card-web + codecard (monorepo root) and any other linked project → main only
const allowedBranch = projectId === MVP_PROJECT_ID ? "mvp" : "main";

process.exit(branch === allowedBranch ? 1 : 0);
