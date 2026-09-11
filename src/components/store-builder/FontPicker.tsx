// src/components/store-builder/FontPicker.tsx
'use client';

import { AVAILABLE_FONTS } from '@/data/themes';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  type: 'heading' | 'body';
}

export function FontPicker({ label, value, onChange, type }: FontPickerProps) {
  const fonts = type === 'heading' ? AVAILABLE_FONTS.headings : AVAILABLE_FONTS.body;

  const categories = Array.from(new Set(fonts.map(f => f.category)));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-12 rounded-xl bg-white shadow-sm border-gray-200">
          <SelectValue placeholder="Choisir une police" />
        </SelectTrigger>
        <SelectContent className="max-h-80 bg-white">
          {categories.map(category => (
            <SelectGroup key={category}>
              <SelectLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1">
                {category}
              </SelectLabel>
              {fonts.filter(f => f.category === category).map(font => (
                <SelectItem 
                  key={font.name} 
                  value={font.name}
                  className="rounded-lg my-1"
                >
                  <span style={{ fontFamily: font.name }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
