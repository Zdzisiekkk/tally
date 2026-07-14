export type ActivityType = 'base' | 'multiplier_add' | 'flat_bonus' | 'per_unit_bonus'
export type MemberRole = 'admin' | 'member'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export interface Category {
  id: string
  group_id: string
  name: string
  color: string
  icon: string | null
  sort_order: number
  created_at: string
}

export interface Activity {
  id: string
  group_id: string
  category_id: string | null
  name: string
  type: ActivityType
  value: number
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Entry {
  id: string
  group_id: string
  subject_id: string
  created_by: string
  note: string | null
  occurred_at: string
  total_points: number
  created_at: string
}

export interface EntryItem {
  id: string
  entry_id: string
  activity_id: string
  activity_type: ActivityType
  activity_value: number
  qty: number
  created_at: string
}

export interface EntryFeedRow {
  id: string
  group_id: string
  subject_id: string
  created_by: string
  note: string | null
  occurred_at: string
  total_points: number
  subject_name: string
  subject_avatar: string | null
  items: Array<{
    activity_id: string
    name: string
    type: ActivityType
    value: number
    qty: number
  }> | null
}

export interface LeaderboardRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  total: number
  entries_count: number
}

export interface StatsActivityRow {
  activity_id: string
  name: string
  category: string | null
  total: number
  times_used: number
}

export interface StatsTimelineRow {
  bucket: string
  user_id: string
  display_name: string
  points: number
}

// Placeholder Database type for supabase-js generic
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      groups: { Row: Group; Insert: Partial<Group>; Update: Partial<Group> }
      group_members: { Row: GroupMember; Insert: Partial<GroupMember>; Update: Partial<GroupMember> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> }
      entries: { Row: Entry; Insert: Partial<Entry>; Update: Partial<Entry> }
      entry_items: { Row: EntryItem; Insert: Partial<EntryItem>; Update: Partial<EntryItem> }
    }
    Views: {
      entry_feed: { Row: EntryFeedRow }
    }
    Functions: {
      leaderboard: { Args: { p_group: string; p_since?: string }; Returns: LeaderboardRow[] }
      create_group: { Args: { p_name: string; p_seed?: boolean }; Returns: string }
      join_group_by_code: { Args: { p_code: string }; Returns: string }
      add_entry: { Args: { p_group: string; p_subject: string; p_items: unknown; p_note?: string; p_occurred_at?: string }; Returns: string }
      stats_by_activity: { Args: { p_group: string; p_user?: string }; Returns: StatsActivityRow[] }
      stats_timeline: { Args: { p_group: string; p_bucket?: string }; Returns: StatsTimelineRow[] }
      is_group_admin: { Args: { p_group: string; p_user: string }; Returns: boolean }
      is_group_member: { Args: { p_group: string; p_user: string }; Returns: boolean }
    }
    Enums: {
      activity_type: ActivityType
      member_role: MemberRole
    }
  }
}
