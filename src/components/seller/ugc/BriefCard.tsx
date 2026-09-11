// src/components/seller/ugc/BriefCard.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UGCBrief } from '@/types/ugc';
import { Calendar, Video, Image as ImageIcon, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BriefCardProps {
  brief: UGCBrief;
}

export function BriefCard({ brief }: BriefCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'completed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentTypeIcon = (type: string) => {
    if (type.includes('video')) return <Video className="w-4 h-4" />;
    return <ImageIcon className="w-4 h-4" />;
  };

  const isDeadlineClose = () => {
    const deadlineDate = new Date(brief.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-40 bg-gray-100">
          {brief.product_images?.[0] ? (
            <img 
              src={brief.product_images[0]} 
              alt={brief.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${getStatusColor(brief.status)}`}>
            {brief.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-bold line-clamp-1">{brief.title}</CardTitle>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {getContentTypeIcon(brief.content_type)}
            <span>{brief.content_type.replace('_', ' ')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">{brief.budget} TND</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{brief.applications_count || 0} candidatures</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isDeadlineClose() ? 'text-red-500 font-bold' : ''}`}>
            <Calendar className="w-4 h-4" />
            <span>Échéance: {format(new Date(brief.deadline), 'dd MMMM yyyy', { locale: fr })}</span>
            {isDeadlineClose() && <Clock className="w-4 h-4 animate-pulse" />}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 border-t">
        <Button asChild className="w-full">
          <Link href={`/seller/ugc/${brief.id}`}>Voir les détails</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
