export type CreateOptions<TData = void> = {
  onSuccess?: (data: TData) => void;
  onError?: (error: any) => void;
  errorMessage?: string;
  successMessage?: string;
};
