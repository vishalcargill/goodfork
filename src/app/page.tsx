import Link from "next/link";

const phasePillars = [
  {
    title: "Stay aligned to your goals",
    body: "We remember your health focus, allergens, and tastes so every visit feels curated.",
  },
  {
    title: "Only dishes that are ready",
    body: "Menus highlight meals that are available now, so you never fall for an out-of-stock craving.",
  },
  {
    title: "Healthy swaps built-in",
    body: "Each card offers a swap with a quick reason so choices feel confident and personal.",
  },
];

const sampleMenus = [
  {
    title: "Citrus Ginger Salmon Bowl",
    price: "$14",
    calories: "540 kcal",
    macros: "38g protein · 42g carbs · 21g fat",
    rationale:
      "Omega-3 rich protein, slow carbs, and leafy greens aligned to your pescatarian goal.",
    swap: "Quinoa ↔️ cauli-rice to drop ~70 kcal.",
  },
  {
    title: "Harissa Chickpea Grain Salad",
    price: "$11",
    calories: "480 kcal",
    macros: "22g protein · 54g carbs · 18g fat",
    rationale:
      "Allergen-safe, fiber-forward, and uses in-stock herbs for freshness and satiety.",
    swap: "Feta ↔️ toasted pepitas for dairy-free crunch.",
  },
  {
    title: "Zesty Chicken Power Wrap",
    price: "$12",
    calories: "510 kcal",
    macros: "40g protein · 46g carbs · 17g fat",
    rationale:
      "High protein density within your budget band, paired with a tangy slaw for micronutrients.",
    swap: "Flour wrap ↔️ lettuce cups to reduce refined carbs.",
  },
];

const loginBenefits = [
  "Save your goals and allergens once—every session stays in sync.",
  "Pick up where you left off with recently viewed menus.",
  "Secure by default with magic link or password options.",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-lime-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-10 top-[-10%] h-72 w-72 rounded-full bg-lime-200/40 blur-[90px]" />
        <div className="absolute right-[-5%] top-20 h-80 w-80 rounded-full bg-emerald-200/35 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-1/3 h-96 w-96 rounded-full bg-amber-100/30 blur-[140px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <section
          id="product"
          className="relative overflow-hidden rounded-[28px] border border-emerald-100/70 bg-white/90 px-6 py-10 shadow-[0_24px_70px_rgba(16,185,129,0.15)] sm:px-10"
        >
          <div className="absolute inset-0 bg-emerald-50/60" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                Just for you
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Personalized menus with nutrition at the center.
              </h1>
              <p className="max-w-2xl text-lg text-slate-600">
                Capture what matters—goals, allergens, and budget—and let GoodFork surface 3–5 beautiful, inventory-aware options with clear rationales and healthy swaps.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/onboarding"
                  className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5"
                >
                  Start onboarding
                </Link>
                <Link
                  href="#recommendations"
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:shadow-[0_12px_30px_rgba(16,185,129,0.2)]"
                >
                  View sample menus
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-md">
              <div className="absolute -left-6 -top-6 h-16 w-16 animate-pulse rounded-full bg-emerald-100 blur-2xl" />
              <div className="absolute right-0 bottom-6 h-14 w-14 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-amber-100 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_18px_45px_rgba(16,185,129,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Why it works
                </p>
                <div className="mt-4 grid gap-3">
                  {phasePillars.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="rounded-2xl border border-emerald-50 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(16,185,129,0.15)]"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {pillar.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{pillar.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="recommendations"
          className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-[0_22px_60px_rgba(16,185,129,0.12)]"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Preview
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Personalized menu cards with healthy swaps
              </h2>
              <p className="text-sm text-slate-600">
                3–5 cards per request, grounded in inventory and your stated goals.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Sample data — UI focus
            </span>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {sampleMenus.map((menu) => (
              <article
                key={menu.title}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_14px_36px_rgba(16,185,129,0.18)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_20px_56px_rgba(16,185,129,0.25)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {menu.title}
                    </h3>
                    <p className="text-sm text-emerald-700">{menu.price}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Ready now
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>{menu.calories}</p>
                  <p className="text-xs text-slate-500">{menu.macros}</p>
                  <p className="text-sm text-slate-700">{menu.rationale}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold text-emerald-800">Healthy swap</p>
                  <p>{menu.swap}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="login"
          className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-[0_22px_60px_rgba(16,185,129,0.12)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Login
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Sign in to keep your nutrition journey synced
              </h2>
              <p className="text-sm text-slate-600">
                Secure login to save your profile, pick up your personalized menus, and keep swaps and saves consistent across devices.
              </p>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                {loginBenefits.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 shadow-sm"
                  >
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute right-6 top-4 h-20 w-20 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-lime-100 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_18px_45px_rgba(16,185,129,0.16)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Welcome back</p>
                    <p className="text-xs text-slate-600">Log in to personalize</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Secure
                  </span>
                </div>
                <form className="space-y-4">
                  <label className="block space-y-2 text-sm font-medium text-slate-800">
                    Email
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                      required
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium text-slate-800">
                    Password
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                      required
                    />
                  </label>
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-emerald-200 text-emerald-600 focus:ring-0"
                      />
                      Remember me
                    </label>
                    <a href="#" className="font-semibold text-emerald-700">
                      Forgot password?
                    </a>
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5"
                  >
                    Continue
                  </button>
                  <div className="text-center text-xs text-slate-600">
                    Or continue with
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                    >
                      Magic link
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
                    >
                      Continue with Google
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
