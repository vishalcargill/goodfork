"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProfileSettingsMutation, type ProfileApiResponse } from "@/services/client/profile.client";
import type { UserProfile } from "@/generated/prisma/client";
import type { ProfileSettingsPayload } from "@/schema/profile-settings.schema";
import { ALLERGEN_OPTIONS, GOAL_OPTIONS } from "@/constants/personalization-options";

type PersonalizationSettingsFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: UserProfile | null;
};

type FieldErrors = Record<string, string[]>;

export function PersonalizationSettingsForm({ user, profile }: PersonalizationSettingsFormProps) {
  const [goals, setGoals] = useState<string[]>(profile?.dietaryGoals ?? []);
  const [allergens, setAllergens] = useState<string[]>(profile?.allergens ?? []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const mutation = useProfileSettingsMutation();

  const goalSummary = useMemo(() => {
    const labels = GOAL_OPTIONS.filter((goal) => goals.includes(goal.value)).map((goal) => goal.label);
    return labels.length > 0 ? labels.join(" · ") : "Add a goal";
  }, [goals]);

  const allergenSummary = useMemo(() => {
    if (allergens.length === 0) {
      return "No active shields";
    }
    return ALLERGEN_OPTIONS.filter((option) => allergens.includes(option.value))
      .map((option) => option.label)
      .join(" · ");
  }, [allergens]);

  const toggleGoal = (value: string) => {
    setGoals((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const toggleAllergen = (value: string) => {
    setAllergens((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ProfileSettingsPayload = {
      dietaryGoals: goals,
      allergens,
      password: password || undefined,
      confirmPassword: confirmPassword || undefined,
    };

    setFieldErrors({});

    mutation.mutate(payload, {
      onSuccess: (response: ProfileApiResponse) => {
        if (response.success) {
          setFieldErrors({});
          toast.success("Personalization saved", {
            description: "Menus and shields refresh with your new settings.",
          });
          setPassword("");
          setConfirmPassword("");
        }
      },
      onError: (error) => {
        const typed = error as Error & { fieldErrors?: FieldErrors };
        if (typed.fieldErrors) {
          setFieldErrors(typed.fieldErrors);
        }
        toast.error(error.message);
      },
    });
  };

  const goalError = fieldErrors.dietaryGoals?.[0];
  const allergenError = fieldErrors.allergens?.[0];
  const passwordError = fieldErrors.password?.[0];
  const confirmPasswordError = fieldErrors.confirmPassword?.[0];

  const disableSave = mutation.isPending || goals.length === 0;

  return (
    <div className='rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_24px_60px_rgba(16,185,129,0.12)]'>
      <div className='space-y-3 rounded-3xl border border-emerald-50 bg-emerald-50/50 p-5'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700'>Live shields</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-2xl border border-emerald-100 bg-white/80 p-4'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>Goals</p>
            <p className='mt-2 text-sm font-semibold text-slate-900'>{goalSummary}</p>
          </div>
          <div className='rounded-2xl border border-emerald-100 bg-white/80 p-4'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>Allergen shields</p>
            <p className='mt-2 text-sm font-semibold text-slate-900'>{allergenSummary}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='mt-8 space-y-8'>
        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Goals</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800'>
              <ShieldCheck className='h-3.5 w-3.5' />
              Priority match
            </span>
          </div>
          <p className='mt-1 text-sm text-slate-600'>Tap all goals that best represent this season&apos;s focus.</p>
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            {GOAL_OPTIONS.map((goal) => {
              const active = goals.includes(goal.value);
              return (
                <button
                  type='button'
                  key={goal.value}
                  onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    "rounded-3xl border px-4 py-3 text-left shadow-sm transition",
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-emerald-100 bg-white text-slate-800 hover:border-emerald-200"
                  )}
                >
                  <p className='text-sm font-semibold'>{goal.label}</p>
                  <p className='text-xs text-slate-500'>{goal.helper}</p>
                </button>
              );
            })}
          </div>
          {goalError ? (
            <p className='mt-2 text-sm text-rose-600'>{goalError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Allergen shields</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700'>
              Safety first
            </span>
          </div>
          <p className='mt-1 text-sm text-slate-600'>We never surface menus carrying these allergens.</p>
          <div className='mt-4 flex flex-wrap gap-2'>
            {ALLERGEN_OPTIONS.map((option) => {
              const active = allergens.includes(option.value);
              return (
                <button
                  type='button'
                  key={option.value}
                  onClick={() => toggleAllergen(option.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-emerald-300 bg-emerald-600/10 text-emerald-800"
                      : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-200"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {allergenError ? (
            <p className='mt-2 text-sm text-rose-600'>{allergenError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center gap-2'>
            <Lock className='h-4 w-4 text-emerald-600' />
            <h2 className='text-lg font-semibold text-slate-900'>Change password</h2>
          </div>
          <p className='mt-1 text-sm text-slate-600'>Leave these fields blank to keep your existing password.</p>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <label className='space-y-2 text-sm font-medium text-slate-800'>
              New password
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='••••••••'
                className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "profile-password-error" : undefined}
                autoComplete='new-password'
              />
              {passwordError ? (
                <span id='profile-password-error' className='text-xs text-rose-600'>
                  {passwordError}
                </span>
              ) : null}
            </label>
            <label className='space-y-2 text-sm font-medium text-slate-800'>
              Confirm new password
              <input
                type='password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder='••••••••'
                className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                aria-invalid={Boolean(confirmPasswordError)}
                aria-describedby={confirmPasswordError ? "profile-password-confirm-error" : undefined}
                autoComplete='new-password'
              />
              {confirmPasswordError ? (
                <span id='profile-password-confirm-error' className='text-xs text-rose-600'>
                  {confirmPasswordError}
                </span>
              ) : null}
            </label>
          </div>
        </section>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-slate-500'>Signed in as {user.email}</p>
          <button
            type='submit'
            disabled={disableSave}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {mutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving
              </>
            ) : (
              <>
                Save personalization
                <Sparkles className='h-4 w-4' />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
