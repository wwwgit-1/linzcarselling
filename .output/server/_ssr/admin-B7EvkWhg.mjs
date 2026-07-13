import { o as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { d as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as apiSend, t as apiGet } from "./api-fWyQh8tb.mjs";
import { o as motion } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-B7EvkWhg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CURRENT_USER_KEY = "linz-current-user";
var MAX_STORED_IMAGE_SIZE = 1e3;
var STORED_IMAGE_QUALITY = .72;
function canvasToImageFile(canvas, sourceFile) {
	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				resolve(sourceFile);
				return;
			}
			const name = sourceFile.name.replace(/\.[^.]+$/, "") || "vehicle-image";
			resolve(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
		}, "image/jpeg", STORED_IMAGE_QUALITY);
	});
}
async function prepareImageFile(file) {
	if (!file.type.startsWith("image/")) return file;
	try {
		const image = await createImageBitmap(file);
		const scale = Math.min(1, MAX_STORED_IMAGE_SIZE / Math.max(image.width, image.height));
		const width = Math.max(1, Math.round(image.width * scale));
		const height = Math.max(1, Math.round(image.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) {
			image.close();
			return file;
		}
		context.drawImage(image, 0, 0, width, height);
		image.close();
		return canvasToImageFile(canvas, file);
	} catch {
		return file;
	}
}
function isStorageQuotaError(error) {
	return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22 || error.code === 1014);
}
function AdminPage() {
	const [allowed, setAllowed] = (0, import_react.useState)(false);
	const [users, setUsers] = (0, import_react.useState)({});
	const [vehicles, setVehicles] = (0, import_react.useState)([]);
	const [visitorCount, setVisitorCount] = (0, import_react.useState)(0);
	const [downloadCount, setDownloadCount] = (0, import_react.useState)(0);
	const [cardImageFiles, setCardImageFiles] = (0, import_react.useState)([]);
	const [galleryImageFiles, setGalleryImageFiles] = (0, import_react.useState)([]);
	const [detailsPackageFile, setDetailsPackageFile] = (0, import_react.useState)(null);
	const [uploadError, setUploadError] = (0, import_react.useState)("");
	const [savingVehicle, setSavingVehicle] = (0, import_react.useState)(false);
	const [vpnReport, setVpnReport] = (0, import_react.useState)({
		vpnActive: null,
		vpnLocation: "Not checked",
		actualLocation: "Not checked",
		note: "Run the location check to compare IP-based location with browser geolocation."
	});
	(0, import_react.useEffect)(() => {
		if (JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null")?.role !== "admin") {
			window.location.href = "/";
			return;
		}
		setAllowed(true);
		refreshData();
		const refreshInterval = setInterval(() => {
			Promise.all([apiGet("/api/visitor-count").then((data) => setVisitorCount(data.currentActiveVisitors)), apiGet("/api/download-count").then((data) => setDownloadCount(data.totalDownloads))]).catch(console.error);
		}, 1e4);
		return () => clearInterval(refreshInterval);
	}, []);
	const refreshData = async () => {
		setUsers(await apiGet("/api/users"));
		try {
			setVehicles(await apiGet("/api/vehicles"));
		} catch (error) {
			console.error(error);
			setUploadError("Could not load vehicles from the database.");
		}
		try {
			const visitorData = await apiGet("/api/visitor-count");
			setVisitorCount(visitorData.currentActiveVisitors);
		} catch (error) {
			console.error(error);
		}
		try {
			const downloadData = await apiGet("/api/download-count");
			setDownloadCount(downloadData.totalDownloads);
		} catch (error) {
			console.error(error);
		}
	};
	const saveUsers = (nextUsers) => {
		setUsers(nextUsers);
		apiSend("/api/users", "PUT", nextUsers).catch((error) => {
			console.error(error);
			setUploadError("Could not save user changes to the database.");
		});
	};
	const updateUser = (oldEmail, updates) => {
		const nextUsers = { ...users };
		const user = nextUsers[oldEmail];
		if (!user) return;
		delete nextUsers[oldEmail];
		const updated = {
			...user,
			...updates
		};
		nextUsers[updated.email.toLowerCase()] = updated;
		saveUsers(nextUsers);
	};
	const addVehicle = async (event) => {
		event.preventDefault();
		if (cardImageFiles.length === 0 && galleryImageFiles.length === 0) {
			setUploadError("Add at least one vehicle image before saving.");
			return;
		}
		setUploadError("");
		setSavingVehicle(true);
		try {
			const form = new FormData(event.currentTarget);
			form.delete("cardImages");
			form.delete("galleryImages");
			form.delete("detailsPackage");
			for (const item of cardImageFiles) {
				const prepared = await prepareImageFile(item.file);
				form.append("cardImages", prepared, prepared.name);
			}
			for (const item of galleryImageFiles) {
				const prepared = await prepareImageFile(item.file);
				form.append("galleryImages", prepared, prepared.name);
			}
			if (detailsPackageFile) form.append("detailsPackage", detailsPackageFile, detailsPackageFile.name);
			const response = await fetch("/api/vehicles", {
				method: "POST",
				body: form
			});
			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				throw new Error(payload?.error ?? `Vehicle upload failed with ${response.status}`);
			}
			const nextVehicles = [await response.json(), ...vehicles];
			setVehicles(nextVehicles);
			event.currentTarget.reset();
			clearSelectedImages();
			setDetailsPackageFile(null);
			setUploadError("");
		} catch (error) {
			console.error(error);
			setUploadError(isStorageQuotaError(error) ? "The vehicle was not saved because browser storage is full. Try fewer images, smaller images, or remove an old vehicle first." : error instanceof Error ? error.message : "The vehicle was not saved because the selected files could not be processed. Try different image files.");
		} finally {
			setSavingVehicle(false);
		}
	};
	const addCardImages = (files) => {
		if (!files) return;
		const selected = Array.from(files).map((file) => ({
			file,
			previewUrl: URL.createObjectURL(file)
		}));
		setCardImageFiles((currentFiles) => [...currentFiles, ...selected]);
		setUploadError("");
	};
	const addGalleryImages = (files) => {
		if (!files?.length) return;
		const file = files[0];
		setGalleryImageFiles((currentFiles) => {
			currentFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
			return [{
				file,
				previewUrl: URL.createObjectURL(file)
			}];
		});
		setUploadError("");
	};
	const removeCardImage = (index) => {
		setCardImageFiles((current) => {
			const removed = current[index];
			if (removed) URL.revokeObjectURL(removed.previewUrl);
			return current.filter((_, i) => i !== index);
		});
	};
	const removeGalleryImage = (index) => {
		setGalleryImageFiles((current) => {
			const removed = current[index];
			if (removed) URL.revokeObjectURL(removed.previewUrl);
			return current.filter((_, i) => i !== index);
		});
	};
	const clearSelectedImages = () => {
		cardImageFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
		galleryImageFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
		setCardImageFiles([]);
		setGalleryImageFiles([]);
	};
	const removeVehicle = async (id) => {
		try {
			const response = await apiSend(`/api/vehicles/${id}`, "DELETE");
			if (response.ok) {
				const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== id);
				setVehicles(nextVehicles);
				setUploadError("");
			} else setUploadError(response.error || "Could not remove the vehicle from the database.");
		} catch (error) {
			console.error("Delete error:", error);
			const errorMessage = error instanceof Error ? error.message : "Could not remove the vehicle from the database.";
			setUploadError(errorMessage);
		}
	};
	const checkVpn = async () => {
		setVpnReport((report) => ({
			...report,
			note: "Checking IP and browser geolocation..."
		}));
		let vpnLocation = "Unavailable";
		let vpnActive = null;
		try {
			const data = await (await fetch("https://ipwho.is/?security=1")).json();
			vpnLocation = [
				data.city,
				data.region,
				data.country
			].filter(Boolean).join(", ") || "Unknown IP location";
			vpnActive = Boolean(data.security?.vpn || data.security?.proxy || data.security?.tor);
		} catch {
			vpnLocation = "IP lookup failed";
		}
		if (!navigator.geolocation) {
			setVpnReport({
				vpnActive,
				vpnLocation,
				actualLocation: "Browser geolocation unavailable",
				note: "VPN detection uses IP intelligence; actual location requires browser geolocation permission."
			});
			return;
		}
		navigator.geolocation.getCurrentPosition((position) => {
			const report = {
				vpnActive,
				vpnLocation,
				actualLocation: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
				note: "Actual location is browser GPS/network geolocation. IP location can reflect VPN exit location."
			};
			setVpnReport(report);
			saveCurrentUserLocationReport(report);
		}, () => {
			const report = {
				vpnActive,
				vpnLocation,
				actualLocation: "Permission denied or unavailable",
				note: "Actual location requires user permission. VPN status is inferred from IP intelligence."
			};
			setVpnReport(report);
			saveCurrentUserLocationReport(report);
		}, {
			enableHighAccuracy: false,
			timeout: 1e4
		});
	};
	const saveCurrentUserLocationReport = (report) => {
		const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null");
		if (!current) return;
		const nextUsers = { ...users };
		const user = nextUsers[current.email.toLowerCase()];
		if (!user) return;
		nextUsers[current.email.toLowerCase()] = {
			...user,
			vpnActive: report.vpnActive,
			vpnLocation: report.vpnLocation,
			actualLocation: report.actualLocation,
			lastSeen: (/* @__PURE__ */ new Date()).toISOString()
		};
		saveUsers(nextUsers);
	};
	if (!allowed) return null;
	if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin/users/")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "admin-page min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#172033] sm:px-6 lg:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-[1760px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "admin-shell-header flex flex-wrap items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-bold uppercase tracking-[0.3em] text-[#b87913]",
							children: "Administrator"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-4xl font-bold",
									children: "Linz Control Room"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-full bg-[#e8a838] px-4 py-1 text-sm font-bold text-[#0a1628]",
									children: [visitorCount, " Visitors"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-full bg-[#172033] px-4 py-1 text-sm font-bold text-white",
									children: [downloadCount, " Downloads"]
								})
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/",
							className: "rounded-full bg-[#172033] px-5 py-2 font-bold text-white shadow-sm",
							children: "Back to site"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminPanel, {
							title: "Users, Location, and Account Management",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: checkVpn,
									className: "rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]",
									children: "Record Current Visitor VPN/Location"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65",
									children: vpnReport.note
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-5 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full min-w-[1180px] border-separate border-spacing-y-2 text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "text-xs uppercase tracking-wider text-white/45",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "User"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Email"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Password"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Country"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Residence"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "VPN"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "VPN Location"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Actual Location"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Download Status"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2",
													children: "Activity"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: Object.values(users).map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "bg-white/[0.055] align-top",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "rounded-l-xl px-3 py-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "font-semibold",
														children: user.username
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-xs uppercase tracking-wider text-white/40",
														children: user.role ?? "user"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														value: user.email,
														onChange: (event) => updateUser(user.email, { email: event.target.value }),
														className: "admin-field min-w-56"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														value: user.password,
														onChange: (event) => updateUser(user.email, { password: event.target.value }),
														className: "admin-field min-w-40"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														value: user.country ?? "",
														onChange: (event) => updateUser(user.email, { country: event.target.value }),
														className: "admin-field min-w-36"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														value: user.location ?? "",
														onChange: (event) => updateUser(user.email, { location: event.target.value }),
														className: "admin-field min-w-40"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: user.vpnActive == null ? "Unknown" : user.vpnActive ? "Active" : "No"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3 text-white/65",
													children: user.vpnLocation ?? "Not recorded"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3 text-white/65",
													children: user.actualLocation ?? "Not recorded"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-3 py-3",
													children: user.downloads && user.downloads.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-green-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-xs text-green-400",
															children: [user.downloads.length, " downloaded"]
														})]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-red-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs text-red-400",
															children: "None"
														})]
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "rounded-r-xl px-3 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: `/admin/users/${encodeURIComponent(user.email)}`,
														className: "rounded-full border border-[#e8a838]/50 px-3 py-1.5 text-[#e8a838] hover:bg-[#e8a838] hover:text-[#0a1628]",
														children: "VIEW"
													})
												})
											]
										}, user.email)) })]
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-5 grid gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPanel, {
							title: "Add Vehicle",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: addVehicle,
								encType: "multipart/form-data",
								className: "grid gap-4 grid-cols-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "vehicle",
										placeholder: "Vehicle",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "price",
										type: "number",
										placeholder: "Price",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "weeklyRepayment",
										type: "number",
										placeholder: "Weekly Repayment",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "make",
										placeholder: "Make",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "model",
										placeholder: "Model",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "bodyType",
										placeholder: "Body Type",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "year",
										placeholder: "Year",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "condition",
										placeholder: "Condition",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "fuelType",
										placeholder: "Fuel Type",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "cylinders",
										placeholder: "Cylinders",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "driveType",
										placeholder: "Drive Type",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "engineType",
										placeholder: "Engine Type",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "capacityCc",
										placeholder: "Capacity/CC",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "power",
										placeholder: "Power",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "torque",
										placeholder: "Torque",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "releaseDate",
										type: "date",
										placeholder: "Release Date",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "buildDate",
										type: "date",
										placeholder: "Build Date",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "complianceDate",
										type: "date",
										placeholder: "Compliance Date",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "modelYear",
										placeholder: "Model Year",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "mileage",
										type: "number",
										placeholder: "Mileage",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "color",
										placeholder: "Color",
										className: "admin-field"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
										initial: {
											opacity: 0,
											scale: .95
										},
										animate: {
											opacity: 1,
											scale: 1
										},
										transition: { duration: .4 },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]",
												children: "Card Display Images"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
												whileHover: {
													scale: 1.01,
													borderColor: "rgba(232,168,56,0.6)"
												},
												className: "relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm",
												onDragOver: (e) => {
													e.preventDefault();
													e.currentTarget.classList.add("border-[#e8a838]", "bg-[#fff9ed]");
												},
												onDragLeave: (e) => {
													e.preventDefault();
													e.currentTarget.classList.remove("border-[#e8a838]", "bg-[#fff9ed]");
												},
												onDrop: (e) => {
													e.preventDefault();
													e.currentTarget.classList.remove("border-[#e8a838]", "bg-[#fff9ed]");
													const files = e.dataTransfer.files;
													if (files.length > 0) addCardImages(files);
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													name: "cardImages",
													type: "file",
													accept: "image/*",
													multiple: true,
													className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
													onChange: (event) => {
														addCardImages(event.currentTarget.files);
														event.currentTarget.value = "";
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-center",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
															animate: { y: [
																0,
																-5,
																0
															] },
															transition: {
																duration: 2,
																repeat: Infinity,
																ease: "easeInOut"
															},
															className: "mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-cloud-arrow-up text-[#e8a838] text-2xl" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm font-semibold text-[#172033]",
															children: cardImageFiles.length > 0 ? `${cardImageFiles.length} image${cardImageFiles.length > 1 ? "s" : ""} selected` : "Drop images here or click to upload"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-[#8a95a8] mt-2",
															children: "PNG, JPG up to 8MB each"
														})
													]
												})]
											}),
											cardImageFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
												initial: {
													opacity: 0,
													y: 10
												},
												animate: {
													opacity: 1,
													y: 0
												},
												className: "mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
												children: cardImageFiles.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
													initial: {
														opacity: 0,
														scale: .8
													},
													animate: {
														opacity: 1,
														scale: 1
													},
													transition: { delay: index * .05 },
													whileHover: {
														scale: 1.05,
														rotate: 2
													},
													className: "group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: item.previewUrl,
															alt: item.file.name,
															className: "h-full w-full object-cover"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
															whileHover: { scale: 1.1 },
															whileTap: { scale: .9 },
															type: "button",
															onClick: () => removeCardImage(index),
															className: "absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-xmark" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity",
															children: item.file.name
														})
													]
												}, `${item.file.name}-${index}`))
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
										initial: {
											opacity: 0,
											scale: .95
										},
										animate: {
											opacity: 1,
											scale: 1
										},
										transition: {
											duration: .4,
											delay: .1
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]",
												children: "Details ZIP Package"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
												whileHover: {
													scale: 1.01,
													borderColor: "rgba(232,168,56,0.6)"
												},
												className: "relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													name: "detailsPackage",
													type: "file",
													accept: ".zip,application/zip,application/x-zip-compressed",
													className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
													onChange: (event) => {
														setDetailsPackageFile(event.currentTarget.files?.[0] ?? null);
														event.currentTarget.value = "";
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-center",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
															animate: { rotate: [
																0,
																5,
																-5,
																0
															] },
															transition: {
																duration: 3,
																repeat: Infinity,
																ease: "easeInOut"
															},
															className: "mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-file-zipper text-[#e8a838] text-2xl" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm font-semibold text-[#172033]",
															children: detailsPackageFile ? detailsPackageFile.name : "Drop ZIP file here or click to upload"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-[#8a95a8] mt-2",
															children: "ZIP files only, up to 8MB"
														})
													]
												})]
											}),
											detailsPackageFile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
												initial: {
													opacity: 0,
													scale: .9
												},
												animate: {
													opacity: 1,
													scale: 1
												},
												className: "mt-3 flex items-center gap-3 p-4 bg-gradient-to-r from-amber/10 to-amber/5 rounded-2xl border border-amber/30 shadow-lg",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-10 w-10 rounded-full bg-amber/20 flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-file-zipper text-amber" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm font-semibold text-[#172033] flex-1 truncate",
														children: detailsPackageFile.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
														whileHover: { scale: 1.1 },
														whileTap: { scale: .9 },
														type: "button",
														onClick: () => setDetailsPackageFile(null),
														className: "h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-xmark" })
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
										initial: {
											opacity: 0,
											scale: .95
										},
										animate: {
											opacity: 1,
											scale: 1
										},
										transition: {
											duration: .4,
											delay: .2
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]",
												children: "Detailed View Image"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
												whileHover: {
													scale: 1.01,
													borderColor: "rgba(232,168,56,0.6)"
												},
												className: "relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													name: "galleryImages",
													type: "file",
													accept: "image/*",
													className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
													onChange: (event) => {
														addGalleryImages(event.currentTarget.files);
														event.currentTarget.value = "";
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-center",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
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
															className: "mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-image text-[#e8a838] text-2xl" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm font-semibold text-[#172033]",
															children: galleryImageFiles.length > 0 ? `${galleryImageFiles.length} image${galleryImageFiles.length > 1 ? "s" : ""} selected` : "Drop image here or click to upload"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-[#8a95a8] mt-2",
															children: "PNG, JPG up to 8MB"
														})
													]
												})]
											}),
											galleryImageFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
												initial: {
													opacity: 0,
													y: 10
												},
												animate: {
													opacity: 1,
													y: 0
												},
												className: "mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
												children: galleryImageFiles.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
													initial: {
														opacity: 0,
														scale: .8
													},
													animate: {
														opacity: 1,
														scale: 1
													},
													transition: { delay: index * .05 },
													whileHover: {
														scale: 1.05,
														rotate: -2
													},
													className: "group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: item.previewUrl,
															alt: item.file.name,
															className: "h-full w-full object-cover"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
															whileHover: { scale: 1.1 },
															whileTap: { scale: .9 },
															type: "button",
															onClick: () => removeGalleryImage(index),
															className: "absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-xmark" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity",
															children: item.file.name
														})
													]
												}, `${item.file.name}-${index}`))
											})
										]
									}),
									uploadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "admin-upload-error",
										children: uploadError
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										name: "specs",
										required: true,
										rows: 4,
										placeholder: "Detailed specifications for AI training: engine, drivetrain, seats, fuel type, range, features, ideal buyer...",
										className: "admin-field resize-none"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										name: "tag",
										className: "admin-field",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "PREMIUM" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "NEW" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: savingVehicle,
										className: "rounded-full bg-[#e8a838] py-3 font-bold text-[#0a1628] disabled:cursor-wait disabled:opacity-65",
										children: savingVehicle ? "Uploading..." : "Add to Handpicked Machines"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPanel, {
							title: "Current Vehicles",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
										className: "text-xs uppercase tracking-wider text-white/45",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Vehicle"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Key Specs"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Mileage"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Year"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Images"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Status"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2",
												children: "Action"
											})
										] })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: vehicles.map((vehicle) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "bg-white/[0.055] align-top",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "rounded-l-xl px-3 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: vehicle.image,
														alt: "",
														className: "h-14 w-20 rounded-lg object-cover"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "font-semibold",
														children: vehicle.vehicle || vehicle.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-xs text-white/45",
														children: [
															vehicle.color,
															" · ",
															vehicle.tag
														]
													})] })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-xs space-y-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-white/45",
																children: "Make:"
															}),
															" ",
															vehicle.make || "-"
														] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-white/45",
																children: "Model:"
															}),
															" ",
															vehicle.model
														] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-white/45",
																children: "Body:"
															}),
															" ",
															vehicle.bodyType || "-"
														] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-white/45",
																children: "Fuel:"
															}),
															" ",
															vehicle.fuelType || "-"
														] })
													]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-3 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "font-semibold",
													children: ["€ ", vehicle.price.toLocaleString()]
												}), vehicle.weeklyRepayment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-xs text-white/60",
													children: [
														"€ ",
														vehicle.weeklyRepayment.toLocaleString(),
														"/wk"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-3 py-3",
												children: [vehicle.mileage.toLocaleString(), " km"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-3",
												children: vehicle.year || vehicle.modelYear || "-"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-3 text-white/60",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-xs",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Card: ", vehicle.images?.length ?? (vehicle.image ? 1 : 0)] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Gallery: ", vehicle.galleryImages?.length ?? 0] }),
														vehicle.detailsPackage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-[#e8a838]",
															children: "ZIP: ✓"
														})
													]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${vehicle.tag === "PREMIUM" ? "bg-[#e8a838] text-[#0a1628]" : "bg-white/10 text-white"}`,
													children: vehicle.tag
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "rounded-r-xl px-3 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => removeVehicle(vehicle.id),
													className: "rounded-full border border-red-400/30 px-4 py-1.5 text-sm text-red-100 hover:bg-red-500/15 transition-colors",
													children: "Remove"
												})
											})
										]
									}, vehicle.id)) })]
								})
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .admin-page {
          color: #172033;
        }
        .admin-shell-header {
          border: 1px solid #e3e8f0;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 18px 50px rgba(23, 32, 51, 0.08);
          padding: 1.35rem;
        }
        .admin-page .admin-panel {
          border: 1px solid #e3e8f0;
          background: #ffffff;
          color: #172033;
          box-shadow: 0 12px 35px rgba(23, 32, 51, 0.07);
        }
        .admin-page .admin-panel h2 {
          color: #172033;
        }
        .admin-page table {
          border-spacing: 0 0.55rem;
        }
        .admin-page thead {
          color: #667085;
        }
        .admin-page tbody tr {
          background: #f8fafc !important;
          box-shadow: inset 0 0 0 1px #e8edf5;
        }
        .admin-page tbody td {
          color: #263247;
        }
        .admin-page tbody td .text-white\\/45,
        .admin-page tbody td .text-white\\/60,
        .admin-page tbody td .text-white\\/65,
        .admin-page tbody td .text-white\\/80,
        .admin-page tbody div[class*="text-white/"] {
          color: #667085 !important;
        }
        .admin-page tbody .font-semibold,
        .admin-page tbody .font-bold {
          color: #172033;
        }
        .admin-page a.rounded-full,
        .admin-page button.rounded-full {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .admin-page a.rounded-full:hover,
        .admin-page button.rounded-full:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(23, 32, 51, 0.12);
        }
        .admin-field {
          width: 100%;
          border: 1px solid #d7dee9;
          border-radius: 10px;
          background: #ffffff;
          color: #172033;
          padding: 0.75rem 0.9rem;
          outline: none;
        }
        .admin-field::placeholder {
          color: #8a95a8;
        }
        .admin-field:focus {
          border-color: #e8a838;
          box-shadow: 0 0 0 4px rgba(232,168,56,0.14);
        }
        .admin-file-field {
          width: 100%;
          border: 1px dashed #c8d2e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #172033;
          display: flex;
          min-height: 138px;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.9rem;
        }
        .admin-file-field span {
          display: block;
          margin-bottom: 0.65rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #667085;
        }
        .admin-file-control {
          display: grid;
          min-height: 46px;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #d7dee9;
          background: #ffffff;
          padding: 0.55rem;
          color: #344054;
        }
        .admin-file-button {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: #172033;
          color: #ffffff;
          padding: 0.45rem 0.8rem;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .admin-file-summary {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.88rem;
          color: #667085;
        }
        .admin-file-native {
          position: absolute;
          height: 1px;
          width: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }
        .admin-file-list {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          align-content: flex-start;
          min-height: 30px;
        }
        .admin-file-pill {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-radius: 999px;
          border: 1px solid rgba(232,168,56,0.28);
          background: rgba(232,168,56,0.12);
          padding: 0.35rem 0.65rem;
          font-size: 0.78rem;
          color: #7a4f08;
        }
        .admin-file-empty {
          margin-top: 0.75rem;
          display: flex;
          min-height: 30px;
          align-items: center;
          font-size: 0.78rem;
          color: #8a95a8;
        }
        .admin-upload-error {
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          padding: 0.75rem 0.9rem;
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 600;
        }
      ` })
		]
	});
}
function AdminPanel({ title, className = "", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
		initial: {
			opacity: 0,
			y: 20
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .5,
			ease: "easeOut"
		},
		className: `admin-panel rounded-3xl p-6 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.h2, {
			initial: {
				opacity: 0,
				x: -10
			},
			animate: {
				opacity: 1,
				x: 0
			},
			transition: {
				duration: .4,
				delay: .1
			},
			className: "mb-5 font-display text-2xl font-bold flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "fa-solid fa-gear text-white" })
			}), title]
		}), children]
	});
}
//#endregion
export { AdminPage as component };
