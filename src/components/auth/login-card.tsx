"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Sparkles } from "lucide-react";

import { useLoginMutation } from "@/services/client/login.client";

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const apiResponse = loginMutation.data;
  const isSuccess = apiResponse?.success === true;
  const fieldErrors = apiResponse?.success === false ? apiResponse.fieldErrors ?? {} : {};
  const pending = loginMutation.isPending;

  const generalError =
    (!isSuccess && apiResponse && !apiResponse.success ? apiResponse.message : null) ??
    (loginMutation.isError ? loginMutation.error.message : null);

  const successHref = isSuccess
    ? apiResponse.user.isAdmin
      ? "/admin"
      : `/?prefillEmail=${encodeURIComponent(apiResponse.user.email)}`
    : "/onboarding";

  useEffect(() => {
    if (isSuccess && apiResponse.user.isAdmin) {
      router.replace("/admin");
    }
  }, [apiResponse?.user.isAdmin, isSuccess, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <div className='relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_18px_45px_rgba(16,185,129,0.16)]'>
      <div className='absolute right-6 top-4 h-20 w-20 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-lime-100 blur-2xl' />
      <div className='relative'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <p className='text-sm font-semibold text-slate-900'>Welcome back</p>
            <p className='text-xs text-slate-600'>Log in to personalize</p>
          </div>
          <span className='inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800'>
            <Lock className='h-3.5 w-3.5' />
            Secure
          </span>
        </div>

        {isSuccess ? (
          <div className='rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900' role='status' aria-live='polite'>
            <p className='flex items-center gap-2 font-semibold'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
              {apiResponse.message}
            </p>
            <Link href={successHref} className='mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 underline'>
              {apiResponse.user.isAdmin ? "Open admin console" : "Jump to recommendations"}
              <Sparkles className='h-3.5 w-3.5' />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <label className='block space-y-2 text-sm font-medium text-slate-800'>
              Email
              <input
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='you@example.com'
                className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                autoComplete='email'
              />
              {fieldErrors.email ? (
                <span id='login-email-error' className='text-xs text-rose-600'>
                  {fieldErrors.email[0]}
                </span>
              ) : null}
            </label>
            <label className='block space-y-2 text-sm font-medium text-slate-800'>
              Password
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='••••••••'
                className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                autoComplete='current-password'
              />
              {fieldErrors.password ? (
                <span id='login-password-error' className='text-xs text-rose-600'>
                  {fieldErrors.password[0]}
                </span>
              ) : null}
            </label>

            {generalError ? (
              <p className='text-sm text-rose-600' role='alert' aria-live='assertive'>
                {generalError}
              </p>
            ) : null}

            <button
              type='submit'
              disabled={pending}
              className='flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {pending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Signing in
                </>
              ) : (
                <>
                  Continue
                  <Sparkles className='h-4 w-4' />
                </>
              )}
            </button>

            <p className='text-center text-xs text-slate-600'>
              Need an account?{" "}
              <Link href='/onboarding' className='font-semibold text-emerald-700 underline'>
                Start onboarding
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
