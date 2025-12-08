import { LandingPageContent } from "@/components/landing/landing-page-content";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <div className='min-h-screen bg-white'>
      <main className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <LandingPageContent />
      </main>
    </div>
  );
}


