"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export function PageHero({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[var(--cockpit-hero,#0E0A24)] p-6 text-white md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,var(--cockpit-glow,rgba(139,92,246,0.5)),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
      <div className="relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-black tracking-tight md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-slate-300">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 text-lg font-black text-gray-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white transition-transform hover:-translate-y-0.5">
      {children}
    </Link>
  );
}

export function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
      {children}
    </Link>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900">
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      {label}
    </Link>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-gray-200" />)}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-black text-gray-900">{title}</h2>}
      {children}
    </section>
  );
}

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${active ? "bg-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>
      {children}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{children}</div>;
}

export function Steps({ labels, reached }: { labels: string[]; reached: number }) {
  return (
    <ol className="grid" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
      {labels.map((label, i) => {
        const done = i < reached;
        const current = i === reached - 1;
        return (
          <li key={label} className="relative flex min-w-0 flex-col items-center text-center">
            {i > 0 && <span className={`absolute top-4 h-0.5 w-full -translate-y-1/2 ltr:right-1/2 rtl:left-1/2 ${done ? "bg-primary" : "bg-gray-200"}`} />}
            <span className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${done ? "bg-primary text-white" : "bg-gray-100 text-gray-400"} ${current ? "ring-4 ring-primary/20" : ""}`}>
              {done ? "✓" : i + 1}
            </span>
            <span className={`mt-2 hidden px-0.5 text-xs font-bold leading-tight sm:block ${current ? "text-gray-900" : done ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
