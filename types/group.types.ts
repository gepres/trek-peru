import {
  GroupMemberRole,
  GroupType,
  GroupVerificationStatus,
  GroupVisibility,
  Timestamps,
} from './database.types';
import type { Profile } from './user.types';
import type { RouteWithCreator } from './route.types';

export interface Group extends Timestamps {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  type: GroupType;
  visibility: GroupVisibility;
  legal_name?: string;
  tax_id?: string;
  business_email?: string;
  business_phone?: string;
  website?: string;
  address?: string;
  certificate_url?: string;
  verification_status: GroupVerificationStatus;
  verification_notes?: string;
  verified_at?: string;
}

export interface GroupMember extends Timestamps {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  invited_by?: string;
  joined_at: string;
}

export interface GroupFollower {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface GroupWithStats extends Group {
  owner?: Profile;
  members_count?: number;
  followers_count?: number;
  routes_count?: number;
  current_user_role?: GroupMemberRole;
  is_following?: boolean;
}

export interface GroupWithDetails extends GroupWithStats {
  members?: Array<GroupMember & { user: Profile }>;
  routes?: RouteWithCreator[];
}

export interface GroupForm {
  name: string;
  slug: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  type: GroupType;
  visibility: GroupVisibility;
  legal_name?: string;
  tax_id?: string;
  business_email?: string;
  business_phone?: string;
  website?: string;
  address?: string;
  certificate_url?: string;
}
