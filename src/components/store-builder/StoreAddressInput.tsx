"use client";

import { slugify } from "@/lib/store-slug";
import { storeAddressAffixes } from "@/lib/store-url";

export function StoreAddressInput({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const { prefix, suffix } = storeAddressAffixes();
  const affix = "px-3 text-sm text-gray-500 bg-gray-50 h-10 flex items-center shrink-0";
  return (
    <div dir="ltr" className="flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
      {prefix && <span className={`${affix} border-r`}>{prefix}</span>}
      <input
        className="flex-1 h-10 px-3 text-sm outline-none min-w-0"
        value={value}
        maxLength={40}
        onChange={(e) => onChange(slugify(e.target.value))}
      />
      {suffix && <span className={`${affix} border-l`}>{suffix}</span>}
    </div>
  );
}
