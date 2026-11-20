export const feedbackStatuses={new:'待处理',processing:'处理中',done:'已处理'} as const;
export type FeedbackStatus=keyof typeof feedbackStatuses;
export type Feedback={id:string;title:string;body:string;contact:string;article_id:string;status:FeedbackStatus;revision:number;created_at:string;updated_at:string};
export type FeedbackList={items:Feedback[];counts:Record<FeedbackStatus,number>;total:number;page:number;pages:number};
