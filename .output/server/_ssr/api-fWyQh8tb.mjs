//#region node_modules/.nitro/vite/services/ssr/assets/api-fWyQh8tb.js
async function apiGet(path) {
	const response = await fetch(path);
	if (!response.ok) throw new Error(await readApiError(response));
	return await response.json();
}
async function apiSend(path, method, body) {
	console.log(`API Request: ${method} ${path}`, body);
	try {
		const response = await fetch(path, {
			method,
			headers: body == null ? void 0 : { "content-type": "application/json" },
			body: body == null ? void 0 : JSON.stringify(body)
		});
		console.log(`API Response: ${response.status} ${response.statusText}`);
		if (!response.ok) {
			const errorText = await readApiError(response);
			console.error(`API Error: ${errorText}`);
			throw new Error(errorText);
		}
		const result = await response.json();
		console.log(`API Success:`, result);
		return result;
	} catch (error) {
		console.error(`API Request Failed:`, error);
		if (error instanceof TypeError && error.message === "Failed to fetch") throw new Error("Network error - unable to connect to server. Please check your internet connection and try again.");
		throw error;
	}
}
async function readApiError(response) {
	try {
		return (await response.json()).error ?? `Request failed with ${response.status}`;
	} catch {
		return `Request failed with ${response.status}`;
	}
}
//#endregion
export { apiSend as n, apiGet as t };
