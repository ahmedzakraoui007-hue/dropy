// src/hooks/useBriefActions.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CreateBriefInput, UGCBrief } from '@/types/ugc';

export function useBriefActions(sellerId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBrief = async (data: CreateBriefInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data: brief, error: createError } = await supabase
        .from('ugc_briefs')
        .insert([{ ...data, seller_id: sellerId }])
        .select()
        .single();

      if (createError) throw createError;
      return brief;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBrief = async (briefId: string, data: Partial<UGCBrief>) => {
    try {
      setLoading(true);
      setError(null);
      const { data: brief, error: updateError } = await supabase
        .from('ugc_briefs')
        .update(data)
        .eq('id', briefId)
        .select()
        .single();

      if (updateError) throw updateError;
      return brief;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const publishBrief = async (briefId: string) => {
    return updateBrief(briefId, { status: 'open', published_at: new Date().toISOString() });
  };

  const closeBrief = async (briefId: string) => {
    return updateBrief(briefId, { status: 'cancelled' });
  };

  const acceptApplication = async (applicationId: string, briefId: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ugc/briefs/${briefId}/accept-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, amount }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to accept application');

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectApplication = async (applicationId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: rejectError } = await supabase
        .from('ugc_applications')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', applicationId);

      if (rejectError) throw rejectError;
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveDeliverable = async (deliverableId: string, briefId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: approveError } = await supabase
        .from('ugc_deliverables')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', deliverableId);

      if (approveError) throw approveError;

      // Check if all deliverables are approved to complete the brief
      await supabase
        .from('ugc_briefs')
        .update({ status: 'review' }) // Change to review or keep in_progress until explicit release
        .eq('id', briefId);

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestRevision = async (deliverableId: string, notes: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: revisionError } = await supabase
        .from('ugc_deliverables')
        .update({ 
          status: 'revision_requested', 
          revision_notes: notes,
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', deliverableId);

      if (revisionError) throw revisionError;
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async (briefId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ugc/briefs/${briefId}/release-payment`, {
        method: 'POST',
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to release payment');

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createBrief,
    updateBrief,
    publishBrief,
    closeBrief,
    acceptApplication,
    rejectApplication,
    approveDeliverable,
    requestRevision,
    releasePayment
  };
}
