import { o as __toESM } from "./_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "./_libs/react+tanstack__react-query.mjs";
import { n as apiSend, t as apiGet } from "./_ssr/api-fWyQh8tb.mjs";
import { t as Route } from "./_id-CuVELiPE.mjs";
import { o as motion } from "./_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id-BwYoMYM9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CURRENT_USER_KEY = "linz-current-user";
function trackActivity(action, detail) {
	try {
		const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null");
		apiSend("/api/activity", "POST", {
			action,
			detail: detail ?? "",
			user: currentUser?.email ?? "guest"
		}).catch(console.error);
	} catch (error) {
		console.error(error);
	}
}
function getVehicleImages(vehicle) {
	const images = [
		...vehicle.galleryImages ?? [],
		...vehicle.images ?? [],
		vehicle.image
	].filter(Boolean);
	return [...new Set(images)];
}
function VehicleDetailPage() {
	const { id } = Route.useParams();
	const vehicleId = Number(id);
	const [currentUser, setCurrentUser] = (0, import_react.useState)(null);
	const [vehicle, setVehicle] = (0, import_react.useState)(null);
	const [selectedImage, setSelectedImage] = (0, import_react.useState)("");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const chatPath = (0, import_react.useMemo)(() => currentUser ? `/api/chats/${vehicleId}/${encodeURIComponent(currentUser.email)}` : "", [currentUser, vehicleId]);
	(0, import_react.useEffect)(() => {
		const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null");
		setCurrentUser(user);
		if (!user) return;
		apiGet(`/api/vehicles/${vehicleId}`).then((match) => {
			setVehicle(match);
			setSelectedImage(getVehicleImages(match)[0] ?? "");
			trackActivity("vehicle details opened", match.vehicle || match.name || String(vehicleId));
		}).catch((error) => {
			console.error(error);
			setVehicle(null);
			setSelectedImage("");
		});
	}, [vehicleId]);
	const esRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!chatPath) return;
		apiGet(chatPath).then(setMessages).catch(console.error);
		const url = `/api/chats/${vehicleId}/${encodeURIComponent(currentUser?.email ?? "")}/stream`;
		const es = new EventSource(url);
		es.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				const msg = data.message ?? data;
				setMessages((prev) => [...prev, msg]);
			} catch (error) {
				console.error(error);
			}
		};
		es.onerror = (error) => {
			console.error("Chat stream error:", error);
		};
		esRef.current = es;
		return () => {
			es.close();
			esRef.current = null;
		};
	}, [
		chatPath,
		vehicleId,
		currentUser
	]);
	const gallery = vehicle ? getVehicleImages(vehicle) : [];
	vehicle && [
		["Vehicle", vehicle.vehicle || vehicle.name],
		["Make", vehicle.make],
		["Model", vehicle.model],
		["Body Type", vehicle.bodyType],
		["Year", vehicle.year],
		["Condition", vehicle.condition],
		["Fuel Type", vehicle.fuelType],
		["Cylinders", vehicle.cylinders],
		["Drive Type", vehicle.driveType],
		["Engine Type", vehicle.engineType],
		["Capacity/CC", vehicle.capacityCc],
		["Power", vehicle.power],
		["Torque", vehicle.torque],
		["Release Date", vehicle.releaseDate],
		["Build Date", vehicle.buildDate],
		["Compliance Date", vehicle.complianceDate],
		["Model Year", vehicle.modelYear],
		["Mileage", `${vehicle.mileage.toLocaleString()} km`],
		["Color", vehicle.color]
	].filter(([, value]) => value);
	const sendMessage = async (event) => {
		event.preventDefault();
		if (!chatPath) return;
		const form = new FormData(event.currentTarget);
		const body = String(form.get("message") ?? "").trim();
		if (!body) return;
		try {
			const nextMessages = await apiSend(chatPath, "POST", {
				from: "user",
				body
			});
			setMessages(nextMessages);
			trackActivity("admin chat message", vehicle?.vehicle || vehicle?.name || String(vehicleId));
			event.currentTarget.reset();
		} catch (error) {
			console.error(error);
		}
	};
	if (!currentUser) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-[#07111f] px-4 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]",
					children: "Members Only"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-3xl font-bold",
					children: "Sign up to view vehicle details"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-white/65",
					children: "Return to the showroom and create an account to inspect this passenger car."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "mt-6 inline-flex rounded-full bg-[#e8a838] px-6 py-3 font-bold text-[#0a1628]",
					children: "Back to showroom"
				})
			]
		})
	});
	if (!vehicle) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-[#07111f] px-4 text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-bold",
				children: "Vehicle not found"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "/#inventory",
				className: "mt-6 inline-flex rounded-full bg-[#e8a838] px-6 py-3 font-bold text-[#0a1628]",
				children: "Back to inventory"
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-[#07111f] px-6 py-12 text-white sm:px-8 lg:px-12 xl:px-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-[1600px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]",
								children: "Passenger Car Details"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 font-display text-4xl font-bold",
								children: vehicle.vehicle || vehicle.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center gap-3 text-sm text-white/65",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										vehicle.make || "unknown",
										" ",
										vehicle.model
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1",
										children: vehicle.year || "unknown"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1",
										children: vehicle.condition || "unknown"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1",
										children: vehicle.fuelType || "unknown"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.3em] ${vehicle.tag === "PREMIUM" ? "bg-amber text-navy" : "bg-white text-navy"}`,
										children: vehicle.tag
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/#inventory",
						className: "rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]",
						children: "Back to inventory"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 grid gap-6 lg:grid-cols-[1.65fr_0.85fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-white/10 bg-white/[0.04] p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "aspect-[16/9] min-h-[500px] overflow-hidden rounded-[1.5rem] bg-white/5 relative group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: selectedImage || vehicle.image,
									alt: vehicle.vehicle || vehicle.name,
									className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
								}), gallery.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											const currentIndex = gallery.indexOf(selectedImage);
											const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
											setSelectedImage(gallery[prevIndex]);
										},
										className: "absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-chevron-left" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											const currentIndex = gallery.indexOf(selectedImage);
											const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
											setSelectedImage(gallery[nextIndex]);
										},
										className: "absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-chevron-right" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2",
										children: gallery.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setSelectedImage(image),
											className: `h-2 rounded-full transition-all ${selectedImage === image ? "w-6 bg-amber" : "w-2 bg-white/50 hover:bg-white"}`
										}, `${image}-${index}`))
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm text-white/60",
										children: [
											gallery.length,
											" image",
											gallery.length !== 1 ? "s" : ""
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												const currentIndex = gallery.indexOf(selectedImage);
												const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
												setSelectedImage(gallery[prevIndex]);
											},
											className: "h-8 w-8 rounded-full border border-white/20 bg-white/5 text-white/60 hover:border-amber hover:text-amber transition-colors flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-chevron-left text-sm" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												const currentIndex = gallery.indexOf(selectedImage);
												const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
												setSelectedImage(gallery[nextIndex]);
											},
											className: "h-8 w-8 rounded-full border border-white/20 bg-white/5 text-white/60 hover:border-amber hover:text-amber transition-colors flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-chevron-right text-sm" })
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",
									children: gallery.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSelectedImage(image),
										className: `aspect-square overflow-hidden rounded-xl border-2 transition-all ${selectedImage === image ? "border-amber shadow-lg scale-105" : "border-white/10 hover:border-white/30"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: image,
											alt: "",
											className: "h-full w-full object-cover"
										})
									}, `${image}-${index}`))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-3xl border border-white/10 bg-white/5 p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs uppercase tracking-[0.24em] text-white/45",
											children: "Mileage"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 text-lg font-semibold text-white",
											children: [vehicle.mileage.toLocaleString(), " km"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-3xl border border-white/10 bg-white/5 p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs uppercase tracking-[0.24em] text-white/45",
											children: "Drive"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 text-lg font-semibold text-white",
											children: vehicle.driveType || "unknown"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-3xl border border-white/10 bg-white/5 p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs uppercase tracking-[0.24em] text-white/45",
											children: "Model Year"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 text-lg font-semibold text-white",
											children: vehicle.modelYear || "unknown"
										})]
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "rounded-3xl border border-white/10 bg-white/[0.04] p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm uppercase tracking-[0.2em] text-white/45",
										children: "Price"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 font-display text-4xl font-bold text-[#e8a838]",
										children: ["EUR ", vehicle.price.toLocaleString()]
									}),
									vehicle.weeklyRepayment ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 text-white/65",
										children: ["Weekly repayment: EUR ", vehicle.weeklyRepayment.toLocaleString()]
									}) : null
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] ${vehicle.tag === "PREMIUM" ? "text-[#b57e00]" : "text-[#0a1628]"}`,
									children: vehicle.tag
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/70",
								children: vehicle.specs || "No detailed specifications were supplied."
							}),
							vehicle.detailsPackage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									const downloadUrl = vehicle.detailsPackage?.url;
									if (downloadUrl) {
										const link = document.createElement("a");
										link.href = downloadUrl;
										link.download = `${vehicle.name.replace(/\s+/g, "_")}_details.zip`;
										document.body.appendChild(link);
										link.click();
										document.body.removeChild(link);
										if (currentUser) apiSend("/api/track-download", "POST", {
											email: currentUser.email,
											vehicleId: vehicle.id,
											vehicleName: vehicle.name,
											timestamp: (/* @__PURE__ */ new Date()).toISOString()
										}).catch(console.error);
										else apiSend("/api/track-anonymous-download", "POST", {
											vehicleId: vehicle.id,
											vehicleName: vehicle.name,
											timestamp: (/* @__PURE__ */ new Date()).toISOString()
										}).catch(console.error);
									}
								},
								className: "mt-4 w-full py-3 rounded-full text-sm font-semibold border-2 border-amber text-amber hover:bg-amber hover:text-[#0a1628] transition-colors",
								children: "Download Details Package"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h2, {
						initial: {
							opacity: 0,
							y: -20
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: { duration: .5 },
						className: "font-display text-3xl font-bold mb-6",
						children: "Vehicle Specifications"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: 1
								},
								transition: {
									duration: .4,
									delay: .1
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { rotate: 360 },
										transition: {
											duration: 20,
											repeat: Infinity,
											ease: "linear"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-car text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Vehicle"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-semibold text-white",
										children: vehicle.vehicle || vehicle.name
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Make"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.make || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Model"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.model
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Body Type"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.bodyType || "unknown"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: -1
								},
								transition: {
									duration: .4,
									delay: .2
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { scale: [
											1,
											1.1,
											1
										] },
										transition: {
											duration: 2,
											repeat: Infinity,
											ease: "easeInOut"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-calendar text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Year & Condition"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-semibold text-white",
										children: vehicle.year || vehicle.modelYear || "unknown"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Condition"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.condition || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Release Date"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.releaseDate || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Model Year"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.modelYear || "unknown"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: 1
								},
								transition: {
									duration: .4,
									delay: .3
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { y: [
											0,
											-3,
											0
										] },
										transition: {
											duration: 1.5,
											repeat: Infinity,
											ease: "easeInOut"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-gas-pump text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Engine & Fuel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-semibold text-white",
										children: vehicle.engineType || vehicle.fuelType || "unknown"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Fuel Type"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.fuelType || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Cylinders"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.cylinders || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Capacity"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.capacityCc || "unknown"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: -1
								},
								transition: {
									duration: .4,
									delay: .4
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { rotate: [
											0,
											10,
											-10,
											0
										] },
										transition: {
											duration: 3,
											repeat: Infinity,
											ease: "easeInOut"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-bolt text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Performance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-semibold text-white",
										children: vehicle.power || "unknown"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Power"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.power || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Torque"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.torque || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Drive Type"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.driveType || "unknown"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: 1
								},
								transition: {
									duration: .4,
									delay: .5
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { scale: [
											1,
											1.2,
											1
										] },
										transition: {
											duration: 2,
											repeat: Infinity,
											ease: "easeInOut"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-gauge-high text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Mileage"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-lg font-semibold text-white",
										children: [vehicle.mileage.toLocaleString(), " km"]
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Mileage"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-white font-medium",
												children: [vehicle.mileage.toLocaleString(), " km"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between border-b border-white/10 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Build Date"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.buildDate || "unknown"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white/60 text-sm",
												children: "Compliance"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-white font-medium",
												children: vehicle.complianceDate || "unknown"
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									scale: .9
								},
								animate: {
									opacity: 1,
									scale: 1
								},
								whileHover: {
									scale: 1.03,
									rotate: -1
								},
								transition: {
									duration: .4,
									delay: .6
								},
								className: "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										animate: { rotate: [
											0,
											-15,
											15,
											0
										] },
										transition: {
											duration: 4,
											repeat: Infinity,
											ease: "easeInOut"
										},
										className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-palette text-white" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs uppercase tracking-[0.2em] text-white/45",
										children: "Appearance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-semibold text-white",
										children: vehicle.color
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between border-b border-white/10 pb-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white/60 text-sm",
											children: "Color"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white font-medium",
											children: vehicle.color
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white/60 text-sm",
											children: "Tag"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.2em] ${vehicle.tag === "PREMIUM" ? "bg-amber text-navy" : "bg-white text-navy"}`,
											children: vehicle.tag
										})]
									})]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-12 w-12 rounded-full bg-amber/20 flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-comments text-amber text-xl" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl font-bold",
								children: "Chat with Administrator"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-white/60 text-sm mt-1",
								children: "Get instant help with test drives, financing, and availability"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-white/[0.02] rounded-2xl border border-white/10 p-6 min-h-[400px] max-h-[600px] overflow-y-auto",
							children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full flex items-center justify-center text-white/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-16 w-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-comments text-amber text-2xl" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-lg font-medium",
											children: "Start a conversation"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm mt-2",
											children: "Send a message about test drives, financing, or availability."
										})
									]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-4",
								children: messages.map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex ${message.from === "user" ? "justify-end" : "justify-start"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${message.from === "user" ? "bg-amber text-[#0a1628]" : "bg-white/[0.08] text-white border border-white/10"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-semibold opacity-70",
												children: message.from === "user" ? currentUser.username : "Linz Admin"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs opacity-50",
												children: new Date(message.at).toLocaleString([], {
													hour: "2-digit",
													minute: "2-digit",
													month: "short",
													day: "numeric"
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm leading-relaxed",
											children: message.body
										})]
									})
								}, `${message.at}-${index}`))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: sendMessage,
							className: "mt-6 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "message",
								placeholder: "Type your message to the administrator...",
								className: "flex-1 min-h-14 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/40 focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "rounded-2xl bg-amber px-8 py-4 font-bold text-[#0a1628] hover:bg-amber/90 transition-colors flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-paper-plane" }), "Send"]
							})]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { VehicleDetailPage as component };
