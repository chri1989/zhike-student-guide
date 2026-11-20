export const progressStages = {
  received: '待受理',
  following: '学代跟进中',
  referred: '已对接部处',
  resolved: '已解决并收录为指南',
} as const;

export type ProgressStage = keyof typeof progressStages;
export type ProgressRecord = {
  feedback_id: string; title: string; summary: string; stage: ProgressStage;
  guide_id: string; revision: number; updated_at: string;
};
export type PublicProgress = {
  id: string; title: string; summary: string; stage: ProgressStage; updatedAt: string;
  guide?: { id: string; title: string };
};
export type SiteOverview = {
  items: number; scenarios: number; resolved: number; releases30d: number; progress: PublicProgress[];
};
