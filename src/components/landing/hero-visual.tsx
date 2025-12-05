"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-[500px] mx-auto aspect-square lg:aspect-[4/3]">
      {/* Abstract Background Shapes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-50/50 rounded-full blur-3xl -z-10" />
      
      {/* Main Card - Simulated Recommendation */}
      <motion.div
        initial={{ y: 20, rotate: -2 }}
        animate={{ y: [0, -10, 0], rotate: -2 }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 0 }
        }}
        className="absolute left-4 right-4 top-8 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:left-8 sm:right-8 sm:p-5"
      >
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-emerald-100 sm:h-20 sm:w-20">
             <Image 
               src="/images/recipes/citrus-salmon.jpg" 
               alt="Citrus Salmon" 
               width={80} 
               height={80} 
               className="h-full w-full object-cover"
             />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Citrus Herb Salmon</h3>
                <p className="text-xs text-emerald-600 font-medium">96% Match • High Protein</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                COOKABLE
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              Perfect for your muscle gain goal. We swapped butter for olive oil to reduce sat fat.
            </p>
          </div>
        </div>
        
        {/* Simulated Macros */}
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          {["450 kcal", "42g Protein", "12g Fat"].map((macro) => (
            <span key={macro} className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
              {macro}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Floating Elements - Healthy Swap */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute -right-4 top-1/3 z-20 w-48 rounded-xl border border-emerald-100 bg-white p-3 shadow-lg shadow-emerald-900/5 sm:-right-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Leaf className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-700">Healthy Swap</p>
            <p className="text-[10px] text-emerald-600">Butter → Olive Oil</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Elements - Pantry Match */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -left-4 bottom-1/4 z-20 w-52 rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/5 sm:-left-8"
      >
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-700">Pantry Match</span>
            <span className="text-emerald-600">7/7 items</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full bg-emerald-500" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

