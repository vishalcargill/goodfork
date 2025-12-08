"use client";

import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ChefHat, Recycle, Timer, ForkKnife } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const metrics = [
  {
    id: "inventory",
    label: "Inventory Accuracy",
    value: 98,
    suffix: "%",
    description: "Menus only show what you can actually cook.",
    icon: ChefHat,
  },
  {
    id: "speed",
    label: "Avg. Response",
    value: 2.5,
    suffix: "s",
    description: "Personalized menus generated instantly.",
    icon: Timer,
  },
  {
    id: "waste",
    label: "Waste Reduction",
    value: 30,
    suffix: "%",
    description: "By prioritizing expiring ingredients.",
    icon: Recycle,
  },
  {
    id: "swaps",
    label: "Healthy Swaps",
    value: 100,
    suffix: "%",
    description: "Every recommendation has a healthier alternative.",
    icon: ForkKnife,
  },
];

function Counter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalDuration = duration * 1000;
      const incrementTime = totalDuration / end;

      const timer = setInterval(() => {
        start += 1;
        setCount((prev) => {
          if (prev < end) return prev + (end > 10 ? Math.ceil(end / 50) : 1);
          return end;
        });
        if (start >= end) clearInterval(timer);
      }, incrementTime);

      // Fallback to ensure we hit exact number
      setTimeout(() => setCount(end), totalDuration);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{Math.min(count, value)}</span>;
}

export function LandingMetricsStrip() {
  return (
    <div className="w-full rounded-3xl border border-emerald-900/20 bg-emerald-900 py-12 text-white shadow-2xl shadow-emerald-900/20 lg:px-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative flex flex-col items-center text-center sm:items-start sm:text-left"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800/50 text-emerald-400 transition-colors group-hover:bg-emerald-400 group-hover:text-emerald-900">
              <metric.icon className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <Counter value={metric.value} />
                {metric.suffix}
              </span>
              {metric.id === "speed" && (
                <span className="text-sm font-medium text-emerald-400">&lt;</span>
              )}
            </div>
            <p className="mt-1 text-lg font-semibold text-emerald-100">{metric.label}</p>
            <p className="mt-2 text-sm text-emerald-300/80">{metric.description}</p>
            
            {/* Decorative hover glow */}
            <div className="absolute -inset-4 -z-10 scale-90 rounded-xl bg-emerald-400/0 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:bg-emerald-400/5 group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="mt-12 flex justify-center border-t border-emerald-800/50 pt-8 text-center"
      >
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-500/60">
          <ArrowUpRight className="h-3 w-3" />
          Live demo stats • Hackathon 2025
        </p>
      </motion.div>
    </div>
  );
}
