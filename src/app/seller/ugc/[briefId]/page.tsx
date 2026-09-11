// src/app/seller/ugc/[briefId]/page.tsx
'use client';

import React, { use, useEffect, useState } from 'react';
import { useBriefDetails } from '@/hooks/useBriefDetails';
import { useBriefActions } from '@/hooks/useBriefActions';
import { ApplicationCard } from '@/components/seller/ugc/ApplicationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Calendar, DollarSign, Video, 
  Image as ImageIcon, FileText, CheckCircle2, 
  Clock, AlertCircle, PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BriefDetailsPage({ params }: { params: Promise<{ briefId: string }> }) {
  const { briefId } = use(params);
  const { brief, applications, deliverables, loading, error } = useBriefDetails(briefId);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { acceptApplication, rejectApplication, loading: actionLoading } = useBriefActions(sellerId || '');

  const handleAccept = async (appId: string) => {
    try {
      await acceptApplication(appId, briefId, brief?.budget || 0);
      toast.success('Candidature acceptée ! Le brief est maintenant en cours.');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('Raison du refus :');
    if (reason) {
      try {
        await rejectApplication(appId, reason);
        toast.success('Candidature refusée.');
      } catch (err: any) {
        toast.error('Erreur: ' + err.message);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px] animate-pulse">Chargement...</div>;
  if (error || !brief) return <div className="text-red-500">Erreur lors du chargement du brief.</div>;

  const acceptedApp = applications.find(a => a.status === 'accepted');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/ugc">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{brief.title}</h1>
            <Badge className={
              brief.status === 'open' ? 'bg-green-500' : 
              brief.status === 'in_progress' ? 'bg-blue-500' : 
              brief.status === 'review' ? 'bg-yellow-500' : 'bg-gray-500'
            }>
              {brief.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Créé le {format(new Date(brief.created_at), 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
        {brief.status === 'in_progress' || brief.status === 'review' || brief.status === 'completed' ? (
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href={`/seller/ugc/${briefId}/deliverables`}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Voir les livrables ({deliverables.length})
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-600" />
                Détails du Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{brief.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-400" />
                    Format & Type
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>Type: <span className="font-medium">{brief.content_type}</span></li>
                    <li>Ratio: <span className="font-medium">{brief.aspect_ratio}</span></li>
                    {brief.duration_seconds && <li>Durée: <span className="font-medium">{brief.duration_seconds}s</span></li>}
                    <li>Livrables: <span className="font-medium">{brief.num_deliverables}</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Budget & Date
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>Budget: <span className="font-bold text-green-600">{brief.budget} TND</span></li>
                    <li>Deadline: <span className="font-medium">{format(new Date(brief.deadline), 'dd/MM/yyyy')}</span></li>
                  </ul>
                </div>
              </div>

              {brief.requirements && brief.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Points obligatoires
                    </h4>
                    <ul className="space-y-2">
                      {brief.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList>
              <TabsTrigger value="applications">
                Candidatures ({applications.length})
              </TabsTrigger>
              {brief.status !== 'draft' && (
                <TabsTrigger value="messages" disabled>
                  Messages
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="applications" className="mt-4 space-y-4">
              {brief.status === 'in_progress' && acceptedApp ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Brief en cours de réalisation</h3>
                    <p className="text-blue-700 text-sm max-w-md">
                      Le créateur {acceptedApp.creator?.display_name} travaille sur votre contenu. 
                      Vous serez notifié dès qu'un livrable sera soumis.
                    </p>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100" asChild>
                    <Link href={`/seller/ugc/${briefId}/deliverables`}>Suivre l'avancement</Link>
                  </Button>
                </div>
              ) : applications.filter(a => a.status === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune nouvelle candidature pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {applications
                    .filter(a => a.status === 'pending')
                    .map((app) => (
                      <ApplicationCard 
                        key={app.id} 
                        application={app} 
                        onAccept={() => handleAccept(app.id)}
                        onReject={() => handleReject(app.id)}
                        isAccepting={actionLoading}
                      />
                    ))
                  }
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-gray-500">Produit concerné</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {brief.product_images?.[0] ? (
                  <img src={brief.product_images[0]} alt={brief.product_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
              </div>
              <h3 className="font-bold text-center">{brief.product_name || 'Produit personnalisé'}</h3>
              {brief.product_id && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/seller/products/catalog/${brief.product_id}`}>Voir au catalogue</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-100">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-purple-600">Sécurité Dropy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-800 space-y-3">
              <p>Vos fonds sont protégés par notre système de séquestre.</p>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Paiement débloqué après validation
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Révisions illimitées possibles
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
