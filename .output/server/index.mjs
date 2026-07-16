globalThis.__nitro_main__ = import.meta.url;
import { a as toEventHandler, c as serve, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, s as NodeResponse, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/admin-Cub3qgM_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"726e-67LGnfZlXnq03mTVmtsaefh87jk\"",
		"mtime": "2026-07-16T15:32:04.124Z",
		"size": 29294,
		"path": "../public/assets/admin-Cub3qgM_.js"
	},
	"/assets/api-D0_P4wlt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"35c-YnwNnECud9iiY3zJxxz92wC0DsU\"",
		"mtime": "2026-07-16T15:32:04.124Z",
		"size": 860,
		"path": "../public/assets/api-D0_P4wlt.js"
	},
	"/assets/jsx-runtime-CaR_m4Xc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1edb-YA3tihQJPH2usBIGDc+C49NkLY4\"",
		"mtime": "2026-07-16T15:32:04.124Z",
		"size": 7899,
		"path": "../public/assets/jsx-runtime-CaR_m4Xc.js"
	},
	"/assets/rolldown-runtime-CNC7AqOf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"36f-poL7VEo+W3rlEpE8cNtjWDVI11g\"",
		"mtime": "2026-07-16T15:32:04.125Z",
		"size": 879,
		"path": "../public/assets/rolldown-runtime-CNC7AqOf.js"
	},
	"/assets/routes-CrfMWcHR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c22b-MWX70BaGHCbMEAbr7jwfg680eJA\"",
		"mtime": "2026-07-16T15:32:04.126Z",
		"size": 49707,
		"path": "../public/assets/routes-CrfMWcHR.js"
	},
	"/assets/_email-uN51a1zd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1dd4-2Rx04k59RAkJg9b6yIqrD/h/0uM\"",
		"mtime": "2026-07-16T15:32:04.122Z",
		"size": 7636,
		"path": "../public/assets/_email-uN51a1zd.js"
	},
	"/assets/proxy-BPUov0s-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1d963-0FWaZJJYF59q9gl9F8LLca2kl/I\"",
		"mtime": "2026-07-16T15:32:04.125Z",
		"size": 121187,
		"path": "../public/assets/proxy-BPUov0s-.js"
	},
	"/assets/leaflet-src-DeWzIhuu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2455d-Wvy1yEn3ZaCzTtGyupTpGKXOZAk\"",
		"mtime": "2026-07-16T15:32:04.125Z",
		"size": 148829,
		"path": "../public/assets/leaflet-src-DeWzIhuu.js"
	},
	"/photos/.gitkeep": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk\"",
		"mtime": "2026-07-16T02:58:20.711Z",
		"size": 0,
		"path": "../public/photos/.gitkeep"
	},
	"/assets/_id-LH1Xfvm5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5b43-OmWX/Bfq8yjV6i0J85o6EXUFoyM\"",
		"mtime": "2026-07-16T15:32:04.123Z",
		"size": 23363,
		"path": "../public/assets/_id-LH1Xfvm5.js"
	},
	"/assets/index-BeeHo6Qc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"52ed0-ME8aUbzpMOYJcWb0s2ZjUFbZSbA\"",
		"mtime": "2026-07-16T15:32:04.122Z",
		"size": 339664,
		"path": "../public/assets/index-BeeHo6Qc.js"
	},
	"/assets/styles-BvPSVWXo.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"190c1-Hr5/aPjkj7piodL6jADX6+fOISQ\"",
		"mtime": "2026-07-16T15:32:04.126Z",
		"size": 102593,
		"path": "../public/assets/styles-BvPSVWXo.css"
	},
	"/linz-motors-logo.png": {
		"type": "image/png",
		"etag": "\"85112-tNMR+PXl+G4/YFvmcxFBFVjxRXk\"",
		"mtime": "2026-07-16T11:30:13.115Z",
		"size": 545042,
		"path": "../public/linz-motors-logo.png"
	},
	"/photos/linz-motors-logo.png": {
		"type": "image/png",
		"etag": "\"85112-tNMR+PXl+G4/YFvmcxFBFVjxRXk\"",
		"mtime": "2026-07-16T11:30:13.115Z",
		"size": 545042,
		"path": "../public/photos/linz-motors-logo.png"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"1505d0-CbAaCZpmJZ5Vmqrtf90KC8rmqyU\"",
		"mtime": "2026-07-13T11:22:20.172Z",
		"size": 1377744,
		"path": "../public/favicon.png"
	},
	"/favicon1.png": {
		"type": "image/png",
		"etag": "\"1f760f-Q9gS3TLfQHTYgZw5XXRVNVLm754\"",
		"mtime": "2026-07-13T11:50:58.352Z",
		"size": 2061839,
		"path": "../public/favicon1.png"
	},
	"/photos/about-owner-1.jpg": {
		"type": "image/jpeg",
		"etag": "\"236eb8-PGu9Ii0+lkLvIopEBr/SVwon8eg\"",
		"mtime": "2026-07-16T02:09:44.975Z",
		"size": 2322104,
		"path": "../public/photos/about-owner-1.jpg"
	},
	"/photos/about-owner-2.jpg": {
		"type": "image/jpeg",
		"etag": "\"2bce53-HHWlDkEg0mY0MkGC2pBJA0E+Wu0\"",
		"mtime": "2026-07-16T02:33:40.318Z",
		"size": 2870867,
		"path": "../public/photos/about-owner-2.jpg"
	},
	"/data/car video.mp4": {
		"type": "video/mp4",
		"etag": "\"18cfd11-r/0zMi1tMqYDobXMp6sPu3ZWlGg\"",
		"mtime": "2026-07-13T11:50:58.344Z",
		"size": 26017041,
		"path": "../public/data/car video.mp4"
	},
	"/data.mp4": {
		"type": "video/mp4",
		"etag": "\"18cfd11-r/0zMi1tMqYDobXMp6sPu3ZWlGg\"",
		"mtime": "2026-07-13T11:50:58.217Z",
		"size": 26017041,
		"path": "../public/data.mp4"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_vWTorG = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_vWTorG
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
