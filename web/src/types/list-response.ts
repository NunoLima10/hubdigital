export type ListResponse<T> = {
  data: T[];
  meta: {
    limit: number;
    offset: number;
    total: number;
  };
};
