import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/login-card";
import { HeroIllustration } from "@/components/landing/hero-illustration";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";

const vibeNotes = [
  {
    title: "Inventory-aware intake",
    description: "We collect only the signals the kitchen can honor so recommendations never show ghost dishes.",
  },
  {
    title: "Goal-first prompts",
    description: "Lean muscle, metabolic reset, or balanced energy—we translate each pick into macros instantly.",
  },
  {
    title: "Swap-ready data",
    description: "Every input primes the healthy swap engine so your menus always have a Plan B.",
  },
];

export default async function Home() {
  const currentUser = await getAuthenticatedUser();

  if (currentUser) {
    const isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL;
    redirect(isAdmin ? "/admin" : "/menus");
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <main className='mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8'>
        {/* Hero Section */}
        <section className='grid gap-10 rounded-2xl border border-border bg-surface p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
          <div className='space-y-6'>
            <h1 className='text-4xl font-bold leading-tight text-foreground sm:text-5xl'>
              <span className='text-primary'>GoodFork</span> hijacks boring meal plans into
              exciting, healthy and nutrition-packed menus.
            </h1>
          </div>
          <HeroIllustration />
        </section>

        {/* Features Section */}
        <section className='rounded-2xl border border-border bg-surface p-8 shadow-sm'>
          <div className='grid gap-6 lg:grid-cols-3'>
            {vibeNotes.map((note) => (
              <article
                key={note.title}
                className='rounded-xl border border-border-subtle bg-surface-subtle p-6'
              >
                <h3 className='mt-2 text-lg font-semibold text-foreground'>{note.title}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{note.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Login Section */}
        <section
          id='login'
          className='grid gap-10 rounded-2xl border border-border bg-surface p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:items-center'
        >
          <div className='space-y-4'>
            <p className='text-xs font-semibold uppercase tracking-widest text-primary'>Already onboarded?</p>
            <h2 className='text-3xl font-semibold text-foreground'>Hop back in without the fluff.</h2>
            <p className='text-base text-muted-foreground'>Logging in bounces you to with your latest preferences.</p>
          </div>
          <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
            <LoginCard />
          </div>
        </section>
      </main>
    </div>
  );
}
