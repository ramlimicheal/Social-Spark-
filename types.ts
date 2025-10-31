

export interface Brief {
  brandName: string;
  productDetails: string;
  campaignGoal: string;
  coreMessage: string;
  targetAudience: string;
  brandVoice: string;
  emotionalAppeal: string;
}

export interface ClientProfile extends Brief {
  brandPalette: string[];
  savedAt: string;
}

export interface CopyVariant {
  angle: string;
  headline: string;
  body: string;
  cta: string;
  why: string;
  index: number;
}

export interface CampaignIdea {
  headline: string;
  fullDescription: string;
  visualDescription: string;
  index: number;
}

export type GenerationStatus = 'pending' | 'generating' | 'done' | 'failed';

export interface QueueItem {
  id: string;
  platform: string;
  concept: string;
  status: GenerationStatus;
  error?: string;
}

export interface Creative {
  url: string;
  platform: string;
  concept: string;
  copy: CopyVariant | null;
  brand: string;
  jobId: string;
  label: string; // "With Text" or "No Text"
  prompt: string;
}

export type Platform = 'instagram' | 'instagram-story' | 'facebook' | 'linkedin' | 'twitter' | 'pinterest';

export const platformRatios: Record<Platform, string> = {
  instagram: '1:1',
  'instagram-story': '9:16',
  facebook: '1.91:1',
  linkedin: '1.91:1',
  twitter: '16:9',
  pinterest: '2:3',
};

export type Quality = 'standard' | 'hd' | '4k';
export type StylePreset = 'match' | 'minimalist' | 'bold' | 'elegant';

// Creative Board Types
export interface CreativeTeamMember {
  name: string;
  role: 'Creative Director' | 'Art Director' | 'Copywriter' | 'Strategy Director' | 'Designer';
  specialty: string;
  approach: string;
  badge: string;
}

export interface CreativeBoardBrief {
  brand: string;
  industry: string;
  objective: string;
  details: string;
  budget: string;
}

export interface TeamConcept {
  member: CreativeTeamMember;
  content: string;
  timestamp: string;
  expansion?: string;
  isExpanding?: boolean;
}