import os

base_dir = "/Users/devtyagi/Downloads/agency-desk/frontend"

files = {
    "app/layout.tsx": """import './globals.css';
import { Toaster } from "@/components/ui/toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}""",
    "app/page.tsx": """import { redirect } from "next/navigation";
export default function Home() {
  redirect("/login");
}""",
    "app/login/page.tsx": """'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setTokens } from '@/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencySlug, setAgencySlug] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { access_token, refresh_token, role, agency_id } = await login({ email, password, agency_slug: agencySlug });
      setTokens(access_token, refresh_token, role, agency_id);
      if (role === 'client_user') router.push('/portal');
      else router.push('/dashboard');
    } catch (e) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <input type="text" placeholder="Agency Slug" value={agencySlug} onChange={e => setAgencySlug(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}""",
    "app/(agency)/layout.tsx": """'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, isClientUser } from '@/lib/auth';

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
    else if (isClientUser()) router.push('/portal');
  }, [router]);
  return <div className="flex"><nav className="w-64 p-4 border-r">Nav</nav><main className="flex-1 p-4">{children}</main></div>;
}""",
    "app/(agency)/dashboard/page.tsx": """export default function Dashboard() { return <div>Dashboard</div>; }""",
    "app/(agency)/projects/[projectId]/page.tsx": """export default function ProjectDetail() { return <div>Project Detail</div>; }""",
    "app/(agency)/projects/[projectId]/dashboard/page.tsx": """export default function ProjectDashboard() { return <div>Project Dashboard</div>; }""",
    "app/(agency)/clients/page.tsx": """export default function Clients() { return <div>Clients</div>; }""",
    "app/(client)/layout.tsx": """'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, isClientUser } from '@/lib/auth';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
    else if (!isClientUser()) router.push('/dashboard');
  }, [router]);
  return <div className="p-4">{children}</div>;
}""",
    "app/(client)/portal/page.tsx": """export default function Portal() { return <div>Portal</div>; }""",
    "app/(client)/portal/projects/[projectId]/page.tsx": """export default function PortalProject() { return <div>Portal Project</div>; }""",
    "components/TaskCard.tsx": """export const TaskCard = () => <div>Task</div>;""",
    "components/TaskModal.tsx": """export const TaskModal = () => <div>Modal</div>;""",
    "components/KanbanBoard.tsx": """export const KanbanBoard = () => <div>Board</div>;""",
    "components/ProjectDashboardStats.tsx": """export const ProjectDashboardStats = () => <div>Stats</div>;"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
