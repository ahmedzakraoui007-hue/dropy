// src/types/ugc.ts

export type ContentType = 'video_ugc' | 'video_unboxing' | 'photo_lifestyle' | 'photo_product' | 'story' | 'reel';
export type BriefStatus = 'draft' | 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type DeliverableStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected';

export interface UGCBrief {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  product_id: string | null;
  product_name: string | null;
  product_images: string[];
  content_type: ContentType;
  duration_seconds: number | null;
  aspect_ratio: string | null;
  num_deliverables: number;
  requirements: string[];
  references_urls: string[];
  budget: number;
  deadline: string;
  status: BriefStatus;
  max_applications: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optional)
  applications_count?: number;
  accepted_application?: UGCApplication;
  applications?: UGCApplication[];
  deliverables?: UGCDeliverable[];
}

export interface UGCApplication {
  id: string;
  brief_id: string;
  creator_id: string;
  pitch: string;
  portfolio_urls: string[];
  proposed_price: number | null;
  estimated_delivery: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  creator?: CreatorProfile;
  brief?: UGCBrief;
}

export interface UGCDeliverable {
  id: string;
  brief_id: string;
  creator_id: string;
  application_id: string;
  file_url: string;
  file_type: 'video' | 'image';
  file_size_mb: number;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  version: number;
  status: DeliverableStatus;
  seller_feedback: string | null;
  revision_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: ContentType[];
  portfolio_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  rating: number;
  completed_briefs: number;
}

export interface CreateBriefInput {
  title: string;
  description: string;
  product_id?: string | null;
  product_name?: string | null;
  product_images?: string[];
  content_type: ContentType;
  duration_seconds?: number | null;
  aspect_ratio?: string | null;
  num_deliverables?: number;
  requirements?: string[];
  references_urls?: string[];
  budget: number;
  deadline: string;
  max_applications?: number;
}
