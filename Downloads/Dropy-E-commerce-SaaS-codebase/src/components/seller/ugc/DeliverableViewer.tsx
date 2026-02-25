// src/components/seller/ugc/DeliverableViewer.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UGCDeliverable } from '@/types/ugc';
import { Check, RotateCcw, X, Download, Play, FileText } from 'lucide-react';

interface DeliverableViewerProps {
  deliverable: UGCDeliverable;
  onApprove: (id: string) => void;
  onRequestRevision: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function DeliverableViewer({
  deliverable,
  onApprove,
  onRequestRevision,
  onReject,
  isLoading
}: DeliverableViewerProps) {
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'approved': return <Badge className="bg-green-500">Approuvé</Badge>;
      case 'revision_requested': return <Badge className="bg-blue-500">Révision demandée</Badge>;
      case 'rejected': return <Badge className="bg-red-500">Refusé</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{deliverable.title || 'Livrable sans titre'}</CardTitle>
          <p className="text-sm text-gray-500">Version {deliverable.version}</p>
        </div>
        {getStatusBadge(deliverable.status)}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
          {deliverable.file_type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center relative">
              <video 
                src={deliverable.file_url} 
                className="w-full h-full object-contain"
                controls
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none">
                <Play className="w-12 h-12 text-white opacity-50 group-hover:opacity-0 transition-opacity" />
              </div>
            </div>
          ) : (
            <img 
              src={deliverable.file_url} 
              alt={deliverable.title || 'Deliverable'} 
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Taille: {deliverable.file_size_mb} MB</span>
          <Button variant="ghost" size="sm" asChild>
            <a href={deliverable.file_url} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>

        {deliverable.description && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Description</h4>
            <p className="text-sm text-gray-700">{deliverable.description}</p>
          </div>
        )}

        {deliverable.revision_notes && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <h4 className="text-xs font-bold uppercase text-blue-400 mb-1">Notes de révision</h4>
            <p className="text-sm text-blue-700">{deliverable.revision_notes}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t p-4 bg-gray-50/30">
        {!showRevisionForm ? (
          <div className="flex w-full gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRevisionForm(true)}
              disabled={isLoading || deliverable.status === 'approved'}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Révision
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onApprove(deliverable.id)}
              disabled={isLoading || deliverable.status === 'approved'}
            >
              <Check className="w-4 h-4 mr-2" />
              Approuver
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <Textarea 
              placeholder="Expliquez les modifications nécessaires..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={() => setShowRevisionForm(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  onRequestRevision(deliverable.id, revisionNotes);
                  setShowRevisionForm(false);
                }}
                disabled={!revisionNotes.trim() || isLoading}
              >
                Envoyer la demande
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
