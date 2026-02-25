// src/components/store-builder/ColorPicker.tsx
'use client';

import { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export function ColorPicker({ label, value, onChange, presets }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const defaultPresets = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl hover:border-primary/50 transition-all shadow-sm">
            <div 
              className="w-10 h-10 rounded-lg border shadow-inner shrink-0"
              style={{ backgroundColor: value || '#ffffff' }}
            />
            <div className="flex-1 text-left">
              <span className="block font-mono text-sm font-bold uppercase tracking-wider text-gray-900">
                {value || '#FFFFFF'}
              </span>
            </div>
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-4 bg-white border-none shadow-2xl rounded-2xl" align="start">
          <div className="space-y-4">
            <HexColorPicker color={value || '#ffffff'} onChange={onChange} />
            
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
              <span className="text-sm font-bold text-gray-400">#</span>
              <HexColorInput
                color={value || '#ffffff'}
                onChange={onChange}
                className="flex-1 bg-transparent border-none focus:ring-0 font-mono font-bold uppercase text-gray-900"
              />
            </div>

            {/* Presets */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Couleurs rapides</p>
              <div className="grid grid-cols-5 gap-2">
                {(presets || defaultPresets).map(color => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      value === color ? "border-primary ring-2 ring-primary/20" : "border-white shadow-sm"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
