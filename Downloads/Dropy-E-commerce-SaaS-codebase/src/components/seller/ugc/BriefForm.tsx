// src/components/seller/ugc/BriefForm.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContentType, CreateBriefInput } from '@/types/ugc';
import { ChevronRight, ChevronLeft, Check, Package, Video, FileText, DollarSign, Calendar, ImagePlus, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { FileUpload } from '@/components/ui/file-upload';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BriefFormProps {
  onSubmit: (data: CreateBriefInput) => void;
  isLoading?: boolean;
  initialData?: Partial<CreateBriefInput>;
}

const STEPS = [
  { id: 'product', title: 'Produit', icon: Package },
  { id: 'specs', title: 'Spécifications', icon: Video },
  { id: 'content', title: 'Brief', icon: FileText },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'review', title: 'Récapitulatif', icon: Check },
];

export function BriefForm({ onSubmit, isLoading, initialData }: BriefFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateBriefInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    product_name: initialData?.product_name || '',
    product_images: initialData?.product_images || [],
    content_type: initialData?.content_type || 'video_ugc',
    duration_seconds: initialData?.duration_seconds || 30,
    aspect_ratio: initialData?.aspect_ratio || '9:16',
    num_deliverables: initialData?.num_deliverables || 1,
    requirements: initialData?.requirements || [],
    references_urls: initialData?.references_urls || [],
    budget: initialData?.budget || 50,
    deadline: initialData?.deadline || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    max_applications: initialData?.max_applications || 10,
  });

  const updateField = (key: keyof CreateBriefInput, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrl);
      }

      updateField('product_images', [...formData.product_images, ...uploadedUrls]);
      toast.success('Images ajoutées avec succès');
    } catch (err: any) {
      toast.error('Erreur lors de l\'upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    updateField('product_images', formData.product_images.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Nom du produit</Label>
              <Input 
                placeholder="Ex: Sérum Hydratant Bio" 
                value={formData.product_name || ''} 
                onChange={(e) => updateField('product_name', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label>Images du produit</Label>
              
              {formData.product_images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                  {formData.product_images.map((url, i) => (
                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <FileUpload 
                onFilesSelected={handleFileUpload}
                maxFiles={5}
                maxSize={10}
                acceptedTypes={['image/*']}
                className={uploading ? 'opacity-50 pointer-events-none' : ''}
              />
              {uploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload en cours...
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de contenu</Label>
                <Select 
                  value={formData.content_type} 
                  onValueChange={(v) => updateField('content_type', v as ContentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video_ugc">Vidéo UGC</SelectItem>
                    <SelectItem value="video_unboxing">Unboxing</SelectItem>
                    <SelectItem value="photo_lifestyle">Photo Lifestyle</SelectItem>
                    <SelectItem value="photo_product">Photo Produit</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="reel">Reel / TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format (Ratio)</Label>
                <Select 
                  value={formData.aspect_ratio || '9:16'} 
                  onValueChange={(v) => updateField('aspect_ratio', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                    <SelectItem value="1:1">1:1 (Carré)</SelectItem>
                    <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée (secondes)</Label>
                <Input 
                  type="number" 
                  value={formData.duration_seconds || 0} 
                  onChange={(e) => updateField('duration_seconds', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre de livrables</Label>
                <Input 
                  type="number" 
                  value={formData.num_deliverables} 
                  onChange={(e) => updateField('num_deliverables', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre de la mission</Label>
              <Input 
                placeholder="Ex: Vidéo démonstration pour notre nouveau sérum" 
                value={formData.title} 
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description détaillée</Label>
              <Textarea 
                placeholder="Décrivez ce que vous attendez du créateur..." 
                className="min-h-[120px]"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Points obligatoires (un par ligne)</Label>
              <Textarea 
                placeholder="Ex: Montrer le packaging&#10;Appliquer sur le visage&#10;Mentionner la livraison gratuite"
                onChange={(e) => updateField('requirements', e.target.value.split('\n').filter(l => l.trim()))}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Budget (TND)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="number" 
                  className="pl-10" 
                  value={formData.budget} 
                  onChange={(e) => updateField('budget', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date limite de livraison</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="date" 
                  className="pl-10" 
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre max de candidatures</Label>
              <Input 
                type="number" 
                value={formData.max_applications}
                onChange={(e) => updateField('max_applications', parseInt(e.target.value))}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg border-b pb-2">{formData.title || 'Sans titre'}</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-gray-500">Produit:</span>
              <span className="font-medium">{formData.product_name || 'N/A'}</span>
              <span className="text-gray-500">Type:</span>
              <span className="font-medium">{formData.content_type}</span>
              <span className="text-gray-500">Budget:</span>
              <span className="font-medium text-green-600 font-bold">{formData.budget} TND</span>
              <span className="text-gray-500">Deadline:</span>
              <span className="font-medium">{formData.deadline}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-400">
                En publiant ce brief, il sera visible par tous les créateurs UGC de la plateforme. 
                Les fonds seront bloqués en séquestre dès l'acceptation d'un créateur.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-none lg:border lg:shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1 relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10
                  ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                `}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${index < currentStep ? 'bg-green-500' : 'bg-gray-100'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
              onClick={() => onSubmit(formData)}
              disabled={isLoading || !formData.title}
            >
              {isLoading ? 'Publication...' : 'Publier le Brief'}
            </Button>
          ) : (
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={nextStep}
            >
              Continuer
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
