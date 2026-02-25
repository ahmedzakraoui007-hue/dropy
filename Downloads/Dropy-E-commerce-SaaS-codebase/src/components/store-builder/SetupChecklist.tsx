// src/components/store-builder/SetupChecklist.tsx
import { StoreBuilderChecklist } from '@/types/store-builder';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SetupChecklist({ checklist }: { checklist: StoreBuilderChecklist }) {
  const steps = [
    {
      id: 'design',
      label: 'Design & Branding',
      description: 'Logo, couleurs et bannière',
      completed: checklist.design.completed,
      href: '/seller/store-builder/design',
      details: [
        { label: 'Logo', done: checklist.design.details.hasLogo },
        { label: 'Couleurs', done: checklist.design.details.hasColors },
        { label: 'Bannière hero', done: checklist.design.details.hasHero },
      ]
    },
    {
      id: 'pages',
      label: 'Pages',
      description: `${checklist.pages.count} page(s) créée(s)`,
      completed: checklist.pages.completed,
      href: '/seller/store-builder/pages',
      warning: !checklist.pages.hasHomepage ? 'Aucune page d\'accueil définie' : null
    },
    {
      id: 'navigation',
      label: 'Navigation',
      description: `${checklist.navigation.headerCount} liens header, ${checklist.navigation.footerCount} liens footer`,
      completed: checklist.navigation.completed,
      href: '/seller/store-builder/navigation'
    },
    {
      id: 'domain',
      label: 'Domaine',
      description: checklist.domain.domain || 'Aucun domaine configuré',
      completed: checklist.domain.completed,
      href: '/seller/store-builder/domain',
      badge: checklist.domain.isVerified ? 'Vérifié' : checklist.domain.domain ? 'En attente' : null
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Configuration boutique</h3>
        <span className="text-sm text-muted-foreground">{checklist.overall}% complété</span>
      </div>
      
      <Progress value={checklist.overall} className="h-2 mb-4" />

      {steps.map((step) => (
        <Link
          key={step.id}
          href={step.href}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            step.completed 
              ? "bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900/30" 
              : "bg-muted/30 hover:bg-muted/50 border-transparent"
          )}
        >
          {step.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{step.label}</span>
              {step.badge && (
                <Badge variant={step.completed ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                  {step.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{step.description}</p>
            {step.warning && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {step.warning}
              </p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
