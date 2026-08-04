export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data;

  if (data?.error?.message) return data.error.message;

  if (data?.message) return data.message;

  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((item) => item.msg).join(". ");
  }

  if (error?.message) return error.message;

  return fallback;
};
