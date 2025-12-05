"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/common/logo.component";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";
import { Button } from "@/components/ui/button";

type HeaderUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

type HeaderProps = {
  currentUser?: HeaderUser | null;
};

export function Header({ currentUser = null }: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const showMarketingCtas = pathname === "/" && !currentUser;

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-emerald-100/50 bg-white/80 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white/0 backdrop-blur-none"
      }`}
    >
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <Link href='/' aria-label='GoodFork home' className='flex items-center gap-2 transition-opacity hover:opacity-90'>
          <Logo />
        </Link>

        <div className='flex items-center gap-4'>
          {currentUser ? (
            <ProfileMenu user={currentUser} />
          ) : showMarketingCtas ? (
            <div className="flex items-center gap-3">
              <SmoothScrollLink
                targetId='login'
                className='text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:inline-block transition-colors'
              >
                Log in
              </SmoothScrollLink>
              <Link href='/onboarding'>
                <Button variant="default" size="sm" className="shadow-sm">
                  Start personalization
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

type ProfileMenuProps = {
  user: HeaderUser;
};

function ProfileMenu({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const initials = user.name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const personalizationUrl = `/personalization`;
  const menusUrl = `/menus?prefillEmail=${encodeURIComponent(user.email)}`;
  const goalAlignmentUrl = `/goal-alignment`;
  const pantryUrl = `/pantry`;

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to log out.");
      }
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Unable to log out. Try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className='relative' ref={menuRef}>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5'
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <span className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white'>
          {initials || <UserRound className='h-4 w-4' />}
        </span>
        <span className='hidden sm:inline'>{user.name.split(" ")[0] ?? "Profile"}</span>
        <ChevronDown className='h-4 w-4 text-emerald-700' />
      </button>
      {open ? (
        <div
          role='menu'
          className='absolute right-0 mt-3 w-64 rounded-3xl border border-emerald-100 bg-white p-4 text-sm text-slate-700 shadow-[0_18px_50px_rgba(16,185,129,0.15)]'
        >
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600'>Signed in as</p>
          <p className='mt-1 font-semibold text-slate-900'>{user.name}</p>
          <p className='text-xs text-slate-500'>{user.email}</p>
          <div className='mt-4 space-y-2'>
            <Link
              href={personalizationUrl}
              className='block rounded-2xl border border-emerald-100 px-4 py-3 font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50'
              onClick={() => setOpen(false)}
            >
              Personalization settings
            </Link>
            <Link
              href={goalAlignmentUrl}
              className='block rounded-2xl border border-emerald-100 px-4 py-3 font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50'
              onClick={() => setOpen(false)}
            >
              Goal alignment
            </Link>
            <Link
              href={pantryUrl}
              className='block rounded-2xl border border-emerald-100 px-4 py-3 font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50'
              onClick={() => setOpen(false)}
            >
              Pantry manager
            </Link>
            <Link
              href={menusUrl}
              className='block rounded-2xl border border-slate-100 px-4 py-3 font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50'
              onClick={() => setOpen(false)}
            >
              My menus
            </Link>
            <button
              type='button'
              onClick={handleLogout}
              disabled={isLoggingOut}
              className='block w-full rounded-2xl border border-rose-100 px-4 py-3 font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-70'
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
          <p className='mt-3 text-xs text-slate-400'>Update your goals, allergens, or password anytime.</p>
        </div>
      ) : null}
    </div>
  );
}
