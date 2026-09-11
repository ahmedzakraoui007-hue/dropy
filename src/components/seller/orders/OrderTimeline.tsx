import { OrderTimelineEntry } from '@/types/orders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusLabel } from '@/hooks/useOrderRealtime';
import { Badge } from '@/components/ui/badge';

interface OrderTimelineProps {
  timeline: OrderTimelineEntry[];
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucun historique disponible</p>;
  }

  // Trier par date décroissante
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-muted">
      {sortedTimeline.map((entry) => (
        <div key={entry.id} className="relative pl-8">
          <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-background bg-primary" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {entry.action === 'status_change' ? 'Changement de statut' : entry.action}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
              </span>
            </div>
            
            <div className="mt-1 flex items-center gap-2">
              {entry.old_status && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 opacity-50 line-through">
                  {getStatusLabel(entry.old_status)}
                </Badge>
              )}
              {entry.old_status && <span className="text-[10px]">→</span>}
              {entry.new_status && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/20">
                  {getStatusLabel(entry.new_status)}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 ml-auto">
                {entry.actor_type === 'seller' ? 'Vendeur' : 
                 entry.actor_type === 'supplier' ? 'Fournisseur' : 
                 entry.actor_type === 'system' ? 'Système' : 'Client'}
              </Badge>
            </div>

            {entry.note && (
              <p className="mt-1.5 text-xs text-muted-foreground bg-muted/50 p-2 rounded italic">
                "{entry.note}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
