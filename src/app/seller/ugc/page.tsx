// src/app/seller/ugc/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBriefs } from '@/hooks/useBriefs';
import { BriefCard } from '@/components/seller/ugc/BriefCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List as ListIcon, Filter } from 'lucide-react';
import Link from 'next/link';
import { BriefStatus } from '@/types/ugc';

export default function UGCBriefsPage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { briefs, loading, error } = useBriefs(
    sellerId || '', 
    activeTab === 'all' ? undefined : activeTab as BriefStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Missions UGC</h1>
          <p className="text-muted-foreground">Gérez vos briefs et collaborez avec des créateurs de contenu.</p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
          <Link href="/seller/ugc/create">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Brief
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="draft">Brouillons</TabsTrigger>
            <TabsTrigger value="open">Ouverts</TabsTrigger>
            <TabsTrigger value="in_progress">En cours</TabsTrigger>
            <TabsTrigger value="review">En révision</TabsTrigger>
            <TabsTrigger value="completed">Terminés</TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-2 border rounded-md p-1 bg-white">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-gray-100">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100 text-red-600">
              Une erreur est survenue lors du chargement des briefs.
            </div>
          ) : briefs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Aucun brief trouvé</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">
                Commencez par créer votre première mission pour attirer des créateurs.
              </p>
              <Button asChild variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                <Link href="/seller/ugc/create">Créer un brief</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {briefs.map((brief) => (
                <BriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
