export type CreateOptions<TData = void> = {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  errorMessage?: string;
  successMessage?: string;
};
