export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an unreadable response. Check that Express is running."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error?.message ?? "The request failed. Please try again."
      );
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to the server. Check that Express is running."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}