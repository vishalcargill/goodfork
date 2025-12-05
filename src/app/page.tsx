import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { LandingPageContent } from "@/components/landing/landing-page-content";

export default async function Home() {
  const currentUser = await getAuthenticatedUser();

  if (currentUser) {
    const isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL;
    redirect(isAdmin ? "/admin" : "/menus");
  }

  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <LandingPageContent />
      </main>
    </div>
  );
}
