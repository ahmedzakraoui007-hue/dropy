// src/components/seller/ugc/ApplicationCard.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UGCApplication } from '@/types/ugc';
import { Star, Check, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ApplicationCardProps {
  application: UGCApplication;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export function ApplicationCard({ 
  application, 
  onAccept, 
  onReject,
  isAccepting,
  isRejecting
}: ApplicationCardProps) {
  const creator = application.creator;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={creator?.avatar_url || ''} alt={creator?.display_name} />
          <AvatarFallback>{creator?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{creator?.display_name}</h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {creator?.rating || 5.0}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {creator?.completed_briefs || 0} missions terminées
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-purple-600">{application.proposed_price} TND</p>
          <p className="text-xs text-gray-400">
            Livraison est. {application.estimated_delivery ? format(new Date(application.estimated_delivery), 'dd/MM/yy') : 'N/A'}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-1">Pitch</h4>
          <p className="text-sm text-gray-600 line-clamp-3 italic">
            "{application.pitch}"
          </p>
        </div>

        {application.portfolio_urls && application.portfolio_urls.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Portfolio Preview</h4>
            <div className="grid grid-cols-4 gap-2">
              {application.portfolio_urls.slice(0, 4).map((url, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden relative group">
                  <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 flex gap-2 border-t bg-gray-50/50">
        <Button 
          variant="outline" 
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onReject(application.id)}
          disabled={isAccepting || isRejecting}
        >
          <X className="w-4 h-4 mr-2" />
          Refuser
        </Button>
        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => onAccept(application.id)}
          disabled={isAccepting || isRejecting}
        >
          <Check className="w-4 h-4 mr-2" />
          Accepter
        </Button>
      </CardFooter>
    </Card>
  );
}
