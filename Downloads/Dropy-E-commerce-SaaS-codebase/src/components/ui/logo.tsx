import React from "react";

// Logo component for Dropy
export function Logo({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-[#2E3192] to-[#00A99D] rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
        <span className="text-white font-black text-2xl tracking-tighter">D</span>
      </div>
      <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-[#2E3192] transition-colors">
        DROPY
      </span>
    </div>
  );
}
