import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { apiGet, apiSend } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Role = "admin" | "user";

interface StoredUser {
  email: string;
  username: string;
  password: string;
  avatar: string;
  location?: string;
  country?: string;
  role?: Role;
  vpnActive?: boolean | null;
  vpnLocation?: string;
  actualLocation?: string;
  lastSeen?: string;
  downloads?: Array<{
    vehicleId: number;
    vehicleName: string;
    timestamp: string;
    completed: boolean;
  }>;
}

interface Vehicle {
  id: number;
  name: string;
  model: string;
  price: number;
  mileage: number;
  tag: "NEW" | "PREMIUM";
  image: string;
  images?: string[];
  galleryImages?: string[];
  color: string;
  specs?: string;
  vehicle?: string;
  weeklyRepayment?: number;
  make?: string;
  bodyType?: string;
  year?: string;
  condition?: string;
  fuelType?: string;
  cylinders?: string;
  driveType?: string;
  engineType?: string;
  capacityCc?: string;
  power?: string;
  torque?: string;
  releaseDate?: string;
  buildDate?: string;
  complianceDate?: string;
  modelYear?: string;
  detailsPackage?: {
    name: string;
    size: number;
    dataUrl?: string;
    url?: string;
  };
}

type SelectedFile = {
  file: File;
  previewUrl: string;
};

interface VpnReport {
  vpnActive: boolean | null;
  vpnLocation: string;
  actualLocation: string;
  note: string;
}

interface ActivityItem {
  action: string;
  detail: string;
  user: string;
  at: string;
}

const CURRENT_USER_KEY = "linz-current-user";
const MAX_STORED_IMAGE_SIZE = 1000;
const STORED_IMAGE_QUALITY = 0.72;

function getFileNames(files: SelectedFile[]) {
  return files.map((file) => file.file.name);
}

function canvasToImageFile(canvas: HTMLCanvasElement, sourceFile: File) {
  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(sourceFile);
          return;
        }

        const name = sourceFile.name.replace(/\.[^.]+$/, "") || "vehicle-image";
        resolve(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      STORED_IMAGE_QUALITY,
    );
  });
}

async function prepareImageFile(file: File) {
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

function isStorageQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<Record<string, StoredUser>>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [cardImageFiles, setCardImageFiles] = useState<SelectedFile[]>([]);
  const [galleryImageFiles, setGalleryImageFiles] = useState<SelectedFile[]>([]);
  const [detailsPackageFile, setDetailsPackageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vpnReport, setVpnReport] = useState<VpnReport>({
    vpnActive: null,
    vpnLocation: "Not checked",
    actualLocation: "Not checked",
    note: "Run the location check to compare IP-based location with browser geolocation.",
  });

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as StoredUser | null;
    if (current?.role !== "admin") {
      window.location.href = "/";
      return;
    }
    setAllowed(true);
    void refreshData();
    
    // Set up periodic refresh for real-time visitor count and download count
    const refreshInterval = setInterval(() => {
      Promise.all([
        apiGet<{ currentActiveVisitors: number; registeredUsers: number; guests: number }>("/api/visitor-count")
          .then(data => setVisitorCount(data.currentActiveVisitors)),
        apiGet<{ totalDownloads: number; registeredDownloads: number; anonymousDownloads: number }>("/api/download-count")
          .then(data => setDownloadCount(data.totalDownloads))
      ]).catch(console.error);
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const refreshData = async () => {
    setUsers(await apiGet<Record<string, StoredUser>>("/api/users"));
    try {
      setVehicles(await apiGet<Vehicle[]>("/api/vehicles"));
    } catch (error) {
      console.error(error);
      setUploadError("Could not load vehicles from the database.");
    }
    try {
      const visitorData = await apiGet<{ currentActiveVisitors: number; registeredUsers: number; guests: number }>("/api/visitor-count");
      setVisitorCount(visitorData.currentActiveVisitors);
    } catch (error) {
      console.error(error);
      // Don't show error for visitor count, just default to 0
    }
    try {
      const downloadData = await apiGet<{ totalDownloads: number; registeredDownloads: number; anonymousDownloads: number }>("/api/download-count");
      setDownloadCount(downloadData.totalDownloads);
    } catch (error) {
      console.error(error);
      // Don't show error for download count, just default to 0
    }
  };

  const saveUsers = (nextUsers: Record<string, StoredUser>) => {
    setUsers(nextUsers);
    void apiSend<Record<string, StoredUser>>("/api/users", "PUT", nextUsers)
      .catch((error) => {
        console.error(error);
        setUploadError("Could not save user changes to the database.");
      });
  };

  const updateUser = (oldEmail: string, updates: Partial<StoredUser>) => {
    const nextUsers = { ...users };
    const user = nextUsers[oldEmail];
    if (!user) return;
    delete nextUsers[oldEmail];
    const updated = { ...user, ...updates };
    nextUsers[updated.email.toLowerCase()] = updated;
    saveUsers(nextUsers);
  };

  const addVehicle = async (event: FormEvent<HTMLFormElement>) => {
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
      if (detailsPackageFile) {
        form.append("detailsPackage", detailsPackageFile, detailsPackageFile.name);
      }

      const response = await fetch("/api/vehicles", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Vehicle upload failed with ${response.status}`);
      }

      const vehicle = (await response.json()) as Vehicle;
      const nextVehicles = [vehicle, ...vehicles];
      setVehicles(nextVehicles);
      event.currentTarget.reset();
      clearSelectedImages();
      setDetailsPackageFile(null);
      setUploadError("");
    } catch (error) {
      console.error(error);
      setUploadError(
        isStorageQuotaError(error)
          ? "The vehicle was not saved because browser storage is full. Try fewer images, smaller images, or remove an old vehicle first."
          : error instanceof Error
            ? error.message
            : "The vehicle was not saved because the selected files could not be processed. Try different image files.",
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  const addCardImages = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setCardImageFiles((currentFiles) => [...currentFiles, ...selected]);
    setUploadError("");
  };

  const addGalleryImages = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setGalleryImageFiles((currentFiles) => {
      currentFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [{ file, previewUrl: URL.createObjectURL(file) }];
    });
    setUploadError("");
  };

  const removeCardImage = (index: number) => {
    setCardImageFiles((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const removeGalleryImage = (index: number) => {
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

  const removeVehicle = async (id: number) => {
    try {
      const response = await apiSend<{ ok: boolean; error?: string; remainingCount?: number }>(`/api/vehicles/${id}`, "DELETE");
      if (response.ok) {
        const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== id);
        setVehicles(nextVehicles);
        setUploadError("");
      } else {
        setUploadError(response.error || "Could not remove the vehicle from the database.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not remove the vehicle from the database.";
      setUploadError(errorMessage);
    }
  };

  const checkVpn = async () => {
    setVpnReport((report) => ({ ...report, note: "Checking IP and browser geolocation..." }));
    let vpnLocation = "Unavailable";
    let vpnActive: boolean | null = null;
    try {
      const response = await fetch("https://ipwho.is/?security=1");
      const data = await response.json();
      vpnLocation = [data.city, data.region, data.country].filter(Boolean).join(", ") || "Unknown IP location";
      vpnActive = Boolean(data.security?.vpn || data.security?.proxy || data.security?.tor);
    } catch {
      vpnLocation = "IP lookup failed";
    }

    if (!navigator.geolocation) {
      setVpnReport({
        vpnActive,
        vpnLocation,
        actualLocation: "Browser geolocation unavailable",
        note: "VPN detection uses IP intelligence; actual location requires browser geolocation permission.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const report = {
          vpnActive,
          vpnLocation,
          actualLocation: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          note: "Actual location is browser GPS/network geolocation. IP location can reflect VPN exit location.",
        };
        setVpnReport(report);
        saveCurrentUserLocationReport(report);
      },
      () => {
        const report = {
          vpnActive,
          vpnLocation,
          actualLocation: "Permission denied or unavailable",
          note: "Actual location requires user permission. VPN status is inferred from IP intelligence.",
        };
        setVpnReport(report);
        saveCurrentUserLocationReport(report);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const saveCurrentUserLocationReport = (report: VpnReport) => {
    const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as StoredUser | null;
    if (!current) return;
    const nextUsers = { ...users };
    const user = nextUsers[current.email.toLowerCase()];
    if (!user) return;
    nextUsers[current.email.toLowerCase()] = {
      ...user,
      vpnActive: report.vpnActive,
      vpnLocation: report.vpnLocation,
      actualLocation: report.actualLocation,
      lastSeen: new Date().toISOString(),
    };
    saveUsers(nextUsers);
  };

  if (!allowed) return null;

  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin/users/")) {
    return <Outlet />;
  }

  return (
    <main className="admin-page min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#172033] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1760px]">
        <div className="admin-shell-header flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#b87913]">Administrator</div>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold">Linz Control Room</h1>
              <div className="rounded-full bg-[#e8a838] px-4 py-1 text-sm font-bold text-[#0a1628]">
                {visitorCount} Visitors
              </div>
              <div className="rounded-full bg-[#172033] px-4 py-1 text-sm font-bold text-white">
                {downloadCount} Downloads
              </div>
            </div>
          </div>
          <a href="/" className="rounded-full bg-[#172033] px-5 py-2 font-bold text-white shadow-sm">
            Back to site
          </a>
        </div>

        <section className="mt-8">
          <AdminPanel title="Users, Location, and Account Management">
            <button onClick={checkVpn} className="rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]">
              Record Current Visitor VPN/Location
            </button>
            <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65">{vpnReport.note}</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1180px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Password</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Residence</th>
                    <th className="px-3 py-2">VPN</th>
                    <th className="px-3 py-2">VPN Location</th>
                    <th className="px-3 py-2">Actual Location</th>
                    <th className="px-3 py-2">Download Status</th>
                    <th className="px-3 py-2">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(users).map((user) => (
                    <tr key={user.email} className="bg-white/[0.055] align-top">
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-xs uppercase tracking-wider text-white/40">{user.role ?? "user"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <input value={user.email} onChange={(event) => updateUser(user.email, { email: event.target.value })} className="admin-field min-w-56" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={user.password} onChange={(event) => updateUser(user.email, { password: event.target.value })} className="admin-field min-w-40" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={user.country ?? ""} onChange={(event) => updateUser(user.email, { country: event.target.value })} className="admin-field min-w-36" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={user.location ?? ""} onChange={(event) => updateUser(user.email, { location: event.target.value })} className="admin-field min-w-40" />
                      </td>
                      <td className="px-3 py-3">{user.vpnActive == null ? "Unknown" : user.vpnActive ? "Active" : "No"}</td>
                      <td className="px-3 py-3 text-white/65">{user.vpnLocation ?? "Not recorded"}</td>
                      <td className="px-3 py-3 text-white/65">{user.actualLocation ?? "Not recorded"}</td>
                      <td className="px-3 py-3">
                        {user.downloads && user.downloads.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                            <span className="text-xs text-green-400">{user.downloads.length} downloaded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="text-xs text-red-400">None</span>
                          </div>
                        )}
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <a href={`/admin/users/${encodeURIComponent(user.email)}`} className="rounded-full border border-[#e8a838]/50 px-3 py-1.5 text-[#e8a838] hover:bg-[#e8a838] hover:text-[#0a1628]">
                          VIEW
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </section>

        <section className="mt-5 grid gap-5">
          <AdminPanel title="Add Vehicle">
            <form onSubmit={addVehicle} encType="multipart/form-data" className="grid gap-4 grid-cols-1">
              <input name="vehicle" placeholder="Vehicle" className="admin-field" />
              <input name="price" type="number" placeholder="Price" className="admin-field" />
              <input name="weeklyRepayment" type="number" placeholder="Weekly Repayment" className="admin-field" />
              <input name="make" placeholder="Make" className="admin-field" />
              <input name="model" placeholder="Model" className="admin-field" />
              <input name="bodyType" placeholder="Body Type" className="admin-field" />
              <input name="year" placeholder="Year" className="admin-field" />
              <input name="condition" placeholder="Condition" className="admin-field" />
              <input name="fuelType" placeholder="Fuel Type" className="admin-field" />
              <input name="cylinders" placeholder="Cylinders" className="admin-field" />
              <input name="driveType" placeholder="Drive Type" className="admin-field" />
              <input name="engineType" placeholder="Engine Type" className="admin-field" />
              <input name="capacityCc" placeholder="Capacity/CC" className="admin-field" />
              <input name="power" placeholder="Power" className="admin-field" />
              <input name="torque" placeholder="Torque" className="admin-field" />
              <input name="releaseDate" type="date" placeholder="Release Date" className="admin-field" />
              <input name="buildDate" type="date" placeholder="Build Date" className="admin-field" />
              <input name="complianceDate" type="date" placeholder="Compliance Date" className="admin-field" />
              <input name="modelYear" placeholder="Model Year" className="admin-field" />
              <input name="mileage" type="number" placeholder="Mileage" className="admin-field" />
              <input name="color" placeholder="Color" className="admin-field" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Card Display Images
                </label>
                <motion.div
                  whileHover={{ scale: 1.01, borderColor: "rgba(232,168,56,0.6)" }}
                  className="relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#e8a838]', 'bg-[#fff9ed]'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#e8a838]', 'bg-[#fff9ed]'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-[#e8a838]', 'bg-[#fff9ed]');
                    const files = e.dataTransfer.files;
                    if (files.length > 0) addCardImages(files);
                  }}
                >
                  <input
                    name="cardImages"
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(event) => {
                      addCardImages(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="text-center">
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20"
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-[#e8a838] text-2xl" />
                    </motion.div>
                    <p className="text-sm font-semibold text-[#172033]">
                      {cardImageFiles.length > 0 ? `${cardImageFiles.length} image${cardImageFiles.length > 1 ? 's' : ''} selected` : 'Drop images here or click to upload'}
                    </p>
                    <p className="text-xs text-[#8a95a8] mt-2">PNG, JPG up to 8MB each</p>
                  </div>
                </motion.div>
                {cardImageFiles.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                  >
                    {cardImageFiles.map((item, index) => (
                      <motion.div 
                        key={`${item.file.name}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg"
                      >
                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeCardImage(index)}
                          className="absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl"
                        >
                          <i className="fa-solid fa-xmark" />
                        </motion.button>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.file.name}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Details ZIP Package
                </label>
                <motion.div
                  whileHover={{ scale: 1.01, borderColor: "rgba(232,168,56,0.6)" }}
                  className="relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm"
                >
                  <input
                    name="detailsPackage"
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(event) => {
                      setDetailsPackageFile(event.currentTarget.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="text-center">
                    <motion.div 
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20"
                    >
                      <i className="fa-solid fa-file-zipper text-[#e8a838] text-2xl" />
                    </motion.div>
                    <p className="text-sm font-semibold text-[#172033]">
                      {detailsPackageFile ? detailsPackageFile.name : 'Drop ZIP file here or click to upload'}
                    </p>
                    <p className="text-xs text-[#8a95a8] mt-2">ZIP files only, up to 8MB</p>
                  </div>
                </motion.div>
                {detailsPackageFile && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 flex items-center gap-3 p-4 bg-gradient-to-r from-amber/10 to-amber/5 rounded-2xl border border-amber/30 shadow-lg"
                  >
                    <div className="h-10 w-10 rounded-full bg-amber/20 flex items-center justify-center">
                      <i className="fa-solid fa-file-zipper text-amber" />
                    </div>
                    <span className="text-sm font-semibold text-[#172033] flex-1 truncate">{detailsPackageFile.name}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setDetailsPackageFile(null)}
                      className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >
                      <i className="fa-solid fa-xmark" />
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Detailed View Image
                </label>
                <motion.div
                  whileHover={{ scale: 1.01, borderColor: "rgba(232,168,56,0.6)" }}
                  className="relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm"
                >
                  <input
                    name="galleryImages"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(event) => {
                      addGalleryImages(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="text-center">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20"
                    >
                      <i className="fa-solid fa-image text-[#e8a838] text-2xl" />
                    </motion.div>
                    <p className="text-sm font-semibold text-[#172033]">
                      {galleryImageFiles.length > 0 ? `${galleryImageFiles.length} image${galleryImageFiles.length > 1 ? 's' : ''} selected` : 'Drop image here or click to upload'}
                    </p>
                    <p className="text-xs text-[#8a95a8] mt-2">PNG, JPG up to 8MB</p>
                  </div>
                </motion.div>
                {galleryImageFiles.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                  >
                    {galleryImageFiles.map((item, index) => (
                      <motion.div 
                        key={`${item.file.name}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg"
                      >
                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl"
                        >
                          <i className="fa-solid fa-xmark" />
                        </motion.button>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.file.name}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
              {uploadError && (
                <div className="admin-upload-error">
                  {uploadError}
                </div>
              )}
              <textarea
                name="specs"
                required
                rows={4}
                placeholder="Detailed specifications for AI training: engine, drivetrain, seats, fuel type, range, features, ideal buyer..."
                className="admin-field resize-none"
              />
              <select name="tag" className="admin-field">
                <option>PREMIUM</option>
                <option>NEW</option>
              </select>
              <button
                type="submit"
                disabled={savingVehicle}
                className="rounded-full bg-[#e8a838] py-3 font-bold text-[#0a1628] disabled:cursor-wait disabled:opacity-65"
              >
                {savingVehicle ? "Uploading..." : "Add to Handpicked Machines"}
              </button>
            </form>
          </AdminPanel>

          <AdminPanel title="Current Vehicles">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Key Specs</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Mileage</th>
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Images</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="bg-white/[0.055] align-top">
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="flex items-center gap-3">
                          <img src={vehicle.image} alt="" className="h-14 w-20 rounded-lg object-cover" />
                          <div>
                            <div className="font-semibold">{vehicle.vehicle || vehicle.name}</div>
                            <div className="text-xs text-white/45">{vehicle.color} · {vehicle.tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs space-y-1">
                          <div><span className="text-white/45">Make:</span> {vehicle.make || "-"}</div>
                          <div><span className="text-white/45">Model:</span> {vehicle.model}</div>
                          <div><span className="text-white/45">Body:</span> {vehicle.bodyType || "-"}</div>
                          <div><span className="text-white/45">Fuel:</span> {vehicle.fuelType || "-"}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold">€ {vehicle.price.toLocaleString()}</div>
                        {vehicle.weeklyRepayment && (
                          <div className="text-xs text-white/60">€ {vehicle.weeklyRepayment.toLocaleString()}/wk</div>
                        )}
                      </td>
                      <td className="px-3 py-3">{vehicle.mileage.toLocaleString()} km</td>
                      <td className="px-3 py-3">{vehicle.year || vehicle.modelYear || "-"}</td>
                      <td className="px-3 py-3 text-white/60">
                        <div className="text-xs">
                          <div>Card: {vehicle.images?.length ?? (vehicle.image ? 1 : 0)}</div>
                          <div>Gallery: {vehicle.galleryImages?.length ?? 0}</div>
                          {vehicle.detailsPackage && (
                            <div className="text-[#e8a838]">ZIP: ✓</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          vehicle.tag === "PREMIUM" 
                            ? "bg-[#e8a838] text-[#0a1628]" 
                            : "bg-white/10 text-white"
                        }`}>
                          {vehicle.tag}
                        </span>
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <button 
                          onClick={() => removeVehicle(vehicle.id)} 
                          className="rounded-full border border-red-400/30 px-4 py-1.5 text-sm text-red-100 hover:bg-red-500/15 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </section>

      </div>
      <Outlet />
      <style>{`
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
      `}</style>
    </main>
  );
}

function UploadField({
  label,
  buttonLabel,
  names,
  emptyLabel,
  inputProps,
  className = "",
}: {
  label: string;
  buttonLabel: string;
  names: string[];
  emptyLabel: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
}) {
  const inputId = useId();
  const summary = names.length > 0 ? `${names.length} selected` : "No file selected";

  return (
    <label className={`admin-file-field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <div className="admin-file-control">
        <div className="admin-file-button">{buttonLabel}</div>
        <div className="admin-file-summary" title={names.join(", ") || summary}>
          {summary}
        </div>
      </div>
      <input {...inputProps} id={inputId} type="file" className="admin-file-native" />
      <FileNameList names={names} emptyLabel={emptyLabel} />
    </label>
  );
}

function FileNameList({ names, emptyLabel }: { names: string[]; emptyLabel: string }) {
  if (names.length === 0) {
    return <div className="admin-file-empty">{emptyLabel}</div>;
  }

  return (
    <div className="admin-file-list" aria-live="polite">
      {names.map((name, index) => (
        <div key={`${name}-${index}`} className="admin-file-pill" title={name}>
          {name}
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`admin-panel rounded-3xl p-6 ${className}`}
    >
      <motion.h2 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-5 font-display text-2xl font-bold flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/20">
          <i className="fa-solid fa-gear text-white" />
        </div>
        {title}
      </motion.h2>
      {children}
    </motion.section>
  );
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <motion.label 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="block"
    >
      <span className="mb-2 block text-xs uppercase tracking-wider text-white/45 font-semibold">{label}</span>
      <motion.input 
        whileFocus={{ scale: 1.02, boxShadow: "0 0 20px rgba(232,168,56,0.3)" }}
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        className="admin-field rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all" 
      />
    </motion.label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
      className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02] p-4 transition-all"
    >
      <span className="text-white/55 font-medium">{label}</span>
      <span className="text-right font-semibold text-amber">{value}</span>
    </motion.div>
  );
}
