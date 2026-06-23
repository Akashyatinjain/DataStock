export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'object') {
    const message =
      error.message ||
      error.error ||
      error.detail ||
      error.details ||
      error.suggestion;

    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};
