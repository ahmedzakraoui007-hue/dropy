// src/app/seller/ugc/[briefId]/deliverables/page.tsx
'use client';

import React, { use, useEffect, useState } from 'react';
import { useBriefDetails } from '@/hooks/useBriefDetails';
import { useBriefActions } from '@/hooks/useBriefActions';
import { DeliverableViewer } from '@/components/seller/ugc/DeliverableViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function DeliverablesPage({ params }: { params: Promise<{ briefId: string }> }) {
  const { briefId } = use(params);
  const { brief, deliverables, loading, error } = useBriefDetails(briefId);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { 
    approveDeliverable, 
    requestRevision, 
    releasePayment,
    loading: actionLoading 
  } = useBriefActions(sellerId || '');

  const handleApprove = async (id: string) => {
    try {
      await approveDeliverable(id, briefId);
      toast.success('Livrable approuvé !');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleRevision = async (id: string, notes: string) => {
    try {
      await requestRevision(id, notes);
      toast.success('Demande de révision envoyée.');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleReleasePayment = async () => {
    if (confirm('Voulez-vous débloquer le paiement pour ce brief ? Cette action est irréversible.')) {
      try {
        await releasePayment(briefId);
        toast.success('Paiement débloqué !');
      } catch (err: any) {
        toast.error('Erreur: ' + err.message);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Chargement...</div>;
  if (error || !brief) return <div className="text-red-500">Erreur lors du chargement des livrables.</div>;

  const allApproved = deliverables.length > 0 && deliverables.every(d => d.status === 'approved');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/seller/ugc/${briefId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Livrables : {brief.title}</h1>
          <p className="text-muted-foreground text-sm">Consultez et validez les contenus produits par le créateur.</p>
        </div>
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Aucun livrable soumis</h3>
          <p className="text-gray-500">Le créateur n'a pas encore téléchargé de contenu pour cette mission.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliverables.map((deliverable) => (
            <DeliverableViewer 
              key={deliverable.id}
              deliverable={deliverable}
              onApprove={handleApprove}
              onRequestRevision={handleRevision}
              onReject={() => {}} // Non implémenté par défaut
              isLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {allApproved && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Tous les livrables sont validés !</h3>
              <p className="text-green-700 text-sm">
                Vous pouvez maintenant débloquer le paiement pour le créateur.
              </p>
            </div>
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
            onClick={handleReleasePayment}
            disabled={actionLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Libérer le paiement
          </Button>
        </div>
      )}
    </div>
  );
}
