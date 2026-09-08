import { get, post, put, del } from './client';
import {
  Meeting,
  MeetingDetail,
  MeetingListResponse,
  MeetingQueryParams,
  MeetingCreateInput,
  Tag,
  TranscriptSegment,
  Chapter,
  Summary,
  ActionItem,
  ActionItemCreateInput,
  ActionItemUpdateInput,
  SummaryCreateInput,
  TranscriptComment,
  TranscriptCommentCreateInput,
  TranscriptHighlight,
  MeetingUpdateInput,
} from '@/types';

export async function getMeetings(params: MeetingQueryParams = {}): Promise<MeetingListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.size) query.set('size', params.size.toString());
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.participant?.trim()) query.set('participant', params.participant.trim());
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const endpoint = `/api/meetings${qs ? `?${qs}` : ''}`;
  return get<MeetingListResponse>(endpoint);
}

export async function getMeetingById(id: string): Promise<MeetingDetail> {
  return get<MeetingDetail>(`/api/meetings/${encodeURIComponent(id)}`);
}

export async function createMeeting(data: MeetingCreateInput): Promise<MeetingDetail> {
  return post<MeetingDetail>('/api/meetings', data);
}

export async function updateMeeting(id: string, data: MeetingUpdateInput): Promise<MeetingDetail> {
  return put<MeetingDetail>(`/api/meetings/${encodeURIComponent(id)}`, data);
}

export async function deleteMeeting(id: string): Promise<void> {
  return del<void>(`/api/meetings/${encodeURIComponent(id)}`);
}

export async function getTranscript(id: string): Promise<TranscriptSegment[]> {
  return get<TranscriptSegment[]>(`/api/meetings/${encodeURIComponent(id)}/transcript`);
}

export async function getChapters(id: string): Promise<Chapter[]> {
  return get<Chapter[]>(`/api/meetings/${encodeURIComponent(id)}/chapters`);
}

export async function getSummary(id: string): Promise<Summary | null> {
  return get<Summary | null>(`/api/meetings/${encodeURIComponent(id)}/summary`);
}

export async function createSummary(id: string, data: SummaryCreateInput): Promise<Summary> {
  return post<Summary>(`/api/meetings/${encodeURIComponent(id)}/summary`, data);
}

export async function getActionItems(id: string): Promise<ActionItem[]> {
  return get<ActionItem[]>(`/api/meetings/${encodeURIComponent(id)}/action-items`);
}

export async function createActionItem(id: string, data: ActionItemCreateInput): Promise<ActionItem> {
  return post<ActionItem>(`/api/meetings/${encodeURIComponent(id)}/action-items`, data);
}

export async function updateActionItem(id: string, aid: string, data: ActionItemUpdateInput): Promise<ActionItem> {
  return put<ActionItem>(`/api/meetings/${encodeURIComponent(id)}/action-items/${encodeURIComponent(aid)}`, data);
}

export async function deleteActionItem(id: string, aid: string): Promise<void> {
  return del<void>(`/api/meetings/${encodeURIComponent(id)}/action-items/${encodeURIComponent(aid)}`);
}

export async function getTags(): Promise<Tag[]> {
  return get<Tag[]>('/api/tags');
}

export async function getComments(id: string): Promise<TranscriptComment[]> {
  return get<TranscriptComment[]>(`/api/meetings/${encodeURIComponent(id)}/comments`);
}

export async function createComment(
  id: string,
  data: TranscriptCommentCreateInput
): Promise<TranscriptComment> {
  return post<TranscriptComment>(`/api/meetings/${encodeURIComponent(id)}/comments`, data);
}

export async function deleteComment(id: string, commentId: string): Promise<void> {
  return del<void>(
    `/api/meetings/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`
  );
}

export async function getHighlights(id: string): Promise<TranscriptHighlight[]> {
  return get<TranscriptHighlight[]>(`/api/meetings/${encodeURIComponent(id)}/highlights`);
}

export async function createHighlight(id: string, segmentId: string): Promise<TranscriptHighlight> {
  return post<TranscriptHighlight>(`/api/meetings/${encodeURIComponent(id)}/highlights`, { segment_id: segmentId });
}

export async function deleteHighlight(id: string, highlightId: string): Promise<void> {
  return del<void>(`/api/meetings/${encodeURIComponent(id)}/highlights/${encodeURIComponent(highlightId)}`);
}
