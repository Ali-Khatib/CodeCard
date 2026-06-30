export type UUID = string;

export type ConnectionSource = 'qr' | 'nfc' | 'direct_link' | 'manual' | 'app';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export type MediaAssetType = 'poster' | 'hero_video' | 'screenshot' | 'diagram' | 'document';

export type ProjectLinkType = 'live' | 'repo' | 'demo' | 'paper' | 'other';

export type ProfileLinkType =
  | 'website'
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'resume'
  | 'email'
  | 'other';

export type TenantRole = 'owner' | 'admin' | 'member';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ModerationStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  role: TenantRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: UUID;
  tenant_id: UUID;
  owner_user_id: UUID;
  slug: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileLink {
  id: UUID;
  tenant_id: UUID;
  profile_id: UUID;
  type: ProfileLinkType;
  label: string | null;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: UUID;
  tenant_id: UUID;
  profile_id: UUID;
  owner_user_id: UUID;
  title: string;
  tagline: string | null;
  description: string | null;
  technologies: string[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDomain {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  name: string;
  created_at: string;
}

export interface ProjectFocusArea {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  name: string;
  created_at: string;
}

export interface ProjectMediaAsset {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  type: MediaAssetType;
  storage_path: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectLink {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  type: ProjectLinkType;
  label: string | null;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SavedConnection {
  id: UUID;
  tenant_id: UUID;
  owner_user_id: UUID;
  saved_profile_id: UUID;
  connected_at: string | null;
  met_at: string | null;
  source: ConnectionSource;
  created_at: string;
  updated_at: string;
}

export interface ConnectionNote {
  id: UUID;
  tenant_id: UUID;
  owner_user_id: UUID;
  saved_connection_id: UUID;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: UUID;
  tenant_id: UUID;
  owner_user_id: UUID;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: UUID;
  tenant_id: UUID;
  collection_id: UUID;
  saved_connection_id: UUID;
  sort_order: number;
  created_at: string;
}

export interface PublicProfileEvent {
  id: UUID;
  tenant_id: UUID;
  profile_id: UUID;
  viewed_at: string;
  source: ConnectionSource | null;
  referrer: string | null;
  session_id: string | null;
}

export interface ProjectViewEvent {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  profile_id: UUID;
  viewed_at: string;
  source: ConnectionSource | null;
  session_id: string | null;
}

export interface SubscriptionCustomer {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProfile extends Profile {
  links: ProfileLink[];
  projects: (Project & {
    domains: ProjectDomain[];
    focus_areas: ProjectFocusArea[];
    media_assets: ProjectMediaAsset[];
    links: ProjectLink[];
  })[];
}

export interface AnalyticsOverview {
  profile_views: number;
  project_views: number;
  link_clicks: number;
  resume_clicks: number;
  saves: number;
  period_days: number;
}
