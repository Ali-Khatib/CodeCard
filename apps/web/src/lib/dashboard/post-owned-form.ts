type OwnedFormBody = {
  success?: boolean;
  error?: string;
};

/**
 * Confirmed write only. The response is JSON from a route handler, so the
 * button does not wait for the dashboard layout to render again.
 */
export async function postOwnedForm<T extends OwnedFormBody>(
  path: string,
  formData: FormData,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { error: 'Could not save. Please try again.' } as T;
  }

  let body: T | null = null;
  try {
    body = (await response.json()) as T;
  } catch {
    body = null;
  }

  if (!response.ok || body?.success !== true) {
    return {
      ...(body ?? {}),
      success: false,
      error: body?.error || 'Could not save. Please try again.',
    } as T;
  }

  return body;
}
