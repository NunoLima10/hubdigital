export type CreateOptions = {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  errorMessage?: string;
  successMessage?: string;
};
