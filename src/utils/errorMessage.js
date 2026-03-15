function extractFirstError(errors) {
  if (Array.isArray(errors)) {
    const firstItem = errors.find((item) => typeof item === 'string' && item.trim());
    return firstItem ? firstItem.trim() : null;
  }

  if (errors && typeof errors === 'object') {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value)) {
        const firstArrayItem = value.find((item) => typeof item === 'string' && item.trim());
        if (firstArrayItem) return firstArrayItem.trim();
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

export function getErrorMessage(error, fallback = 'Request failed') {
  const responseData = error?.response?.data;
  const responseMessage = typeof responseData?.message === 'string' ? responseData.message.trim() : '';
  if (responseMessage) return responseMessage;

  const responseError = typeof responseData?.error === 'string' ? responseData.error.trim() : '';
  if (responseError) return responseError;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData.trim();
  }

  const validationError = extractFirstError(responseData?.errors);
  if (validationError) return validationError;

  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Cannot connect to server. Please check the backend and network connection.';
  }

  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';
  if (rawMessage && !/^request failed with status code \d+$/i.test(rawMessage)) {
    return rawMessage;
  }

  return fallback;
}
