"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOnboardingSubmitMutation, type OnboardingResult } from "@/services/client/onboarding.client";
import type { OnboardingPayload } from "@/schema/onboarding.schema";
import { ALLERGEN_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS, TASTE_OPTIONS } from "@/constants/personalization-options";

const steps = [
  { id: "account", title: "Account basics", blurb: "So we know who to personalize for." },
  { id: "goals", title: "Goals & allergens", blurb: "Dial in health targets and safety flags." },
  {
    id: "nutrition",
    title: "Diet & taste",
    blurb: "Fine-tune dietary styles and flavor preferences.",
  },
];

const goalOptions = GOAL_OPTIONS;
const allergenOptions = ALLERGEN_OPTIONS;

type OnboardingFormValues = {
  name: string;
  email: string;
  password: string;
  dietaryGoals: string[];
  allergens: string[];
  dietaryPreferences: string[];
  tastePreferences: string[];
  lifestyleNotes: string;
};

const initialValues: OnboardingFormValues = {
  name: "",
  email: "",
  password: "",
  dietaryGoals: [],
  allergens: [],
  dietaryPreferences: [],
  tastePreferences: [],
  lifestyleNotes: "",
};

type MultiValueField = keyof Pick<
  OnboardingFormValues,
  "dietaryGoals" | "allergens" | "dietaryPreferences" | "tastePreferences"
>;

export function OnboardingFlow() {
  const [values, setValues] = useState<OnboardingFormValues>(initialValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const onboardingMutation = useOnboardingSubmitMutation();
  const isPending = onboardingMutation.isPending;
  const router = useRouter();

  const accountComplete =
    values.name.trim().length >= 2 && values.email.trim().length > 0 && values.password.trim().length >= 8;
  const goalsComplete = values.dietaryGoals.length > 0;

  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  function updateField<Field extends keyof OnboardingFormValues>(field: Field, nextValue: OnboardingFormValues[Field]) {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (result) {
      setResult(null);
    }
  }

  function toggleMulti(field: MultiValueField, option: string) {
    setValues((prev) => {
      const list = prev[field];
      const isSelected = list.includes(option);
      const nextList = isSelected ? list.filter((entry) => entry !== option) : [...list, option];
      return { ...prev, [field]: nextList };
    });
    if (result) {
      setResult(null);
    }
  }

  function handleSubmit() {
    const payload: OnboardingPayload = {
      ...values,
      lifestyleNotes: values.lifestyleNotes.trim() ? values.lifestyleNotes.trim() : null,
    };

    setResult(null);
    onboardingMutation.mutate(payload, {
      onSuccess: (data) => {
        setResult(data);
        router.refresh();
      },
      onError: () =>
        setResult({
          success: false,
          message: "Unable to save onboarding right now. Try again shortly.",
        }),
    });
  }

  const fieldError = (field: keyof OnboardingPayload) => result?.fieldErrors?.[field]?.[0];

  const showSuccess = result?.success;
  const recommendationsHref = values.email
    ? `/menus?prefillEmail=${encodeURIComponent(values.email.trim())}`
    : "/onboarding";

  return (
    <div className='rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_24px_65px_rgba(16,185,129,0.15)] sm:p-10'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>Guided onboarding</p>
          <h1 className='text-3xl font-semibold text-slate-900 sm:text-4xl'>Tell us about your nutrition goals</h1>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
            <span>Step {stepIndex + 1}</span>
            <span>{steps[stepIndex].title}</span>
          </div>
          <div className='h-2 w-full rounded-full bg-emerald-100'>
            <div
              className='h-full rounded-full bg-emerald-500 transition-all'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className='mt-8 space-y-6'>
        <div className='space-y-6'>
          <div className='rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-inner'>
            <p className='text-sm font-semibold text-emerald-800'>{steps[stepIndex].title}</p>
            <p className='text-sm text-slate-600'>{steps[stepIndex].blurb}</p>
            <div className='mt-6 space-y-6'>
              {stepIndex === 0 && (
                <>
                  <label className='block space-y-2 text-sm font-medium text-slate-800'>
                    Full name
                    <input
                      type='text'
                      value={values.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder='Jordan Winters'
                      className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                      aria-invalid={Boolean(fieldError("name"))}
                      aria-describedby={fieldError("name") ? "onboarding-name-error" : undefined}
                      autoComplete='name'
                    />
                    {fieldError("name") && (
                      <span id='onboarding-name-error' className='text-xs text-rose-600'>
                        {fieldError("name")}
                      </span>
                    )}
                  </label>
                  <label className='block space-y-2 text-sm font-medium text-slate-800'>
                    Email
                    <input
                      type='email'
                      value={values.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder='you@goodfork.com'
                      className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                      aria-invalid={Boolean(fieldError("email"))}
                      aria-describedby={fieldError("email") ? "onboarding-email-error" : undefined}
                      autoComplete='email'
                    />
                    {fieldError("email") && (
                      <span id='onboarding-email-error' className='text-xs text-rose-600'>
                        {fieldError("email")}
                      </span>
                    )}
                  </label>
                  <label className='block space-y-2 text-sm font-medium text-slate-800'>
                    Password
                    <input
                      type='password'
                      value={values.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder='••••••••'
                      className='w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                      aria-invalid={Boolean(fieldError("password"))}
                      aria-describedby={fieldError("password") ? "onboarding-password-error" : undefined}
                      autoComplete='new-password'
                    />
                    {fieldError("password") && (
                      <span id='onboarding-password-error' className='text-xs text-rose-600'>
                        {fieldError("password")}
                      </span>
                    )}
                  </label>
                </>
              )}

              {stepIndex === 1 && (
                <>
                  <div className='space-y-3' role='group' aria-label='Primary goals'>
                    <p className='text-sm font-semibold text-slate-900'>Primary goals</p>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      {goalOptions.map((goal) => {
                        const active = values.dietaryGoals.includes(goal.value);
                        return (
                          <button
                            key={goal.value}
                            type='button'
                            onClick={() => toggleMulti("dietaryGoals", goal.value)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left shadow-sm transition focus:outline-none",
                              active
                                ? "border-emerald-500 bg-white text-emerald-800 shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
                                : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-300"
                            )}
                            aria-pressed={active}
                          >
                            <p className='text-sm font-semibold'>{goal.label}</p>
                            <p className='text-xs text-slate-500'>{goal.helper}</p>
                          </button>
                        );
                      })}
                    </div>
                    {fieldError("dietaryGoals") && (
                      <p className='text-xs text-rose-600'>{fieldError("dietaryGoals")}</p>
                    )}
                  </div>

                  <div className='space-y-3' role='group' aria-label='Allergens to avoid'>
                    <p className='text-sm font-semibold text-slate-900'>Allergens to avoid</p>
                    <div className='flex flex-wrap gap-2'>
                      {allergenOptions.map((option) => {
                        const active = values.allergens.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type='button'
                            onClick={() => toggleMulti("allergens", option.value)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition",
                              active
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-200"
                            )}
                            aria-pressed={active}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {stepIndex === 2 && (
                <>
                  <div className='space-y-3' role='group' aria-label='Dietary styles'>
                    <p className='text-sm font-semibold text-slate-900'>Dietary styles</p>
                    <div className='flex flex-wrap gap-2'>
                      {DIET_OPTIONS.map((diet) => {
                        const active = values.dietaryPreferences.includes(diet.value);
                        return (
                          <button
                            key={diet.value}
                            type='button'
                            onClick={() => toggleMulti("dietaryPreferences", diet.value)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition",
                              active
                                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-200"
                            )}
                            aria-pressed={active}
                          >
                            {diet.label}
                          </button>
                        );
                      })}
                    </div>
                    {fieldError("dietaryPreferences") && (
                      <p className='text-xs text-rose-600'>{fieldError("dietaryPreferences")}</p>
                    )}
                  </div>
                  <div className='space-y-3' role='group' aria-label='Taste profile'>
                    <p className='text-sm font-semibold text-slate-900'>Taste profile</p>
                    <div className='flex flex-wrap gap-2'>
                      {TASTE_OPTIONS.map((taste) => {
                        const active = values.tastePreferences.includes(taste.value);
                        return (
                          <button
                            key={taste.value}
                            type='button'
                            onClick={() => toggleMulti("tastePreferences", taste.value)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-xs font-semibold transition",
                              active
                                ? "border-lime-400 bg-lime-50 text-emerald-800"
                                : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-200"
                            )}
                            aria-pressed={active}
                          >
                            {taste.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className='block space-y-2 text-sm font-medium text-slate-800'>
                    Lifestyle notes
                    <textarea
                      value={values.lifestyleNotes}
                      onChange={(event) => updateField("lifestyleNotes", event.target.value)}
                      placeholder='E.g., remote work lunches, training for a half marathon, etc.'
                      className='h-28 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
                      aria-invalid={Boolean(fieldError("lifestyleNotes"))}
                      aria-describedby={fieldError("lifestyleNotes") ? "onboarding-notes-error" : undefined}
                    />
                    {fieldError("lifestyleNotes") && (
                      <span id='onboarding-notes-error' className='text-xs text-rose-600'>
                        {fieldError("lifestyleNotes")}
                      </span>
                    )}
                  </label>
                </>
              )}
            </div>
          </div>

          <div className='flex flex-wrap gap-3'>
            {stepIndex > 0 && (
              <button
                type='button'
                onClick={() => {
                  setStepIndex((prev) => Math.max(0, prev - 1));
                  setResult(null);
                }}
                className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400'
              >
                <ArrowLeft className='h-4 w-4' />
                Back
              </button>
            )}

            {stepIndex < steps.length - 1 && (
              <button
                type='button'
                disabled={(stepIndex === 0 && !accountComplete) || (stepIndex === 1 && !goalsComplete)}
                onClick={() => {
                  setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                  setResult(null);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Next
                <ArrowRight className='h-4 w-4' />
              </button>
            )}

            {stepIndex === steps.length - 1 && (
              <button
                type='button'
                onClick={handleSubmit}
                disabled={isPending || !accountComplete || !goalsComplete}
                className='inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(16,185,129,0.32)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Saving
                  </>
                ) : (
                  <>
                    Save & personalize
                    <Sparkles className='h-4 w-4' />
                  </>
                )}
              </button>
            )}
          </div>

          {!showSuccess && result && !result.success && (
            <p className='text-sm text-rose-600' role='alert' aria-live='assertive'>
              {result.message}
            </p>
          )}
        </div>
        {showSuccess ? (
          <div
            className='rounded-3xl border border-emerald-100 bg-white p-6 text-sm text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.18)]'
            role='status'
            aria-live='polite'
          >
            <p className='flex items-center gap-2 text-emerald-700'>
              <CheckCircle2 className='h-4 w-4' />
              {result?.message}
            </p>
            <Link
              href={recommendationsHref}
              prefetch={false}
              className='mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 underline'
            >
              Head to menus
              <ArrowRight className='h-3.5 w-3.5' />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
