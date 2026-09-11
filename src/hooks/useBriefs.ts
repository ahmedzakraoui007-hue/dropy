import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UGCBrief, BriefStatus } from '@/types/ugc';

export function useBriefs(sellerId: string, statusFilter?: BriefStatus) {
  const [briefs, setBriefs] = useState<UGCBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();

    async function fetchBriefs() {
      try {
        setLoading(true);
        let query = supabase
          .from('ugc_briefs')
          .select('*, applications:ugc_applications(count)')
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const formattedData = data.map((brief: any) => ({
          ...brief,
          applications_count: brief.applications?.[0]?.count || 0,
        }));

        setBriefs(formattedData);
      } catch (err: any) {
        console.error('Error fetching briefs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBriefs();

    // Subscribe to changes
    const channel = supabase
      .channel('ugc_briefs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ugc_briefs',
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          fetchBriefs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, statusFilter]);

  return { briefs, loading, error };
}
