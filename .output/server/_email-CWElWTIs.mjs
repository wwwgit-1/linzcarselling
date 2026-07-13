import { o as __toESM } from "./_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "./_libs/react+tanstack__react-query.mjs";
import { t as Route } from "./_email-DdcBAK-g.mjs";
import { n as apiSend, t as apiGet } from "./_ssr/api-fWyQh8tb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_email-CWElWTIs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CURRENT_USER_KEY = "linz-current-user";
function AdminUserDetailPage() {
	const { email } = Route.useParams();
	const decodedEmail = decodeURIComponent(email);
	const [user, setUser] = (0, import_react.useState)(null);
	const [activity, setActivity] = (0, import_react.useState)([]);
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [selectedThreadKey, setSelectedThreadKey] = (0, import_react.useState)(null);
	const [messageText, setMessageText] = (0, import_react.useState)("");
	const esRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null")?.role !== "admin") {
			window.location.href = "/";
			return;
		}
		Promise.all([
			apiGet("/api/users"),
			apiGet("/api/activity"),
			apiGet(`/api/chats?email=${encodeURIComponent(decodedEmail)}`)
		]).then(([users, activityItems, chatThreads]) => {
			setUser(users[decodedEmail.toLowerCase()] ?? null);
			setActivity(activityItems);
			setThreads(chatThreads ?? []);
			if ((chatThreads ?? []).length > 0) setSelectedThreadKey(chatThreads[0].key);
		}).catch(console.error);
		return () => {
			if (esRef.current) {
				esRef.current.close();
				esRef.current = null;
			}
		};
	}, [decodedEmail]);
	const userActivity = (0, import_react.useMemo)(() => activity.filter((item) => item.user.toLowerCase() === decodedEmail.toLowerCase()), [activity, decodedEmail]);
	const selectedThread = (0, import_react.useMemo)(() => threads.find((t) => t.key === selectedThreadKey) ?? null, [threads, selectedThreadKey]);
	(0, import_react.useEffect)(() => {
		if (!selectedThreadKey) return;
		const [vehicleIdStr] = selectedThreadKey.split(":");
		const vehicleId = Number(vehicleIdStr);
		if (!vehicleId) return;
		if (esRef.current) {
			esRef.current.close();
			esRef.current = null;
		}
		const url = `/api/chats/${vehicleId}/${encodeURIComponent(decodedEmail)}/stream`;
		const es = new EventSource(url);
		es.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				const msg = data.message ?? data;
				setThreads((prev) => prev.map((t) => t.key === selectedThreadKey ? {
					...t,
					messages: [...t.messages, msg]
				} : t));
			} catch (e) {
				console.error(e);
			}
		};
		es.onerror = (e) => {};
		esRef.current = es;
		return () => {
			es.close();
			esRef.current = null;
		};
	}, [selectedThreadKey, decodedEmail]);
	async function sendAdminMessage() {
		if (!selectedThread) return;
		const [vehicleIdStr] = selectedThread.key.split(":");
		const vehicleId = Number(vehicleIdStr);
		if (!vehicleId) return;
		const body = String(messageText ?? "").trim();
		if (!body) return;
		try {
			const messages = await apiSend(`/api/chats/${vehicleId}/${encodeURIComponent(decodedEmail)}`, "POST", {
				from: "admin",
				body
			});
			setThreads((prev) => prev.map((t) => t.key === selectedThread.key ? {
				...t,
				messages
			} : t));
			setMessageText("");
		} catch (e) {
			console.error(e);
			alert("Message not sent");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-[#07111f] px-4 py-8 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]",
						children: "User Activity"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl font-bold",
						children: user?.username ?? decodedEmail
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-white/60",
						children: "Activity history and account/location context for this specific user."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/admin",
					className: "rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]",
					children: "Back to admin"
				})]
			}), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Email",
							value: user.email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Country",
							value: user.country || "Not set"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Residence",
							value: user.location || "Not set"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Role",
							value: user.role || "user"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "VPN",
							value: user.vpnActive == null ? "Unknown" : user.vpnActive ? "Active" : "No"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "VPN Location",
							value: user.vpnLocation || "Not recorded"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Actual Location",
							value: user.actualLocation || "Not recorded"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailCard, {
							label: "Last Seen",
							value: user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "Not recorded"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-bold",
						children: "Activity History"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "text-xs uppercase tracking-wider text-white/45",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Time"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Action"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Detail"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [userActivity.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "bg-white/[0.055]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "rounded-l-xl px-3 py-3 text-white/60",
										children: new Date(item.at).toLocaleString()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-3 font-semibold",
										children: item.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "rounded-r-xl px-3 py-3 text-white/65",
										children: item.detail || "No detail"
									})
								]
							}, `${item.at}-${index}`)), userActivity.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: "bg-white/[0.055]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "rounded-xl px-3 py-5 text-white/60",
									colSpan: 3,
									children: "No activity recorded for this user yet."
								})
							})] })]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-xl font-bold mb-4",
						children: "Message Threads"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-4 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-1 space-y-2 max-h-[300px] overflow-y-auto",
							children: [threads.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-white/60 text-sm",
								children: "No threads found."
							}), threads.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setSelectedThreadKey(t.key),
								className: `w-full text-left rounded-xl px-4 py-3 transition-all ${t.key === selectedThreadKey ? "bg-amber text-navy font-semibold shadow-lg" : "hover:bg-white/[0.08] border border-white/10"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium truncate",
									children: t.key
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs mt-1 opacity-70 truncate",
									children: t.messages[t.messages.length - 1]?.body ?? "No messages"
								})]
							}, t.key))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-3 flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 bg-white/[0.02] rounded-2xl border border-white/10 p-4 min-h-[400px] max-h-[500px] overflow-y-auto",
								children: !selectedThread || selectedThread.messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full flex items-center justify-center text-white/60",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-comments text-4xl mb-3 opacity-30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No messages yet. Start a conversation!" })]
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-4",
									children: selectedThread.messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `flex ${m.from === "admin" ? "justify-end" : "justify-start"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${m.from === "admin" ? "bg-amber text-navy" : "bg-white/[0.08] text-white border border-white/10"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-semibold opacity-70",
													children: m.from === "admin" ? "You" : user?.username || "User"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs opacity-50",
													children: new Date(m.at).toLocaleString([], {
														hour: "2-digit",
														minute: "2-digit",
														month: "short",
														day: "numeric"
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm leading-relaxed",
												children: m.body
											})]
										})
									}, `${m.at}-${i}`))
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: messageText,
									onChange: (e) => setMessageText(e.target.value),
									placeholder: "Type your message...",
									className: "flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all text-white placeholder:text-white/40"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: sendAdminMessage,
									className: "rounded-xl bg-amber px-6 py-3 font-bold text-navy hover:bg-amber/90 transition-colors flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-paper-plane" }), "Send"]
								})]
							})]
						})]
					})]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70",
				children: "User not found."
			})]
		})
	});
}
function DetailCard({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-white/10 bg-white/[0.04] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs uppercase tracking-wider text-white/45",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 break-words font-semibold",
			children: value
		})]
	});
}
//#endregion
export { AdminUserDetailPage as component };
