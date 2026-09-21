import { DemoWorkspaceFrame } from '@/components/dashboard/demo-workspace-frame';

export default function DemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <DemoWorkspaceFrame>{children}</DemoWorkspaceFrame>;
}
