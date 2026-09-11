import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UGCBrief, UGCApplication, UGCDeliverable } from '@/types/ugc';

export function useBriefDetails(briefId: string) {
  const [brief, setBrief] = useState<UGCBrief | null>(null);
  const [applications, setApplications] = useState<UGCApplication[]>([]);
  const [deliverables, setDeliverables] = useState<UGCDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!briefId) return;
    const supabase = createClient();

    async function fetchDetails() {
      try {
        setLoading(true);

        // Fetch Brief with count
        const { data: briefData, error: briefError } = await supabase
          .from('ugc_briefs')
          .select('*, applications:ugc_applications(count)')
          .eq('id', briefId)
          .single();

        if (briefError) throw briefError;

        const formattedBrief = {
          ...briefData,
          applications_count: briefData.applications?.[0]?.count || 0,
        };
        setBrief(formattedBrief);

        // Fetch Applications with Creator Profiles
        const { data: appsData, error: appsError } = await supabase
          .from('ugc_applications')
          .select(`
            *,
            creator:creator_profiles(*)
          `)
          .eq('brief_id', briefId)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        setApplications(appsData || []);

        // Fetch Deliverables
        const { data: delivData, error: delivError } = await supabase
          .from('ugc_deliverables')
          .select('*')
          .eq('brief_id', briefId)
          .order('submitted_at', { ascending: false });

        if (delivError) throw delivError;
        setDeliverables(delivData || []);

      } catch (err: any) {
        console.error('Error fetching brief details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();

    // Subscribe to applications (real-time)
    const appsChannel = supabase
      .channel(`brief_apps_${briefId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ugc_applications',
          filter: `brief_id=eq.${briefId}`,
        },
        () => {
          fetchDetails();
        }
      )
      .subscribe();

    // Subscribe to deliverables
    const delivChannel = supabase
      .channel(`brief_deliv_${briefId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ugc_deliverables',
          filter: `brief_id=eq.${briefId}`,
        },
        () => {
          fetchDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appsChannel);
      supabase.removeChannel(delivChannel);
    };
  }, [briefId]);

  return { brief, applications, deliverables, loading, error };
}
