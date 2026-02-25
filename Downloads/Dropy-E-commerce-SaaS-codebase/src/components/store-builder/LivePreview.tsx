// src/components/store-builder/LivePreview.tsx
'use client';

import { cleanStoreSlug } from '@/lib/utils';
import { generateCSSVariables } from '@/lib/style-utils';
import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  storeSlug: string;
  pageSlug: string;
  data: any; // The current page/config data to sync
  activeSectionId?: string | null;
}

export function LivePreview({ storeSlug, pageSlug, data, activeSectionId }: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // Sync data with iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // 1. Send Data Update
      iframeRef.current.contentWindow.postMessage({
        type: 'STORE_UPDATE',
        ...data
      }, '*');

      // 2. Inject CSS Variables Directly (Faster feedback)
      // This is a backup if the iframe doesn't handle the message yet, 
      // but ideally we want the iframe to handle it. 
      // For now, let's inject it directly into the iframe's head if same-origin (dev mode)
      // OR send it via message if cross-origin.
      // Since we are likely in same-domain or handling via preview page logic:

      const cssVars = generateCSSVariables(data.config);
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_CSS_VARIABLES',
        payload: cssVars
      }, '*');
    }
  }, [data]);

  // Handle Scroll to Section
  useEffect(() => {
    if (activeSectionId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SCROLL_TO_SECTION',
        sectionId: activeSectionId
      }, '*');
    }
  }, [activeSectionId]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const sizes = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]'
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 shadow-inner">
      {/* Browser Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 flex items-center gap-2 min-w-[300px]">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">https://</span>
            <span className="text-xs font-medium text-gray-600 truncate">{cleanStoreSlug(storeSlug)}.dropy.store/{pageSlug}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button
            variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'desktop' && "shadow-sm border-gray-200")}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'tablet' && "shadow-sm border-gray-200")}
            onClick={() => setViewMode('tablet')}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'mobile' && "shadow-sm border-gray-200")}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handleRefresh}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" asChild>
            <a href={`/shop/${storeSlug}/${pageSlug}`} target="_blank">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start scrollbar-hide">
        <div className={cn(
          "bg-white shadow-2xl transition-all duration-500 rounded-lg overflow-hidden h-full relative",
          sizes[viewMode]
        )}>
          <iframe
            ref={iframeRef}
            src={`/preview/${storeSlug}/${pageSlug}`}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
          />
          {loading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary/20" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
