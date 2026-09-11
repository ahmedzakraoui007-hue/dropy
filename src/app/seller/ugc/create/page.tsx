// src/app/seller/ugc/create/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBriefActions } from '@/hooks/useBriefActions';
import { BriefForm } from '@/components/seller/ugc/BriefForm';
import { CreateBriefInput } from '@/types/ugc';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreateBriefPage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { createBrief, loading } = useBriefActions(sellerId || '');

  const handleSubmit = async (data: CreateBriefInput) => {
    try {
      await createBrief(data);
      toast.success('Votre brief a été créé avec succès !');
      router.push('/seller/ugc');
    } catch (err: any) {
      toast.error('Erreur lors de la création du brief: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/ugc">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créer un nouveau brief</h1>
          <p className="text-muted-foreground text-sm">Définissez vos besoins pour attirer les meilleurs créateurs.</p>
        </div>
      </div>

      <BriefForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  );
}
