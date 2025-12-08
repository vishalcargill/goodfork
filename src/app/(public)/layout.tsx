import { AppShell } from "@/components/navigation/app-shell";
import { Header } from "@/components/navigation/header.component";
import { Footer } from "@/components/navigation/footer.component";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerUser = null;

  return (
    <AppShell user={headerUser} header={<Header currentUser={headerUser} />} footer={<Footer />}>
      {children}
    </AppShell>
  );
}
