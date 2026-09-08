export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export type MeetingStatus = 'pending' | 'processing' | 'done';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  email?: string | null;
  speaker_id?: string | null;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  text: string;
  start_ms: number;
  end_ms: number;
  sequence: number;
  participant_id?: string | null;
}

export interface Summary {
  id: string;
  meeting_id: string;
  overview: string;
  key_topics: string[];
  created_at: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  task: string;
  assignee?: string | null;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  meeting_id: string;
  title: string;
  start_ms: number;
  end_ms?: number | null;
  sequence: number;
}

export interface TranscriptComment {
  id: string;
  meeting_id: string;
  segment_id: string;
  text: string;
  author_name?: string | null;
  created_at: string;
}

export interface TranscriptHighlight {
  id: string;
  meeting_id: string;
  segment_id: string;
  created_at: string;
}

export interface TranscriptCommentCreateInput {
  segment_id: string;
  text: string;
  author_name?: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration_sec?: number | null;
  audio_url?: string | null;
  status: MeetingStatus;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  tags: Tag[];
}

export interface MeetingDetail extends Meeting {
  transcript: TranscriptSegment[];
  summary?: Summary | null;
  action_items: ActionItem[];
  chapters: Chapter[];
}

export interface MeetingListResponse {
  items: Meeting[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type MeetingSortOption = 'date_desc' | 'date_asc' | 'title_asc';

export interface MeetingQueryParams {
  page?: number;
  size?: number;
  q?: string;
  participant?: string;
  date_from?: string;
  date_to?: string;
  sort?: MeetingSortOption;
  tag_id?: string;
}

export interface MeetingCreateInput {
  title: string;
  date: string;
  duration_sec?: number | null;
  audio_url?: string | null;
  status?: MeetingStatus;
}

export interface ParticipantInput {
  name: string;
  email?: string | null;
  speaker_id?: string | null;
}

export interface MeetingUpdateInput extends Partial<MeetingCreateInput> {
  participants?: ParticipantInput[];
}

export interface ActionItemCreateInput {
  task: string;
  assignee?: string | null;
  due_date?: string | null;
  completed?: boolean;
}

export interface ActionItemUpdateInput {
  task?: string;
  assignee?: string | null;
  due_date?: string | null;
  completed?: boolean;
}

export interface SummaryCreateInput {
  overview: string;
  key_topics: string[];
}
