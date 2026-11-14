import { API } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import type {
  AdminCategory,
  AdminComment,
  AdminCommentState,
  AdminProject,
  AdminProjectDetail,
  AdminStats,
  AdminUser,
  AdminUserDetail,
  AuditEntryView,
  CategorySummary,
  ModerationTarget,
  ProjectStatus,
  ReportGroup,
  ReportStatus,
  Settings,
  SettingsPatch,
  UserRole,
} from "@hubdigital/shared";

export type ListMeta = { limit: number; offset: number; total: number };

type Envelope<T> = { data: T; meta: ListMeta };

/** Drops undefined and empty values so they don't become `?q=undefined`. */
function params(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

/* -------------------------------------------------------------------- stats */

export async function fetchStats() {
  const { data } = await API.get<{ data: AdminStats }>(endpoints.adminStats);
  return data.data;
}

/* ----------------------------------------------------------------- settings */

export type SettingsResponse = {
  data: Settings;
  meta: { pendingCount: number; draftCount: number };
};

export async function fetchSettings() {
  const { data } = await API.get<SettingsResponse>(endpoints.adminSettings);
  return data;
}

export async function patchSettings(patch: SettingsPatch) {
  const { data } = await API.patch<{ data: Settings }>(
    endpoints.adminSettings,
    patch
  );
  return data.data;
}

/* ----------------------------------------------------------------- projects */

export type ProjectQuery = {
  status?: ProjectStatus;
  q?: string;
  island?: string;
  categoryId?: number;
  publisherId?: number;
  hidden?: boolean;
  deleted?: boolean;
  sort?: "newest" | "queued";
  limit?: number;
  offset?: number;
};

export async function fetchProjects(query: ProjectQuery) {
  const { data } = await API.get<Envelope<AdminProject[]>>(
    endpoints.adminProjects,
    { params: params(query) }
  );
  return data;
}

export async function fetchProject(id: number) {
  const { data } = await API.get<{ data: AdminProjectDetail }>(
    `${endpoints.adminProjects}/${id}`
  );
  return data.data;
}

export async function approveProject(id: number, note?: string) {
  await API.post(`${endpoints.adminProjects}/${id}/approve`, { note });
}

export async function rejectProject(id: number, reason: string) {
  await API.post(`${endpoints.adminProjects}/${id}/reject`, { reason });
}

export async function unpublishProject(id: number, reason: string) {
  await API.post(`${endpoints.adminProjects}/${id}/unpublish`, { reason });
}

export async function restoreProject(id: number) {
  await API.post(`${endpoints.adminProjects}/${id}/restore`);
}

export async function hideProject(id: number, reason: string) {
  await API.post(`${endpoints.adminProjects}/${id}/shadow-ban`, { reason });
}

export async function unhideProject(id: number) {
  await API.delete(`${endpoints.adminProjects}/${id}/shadow-ban`);
}

export async function setPublisherTrusted(id: number, trusted: boolean) {
  const url = `${endpoints.adminPublishers}/${id}/trust`;
  if (trusted) await API.post(url);
  else await API.delete(url);
}

/* ----------------------------------------------------------------- comments */

export type CommentQuery = {
  projectId?: number;
  userId?: string;
  q?: string;
  state?: AdminCommentState;
  limit?: number;
  offset?: number;
};

export async function fetchComments(query: CommentQuery) {
  const { data } = await API.get<Envelope<AdminComment[]>>(
    endpoints.adminComments,
    { params: params(query) }
  );
  return data;
}

export async function hideComment(id: number, reason: string) {
  await API.post(`${endpoints.adminComments}/${id}/hide`, { reason });
}

export async function unhideComment(id: number) {
  await API.delete(`${endpoints.adminComments}/${id}/hide`);
}

export async function deleteComment(id: number, reason: string) {
  await API.delete(`${endpoints.adminComments}/${id}`, { data: { reason } });
}

export async function bulkModerateComments(
  ids: number[],
  action: "hide" | "delete",
  reason: string
) {
  const { data } = await API.post<{ data: { affected: number[] } }>(
    `${endpoints.adminComments}/bulk`,
    { ids, action, reason }
  );
  return data.data.affected;
}

/* -------------------------------------------------------------------- users */

export type UserQuery = {
  q?: string;
  role?: UserRole;
  state?: "all" | "banned" | "hidden" | "staff";
  limit?: number;
  offset?: number;
};

export async function fetchUsers(query: UserQuery) {
  const { data } = await API.get<Envelope<AdminUser[]>>(endpoints.adminUsers, {
    params: params(query),
  });
  return data;
}

export async function fetchUser(id: string) {
  const { data } = await API.get<{ data: AdminUserDetail }>(
    `${endpoints.adminUsers}/${id}`
  );
  return data.data;
}

export async function hideUser(id: string, reason: string) {
  await API.post(`${endpoints.adminUsers}/${id}/shadow-ban`, { reason });
}

export async function unhideUser(id: string) {
  await API.delete(`${endpoints.adminUsers}/${id}/shadow-ban`);
}

/* ------------------------------------------------------------------ reports */

export async function fetchReports(status?: ReportStatus) {
  const { data } = await API.get<{ data: ReportGroup[] }>(
    endpoints.adminReports,
    { params: params({ status }) }
  );
  return data.data;
}

export async function resolveReports(
  targetType: string,
  targetId: string,
  outcome: "resolved" | "dismissed",
  note?: string
) {
  await API.post(
    `${endpoints.adminReports}/${targetType}/${targetId}/resolve`,
    { outcome, note }
  );
}

/* -------------------------------------------------------------------- audit */

export type AuditQuery = {
  actorId?: string;
  targetType?: ModerationTarget;
  targetId?: string;
  action?: string;
  from?: string;
  limit?: number;
  offset?: number;
};

export async function fetchAudit(query: AuditQuery) {
  const { data } = await API.get<Envelope<AuditEntryView[]>>(
    endpoints.adminAudit,
    { params: params(query) }
  );
  return data;
}

/* --------------------------------------------------------------- categories */

/** The public list, used to populate filter dropdowns. */
export async function fetchCategories() {
  const { data } = await API.get<{ data: CategorySummary[] }>(
    endpoints.categories
  );
  return data.data;
}

export async function fetchAdminCategories() {
  const { data } = await API.get<{ data: AdminCategory[] }>(
    endpoints.adminCategories
  );
  return data.data;
}

export async function createCategory(input: { key: string; name: string }) {
  await API.post(endpoints.adminCategories, input);
}

export async function updateCategory(id: number, name: string) {
  await API.patch(`${endpoints.adminCategories}/${id}`, { name });
}
