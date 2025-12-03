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
    <div className='relative min-h-screen overflow-hidden bg-[#f6fff4] text-slate-900'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute left-[-15%] top-[-20%] h-[580px] w-[580px] rounded-full bg-emerald-200/60 blur-[220px]' />
        <div className='absolute right-[-10%] top-1/4 h-[520px] w-[520px] rounded-full bg-lime-200/60 blur-[180px]' />
        <div className='absolute bottom-[-10%] left-1/3 h-[420px] w-[420px] rounded-full bg-amber-100/80 blur-[200px]' />
      </div>

      <main className='relative mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8'>
        <section className='grid gap-10 rounded-[40px] border border-emerald-100 bg-white/90 p-10 shadow-[0_40px_140px_rgba(16,185,129,0.15)] backdrop-blur'>
          <div className='grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
            <div className='space-y-6'>
              <h1 className='text-4xl leading-tight text-slate-900 sm:text-5xl'>
                <span className='text-emerald-500 font-semibold'>GoodFork</span> hijacks boring meal plans into
                exciting, healthy and nutrtion-packed menus.
              </h1>
            </div>
            <HeroIllustration />
          </div>
        </section>

        <section className='rounded-[36px] border border-emerald-100 bg-white/80 p-8 shadow-[0_30px_90px_rgba(16,185,129,0.12)] backdrop-blur'>
          <div className='grid gap-6 lg:grid-cols-3'>
            {vibeNotes.map((note) => (
              <article
                key={note.title}
                className='rounded-3xl border border-emerald-50 bg-gradient-to-br from-white to-emerald-50/60 p-6 shadow-inner'
              >
                <h3 className='mt-3 text-lg font-semibold text-slate-900'>{note.title}</h3>
                <p className='mt-2 text-sm text-slate-600'>{note.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id='login'
          className='grid gap-10 rounded-[36px] border border-emerald-100 bg-white/85 p-8 shadow-[0_30px_90px_rgba(16,185,129,0.12)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:items-center'
        >
          <div className='space-y-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600'>Already onboarded?</p>
            <h2 className='text-3xl font-semibold text-slate-900'>Hop back in without the fluff.</h2>
            <p className='text-base text-slate-600'>Logging in bounces you to with your latest preferences.</p>
          </div>
          <div className='rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_30px_80px_rgba(16,185,129,0.2)]'>
            <LoginCard />
          </div>
        </section>
      </main>
    </div>
  );
}
