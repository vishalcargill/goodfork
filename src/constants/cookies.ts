export const ONBOARDING_PROFILE_COOKIE = "gf_onboarding_profile";
export const SESSION_COOKIE_NAME = "gf_session";

export type OnboardingCookiePayload = {
  id: string;
  name: string;
  email: string;
};

export function serializeOnboardingCookie(payload: OnboardingCookiePayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function parseOnboardingCookie(value?: string | null): OnboardingCookiePayload | null {
  if (!value) {
    return null;
  }

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<OnboardingCookiePayload>;

    if (!parsed.id || !parsed.name || !parsed.email) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}
