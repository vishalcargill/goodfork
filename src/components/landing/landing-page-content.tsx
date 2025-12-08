"use client";

import { motion } from "framer-motion";
import { ArrowRight, Plant, ArrowsClockwise, Barcode, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";
import { LoginCard } from "@/components/auth/login-card";
import { HeroVisual } from "./hero-visual";
import { LandingMetricsStrip } from "./landing-metrics-strip";
import { Button } from "@/components/ui/button";

export function LandingPageContent() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 md:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1 text-sm font-medium text-emerald-800 backdrop-blur-sm">
                <Sparkle className="h-4 w-4" />
                <span>AI-Driven Menu Personalization</span>
              </div>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Real inventory. <br />
                Real goals. <br />
                <span className="text-emerald-600">Real menus.</span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600 sm:text-xl">
                GoodFork connects your kitchen&apos;s live inventory with nutrition goals to generate 3–5 personalized menu cards instantly—complete with healthy swaps.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
              <Link href="/onboarding" className="inline-flex">
                <Button variant="default" size="lg" className="shadow-lg shadow-emerald-600/20">
                  Start personalization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <SmoothScrollLink
                targetId="demo-anchor"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-medium text-slate-900 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                View menus demo
              </SmoothScrollLink>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 pt-4">
              {[
                { label: "Live Inventory", icon: Barcode },
                { label: "Goal Aligned", icon: Plant },
                { label: "Healthy Swaps", icon: ArrowsClockwise },
              ].map((feature) => (
                <div key={feature.label} className="flex flex-col gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100/50 text-emerald-700">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="demo-anchor" className="space-y-12 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">How GoodFork Works</h2>
          <p className="mt-4 text-lg text-slate-600">From pantry to plate in three simple steps.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Connect Inventory",
              desc: "We sync with your kitchen's live stock so you never see a recipe you can't cook.",
              icon: Barcode,
            },
            {
              title: "Set Your Goals",
              desc: "Tell us about your allergens, diet preferences, and fitness targets.",
              icon: Plant,
            },
            {
              title: "Get Ranked Menus",
              desc: "AI ranks the best 3-5 meals for you, offering healthy swaps to boost nutrition.",
              icon: Sparkle,
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-slate-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Metrics / Impact Section */}
      <section className="py-4">
        <LandingMetricsStrip />
      </section>

      {/* Login / Social Proof Section */}
      <section id="login" className="mx-auto max-w-4xl pt-8">
        <div className="grid gap-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col justify-center bg-slate-50 p-8 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Already onboarded?
            </p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              Welcome back to your personalized menu.
            </h2>
            <p className="mt-4 text-slate-600">
              Log in to see your latest recommendations based on real-time inventory and your health goals.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
              </div>
              <span>Join the hackathon track</span>
            </div>
          </div>
          <div className="flex items-center justify-center p-8 bg-white">
            <LoginCard />
          </div>
        </div>
      </section>

      {/* Footer Differentiators */}
      <div className="border-t border-slate-100 pt-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Built for Hackathon 2025 • AI Menu Personalization
        </p>
      </div>
    </div>
  );
}
