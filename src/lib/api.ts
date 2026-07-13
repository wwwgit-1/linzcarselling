export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as T;
}

export async function apiSend<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  console.log(`API Request: ${method} ${path}`, body);
  
  try {
    const response = await fetch(path, {
      method,
      headers: body == null ? undefined : { "content-type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body),
    });

    console.log(`API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await readApiError(response);
      console.error(`API Error: ${errorText}`);
      throw new Error(errorText);
    }
    
    const result = await response.json();
    console.log(`API Success:`, result);
    return result as T;
  } catch (error) {
    console.error(`API Request Failed:`, error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - unable to connect to server. Please check your internet connection and try again.");
    }
    throw error;
  }
}

async function readApiError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
