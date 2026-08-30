export type Project = {
  id: number;
  slug: string;
  iconUrl?: string;
  website: string;
  title: string;
  description: string;
  topis: string[];
  upCount: number;
  hasUpvoted: boolean;
};
