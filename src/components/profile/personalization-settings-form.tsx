"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProfileSettingsMutation, type ProfileApiResponse } from "@/services/client/profile.client";
import type { UserProfile } from "@/generated/prisma/client";
import type { ProfileSettingsPayload } from "@/schema/profile-settings.schema";
import { ALLERGEN_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS, TASTE_OPTIONS } from "@/constants/personalization-options";

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
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(profile?.dietaryPreferences ?? []);
  const [tastePreferences, setTastePreferences] = useState<string[]>(profile?.tastePreferences ?? []);
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

  const dietSummary = useMemo(() => {
    if (dietaryPreferences.length === 0) {
      return "No diet styles set";
    }
    return DIET_OPTIONS.filter((diet) => dietaryPreferences.includes(diet.value))
      .map((diet) => diet.label)
      .join(" · ");
  }, [dietaryPreferences]);

  const tasteSummary = useMemo(() => {
    if (tastePreferences.length === 0) {
      return "Add taste vibes";
    }
    return TASTE_OPTIONS.filter((taste) => tastePreferences.includes(taste.value))
      .map((taste) => taste.label)
      .join(" · ");
  }, [tastePreferences]);

  const toggleGoal = (value: string) => {
    setGoals((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const toggleAllergen = (value: string) => {
    setAllergens((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const toggleDiet = (value: string) => {
    setDietaryPreferences((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const toggleTaste = (value: string) => {
    setTastePreferences((prev) => (prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ProfileSettingsPayload = {
      dietaryGoals: goals,
      allergens,
      dietaryPreferences,
      tastePreferences,
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
  const dietError = fieldErrors.dietaryPreferences?.[0];
  const tasteError = fieldErrors.tastePreferences?.[0];
  const passwordError = fieldErrors.password?.[0];
  const confirmPasswordError = fieldErrors.confirmPassword?.[0];

  const disableSave = mutation.isPending || goals.length === 0;

  return (
    <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
      <div className='space-y-3 rounded-lg border border-border bg-surface-subtle p-5'>
        <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Live shields</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-lg border border-border bg-surface p-4'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Goals</p>
            <p className='mt-2 text-sm font-semibold text-foreground'>{goalSummary}</p>
          </div>
          <div className='rounded-lg border border-border bg-surface p-4'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Allergen shields</p>
            <p className='mt-2 text-sm font-semibold text-foreground'>{allergenSummary}</p>
          </div>
          <div className='rounded-lg border border-border bg-surface p-4'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Diet styles</p>
            <p className='mt-2 text-sm font-semibold text-foreground'>{dietSummary}</p>
          </div>
          <div className='rounded-lg border border-border bg-surface p-4'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Taste vibes</p>
            <p className='mt-2 text-sm font-semibold text-foreground'>{tasteSummary}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='mt-8 space-y-8'>
        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Goals</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground'>
              <ShieldCheck className='h-3.5 w-3.5' />
              Priority match
            </span>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>Tap all goals that best represent this season&apos;s focus.</p>
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            {GOAL_OPTIONS.map((goal) => {
              const active = goals.includes(goal.value);
              return (
                <button
                  type='button'
                  key={goal.value}
                  onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left shadow-sm transition",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-surface text-foreground hover:bg-surface-subtle"
                  )}
                >
                  <p className='text-sm font-semibold'>{goal.label}</p>
                  <p className='text-xs opacity-80'>{goal.helper}</p>
                </button>
              );
            })}
          </div>
          {goalError ? (
            <p className='mt-2 text-sm text-destructive'>{goalError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Dietary styles</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground'>
              Strict filter
            </span>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>We only show menus that match these styles.</p>
          <div className='mt-4 flex flex-wrap gap-2'>
            {DIET_OPTIONS.map((diet) => {
              const active = dietaryPreferences.includes(diet.value);
              return (
                <button
                  type='button'
                  key={diet.value}
                  onClick={() => toggleDiet(diet.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {diet.label}
                </button>
              );
            })}
          </div>
          {dietError ? (
            <p className='mt-2 text-sm text-destructive'>{dietError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Taste profile</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground'>
              Flavor boosts
            </span>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>We’ll favor menus that match these taste vibes.</p>
          <div className='mt-4 flex flex-wrap gap-2'>
            {TASTE_OPTIONS.map((taste) => {
              const active = tastePreferences.includes(taste.value);
              return (
                <button
                  type='button'
                  key={taste.value}
                  onClick={() => toggleTaste(taste.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-lime-400 bg-lime-50 text-emerald-800"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {taste.label}
                </button>
              );
            })}
          </div>
          {tasteError ? (
            <p className='mt-2 text-sm text-destructive'>{tasteError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-foreground'>Allergen shields</h2>
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground'>
              Safety first
            </span>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>We never surface menus carrying these allergens.</p>
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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {allergenError ? (
            <p className='mt-2 text-sm text-destructive'>{allergenError}</p>
          ) : null}
        </section>

        <section>
          <div className='flex items-center gap-2'>
            <Lock className='h-4 w-4 text-primary' />
            <h2 className='text-lg font-semibold text-foreground'>Change password</h2>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>Leave these fields blank to keep your existing password.</p>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <label className='space-y-2 text-sm font-medium text-foreground'>
              New password
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='••••••••'
                className='w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-primary'
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "profile-password-error" : undefined}
                autoComplete='new-password'
              />
              {passwordError ? (
                <span id='profile-password-error' className='text-xs text-destructive'>
                  {passwordError}
                </span>
              ) : null}
            </label>
            <label className='space-y-2 text-sm font-medium text-foreground'>
              Confirm new password
              <input
                type='password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder='••••••••'
                className='w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-primary'
                aria-invalid={Boolean(confirmPasswordError)}
                aria-describedby={confirmPasswordError ? "profile-password-confirm-error" : undefined}
                autoComplete='new-password'
              />
              {confirmPasswordError ? (
                <span id='profile-password-confirm-error' className='text-xs text-destructive'>
                  {confirmPasswordError}
                </span>
              ) : null}
            </label>
          </div>
        </section>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-muted-foreground'>Signed in as {user.email}</p>
          <button
            type='submit'
            disabled={disableSave}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
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
