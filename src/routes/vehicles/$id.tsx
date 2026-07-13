import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { apiGet, apiSend } from "@/lib/api";

export const Route = createFileRoute("/vehicles/$id")({
  component: VehicleDetailPage,
});

interface StoredUser {
  email: string;
  username: string;
  avatar: string;
  role?: "admin" | "user";
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
    url: string;
  };
}

interface ChatMessage {
  from: "user" | "admin";
  body: string;
  at: string;
}

const CURRENT_USER_KEY = "linz-current-user";

function trackActivity(action: string, detail?: string) {
  try {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as StoredUser | null;
    void apiSend("/api/activity", "POST", {
      action,
      detail: detail ?? "",
      user: currentUser?.email ?? "guest",
    }).catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

function getVehicleImages(vehicle: Vehicle) {
  const images = [...(vehicle.galleryImages ?? []), ...(vehicle.images ?? []), vehicle.image].filter(Boolean);
  return [...new Set(images)];
}

function VehicleDetailPage() {
  const { id } = Route.useParams();
  const vehicleId = Number(id);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatPath = useMemo(
    () => (currentUser ? `/api/chats/${vehicleId}/${encodeURIComponent(currentUser.email)}` : ""),
    [currentUser, vehicleId],
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as StoredUser | null;
    setCurrentUser(user);
    if (!user) return;

    apiGet<Vehicle>(`/api/vehicles/${vehicleId}`)
      .then((match) => {
        setVehicle(match);
        setSelectedImage(getVehicleImages(match)[0] ?? "");
        trackActivity("vehicle details opened", match.vehicle || match.name || String(vehicleId));
      })
      .catch((error) => {
        console.error(error);
        setVehicle(null);
        setSelectedImage("");
      });
  }, [vehicleId]);

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!chatPath) return;
    void apiGet<ChatMessage[]>(chatPath).then(setMessages).catch(console.error);

    const url = `/api/chats/${vehicleId}/${encodeURIComponent(currentUser?.email ?? "")}/stream`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { message: ChatMessage } | ChatMessage;
        const msg = (data as any).message ?? data;
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
  }, [chatPath, vehicleId, currentUser]);

  const gallery = vehicle ? getVehicleImages(vehicle) : [];
  const specs = vehicle
    ? [
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
        ["Color", vehicle.color],
      ].filter(([, value]) => value)
    : [];

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatPath) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("message") ?? "").trim();
    if (!body) return;
    try {
      const nextMessages = await apiSend<ChatMessage[]>(chatPath, "POST", { from: "user", body });
      setMessages(nextMessages);
      trackActivity("admin chat message", vehicle?.vehicle || vehicle?.name || String(vehicleId));
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
    }
  };

  if (!currentUser) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07111f] px-4 text-white">
        <section className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]">Members Only</div>
          <h1 className="mt-3 font-display text-3xl font-bold">Sign up to view vehicle details</h1>
          <p className="mt-3 text-white/65">Return to the showroom and create an account to inspect this passenger car.</p>
          <a href="/" className="mt-6 inline-flex rounded-full bg-[#e8a838] px-6 py-3 font-bold text-[#0a1628]">
            Back to showroom
          </a>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07111f] px-4 text-white">
        <section className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <h1 className="font-display text-3xl font-bold">Vehicle not found</h1>
          <a href="/#inventory" className="mt-6 inline-flex rounded-full bg-[#e8a838] px-6 py-3 font-bold text-[#0a1628]">
            Back to inventory
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-12 text-white sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]">Passenger Car Details</div>
            <h1 className="mt-2 font-display text-4xl font-bold">{vehicle.vehicle || vehicle.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/65">
              <span>{vehicle.make || "unknown"} {vehicle.model}</span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">{vehicle.year || "unknown"}</span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">{vehicle.condition || "unknown"}</span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">{vehicle.fuelType || "unknown"}</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.3em] ${vehicle.tag === "PREMIUM" ? "bg-amber text-navy" : "bg-white text-navy"}`}>{vehicle.tag}</span>
            </div>
          </div>
          <a href="/#inventory" className="rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]">
            Back to inventory
          </a>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.65fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="aspect-[16/9] min-h-[500px] overflow-hidden rounded-[1.5rem] bg-white/5 relative group">
              <img src={selectedImage || vehicle.image} alt={vehicle.vehicle || vehicle.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = gallery.indexOf(selectedImage);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
                      setSelectedImage(gallery[prevIndex]);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = gallery.indexOf(selectedImage);
                      const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
                      setSelectedImage(gallery[nextIndex]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {gallery.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`h-2 rounded-full transition-all ${selectedImage === image ? "w-6 bg-amber" : "w-2 bg-white/50 hover:bg-white"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-white/60">
                  {gallery.length} image{gallery.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = gallery.indexOf(selectedImage);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1;
                      setSelectedImage(gallery[prevIndex]);
                    }}
                    className="h-8 w-8 rounded-full border border-white/20 bg-white/5 text-white/60 hover:border-amber hover:text-amber transition-colors flex items-center justify-center"
                  >
                    <i className="fa-solid fa-chevron-left text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = gallery.indexOf(selectedImage);
                      const nextIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0;
                      setSelectedImage(gallery[nextIndex]);
                    }}
                    className="h-8 w-8 rounded-full border border-white/20 bg-white/5 text-white/60 hover:border-amber hover:text-amber transition-colors flex items-center justify-center"
                  >
                    <i className="fa-solid fa-chevron-right text-sm" />
                  </button>
                </div>
              </div>
              <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${selectedImage === image ? "border-amber shadow-lg scale-105" : "border-white/10 hover:border-white/30"}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">Mileage</div>
                <div className="mt-2 text-lg font-semibold text-white">{vehicle.mileage.toLocaleString()} km</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">Drive</div>
                <div className="mt-2 text-lg font-semibold text-white">{vehicle.driveType || "unknown"}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">Model Year</div>
                <div className="mt-2 text-lg font-semibold text-white">{vehicle.modelYear || "unknown"}</div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-white/45">Price</div>
                <div className="mt-2 font-display text-4xl font-bold text-[#e8a838]">EUR {vehicle.price.toLocaleString()}</div>
                {vehicle.weeklyRepayment ? <div className="mt-1 text-white/65">Weekly repayment: EUR {vehicle.weeklyRepayment.toLocaleString()}</div> : null}
              </div>
              <div className={`rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] ${vehicle.tag === "PREMIUM" ? "text-[#b57e00]" : "text-[#0a1628]"}`}>
                {vehicle.tag}
              </div>
            </div>
            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/70">
              {vehicle.specs || "No detailed specifications were supplied."}
            </div>
            {vehicle.detailsPackage && (
              <button
                onClick={() => {
                  const downloadUrl = vehicle.detailsPackage?.url;
                  if (downloadUrl) {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `${vehicle.name.replace(/\s+/g, '_')}_details.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    if (currentUser) {
                      apiSend("/api/track-download", "POST", {
                        email: currentUser.email,
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        timestamp: new Date().toISOString()
                      }).catch(console.error);
                    } else {
                      apiSend("/api/track-anonymous-download", "POST", {
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        timestamp: new Date().toISOString()
                      }).catch(console.error);
                    }
                  }
                }}
                className="mt-4 w-full py-3 rounded-full text-sm font-semibold border-2 border-amber text-amber hover:bg-amber hover:text-[#0a1628] transition-colors"
              >
                Download Details Package
              </button>
            )}
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl font-bold mb-6"
          >
            Vehicle Specifications
          </motion.h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-car text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Vehicle</div>
                  <div className="text-lg font-semibold text-white">{vehicle.vehicle || vehicle.name}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Make</span>
                  <span className="text-white font-medium">{vehicle.make || "unknown"}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Model</span>
                  <span className="text-white font-medium">{vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Body Type</span>
                  <span className="text-white font-medium">{vehicle.bodyType || "unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: -1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-calendar text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Year & Condition</div>
                  <div className="text-lg font-semibold text-white">{vehicle.year || vehicle.modelYear || "unknown"}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Condition</span>
                  <span className="text-white font-medium">{vehicle.condition || "unknown"}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Release Date</span>
                  <span className="text-white font-medium">{vehicle.releaseDate || "unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model Year</span>
                  <span className="text-white font-medium">{vehicle.modelYear || "unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-gas-pump text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Engine & Fuel</div>
                  <div className="text-lg font-semibold text-white">{vehicle.engineType || vehicle.fuelType || "unknown"}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Fuel Type</span>
                  <span className="text-white font-medium">{vehicle.fuelType || "unknown"}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Cylinders</span>
                  <span className="text-white font-medium">{vehicle.cylinders || "unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Capacity</span>
                  <span className="text-white font-medium">{vehicle.capacityCc || "unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: -1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-bolt text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Performance</div>
                  <div className="text-lg font-semibold text-white">{vehicle.power || "unknown"}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Power</span>
                  <span className="text-white font-medium">{vehicle.power || "unknown"}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Torque</span>
                  <span className="text-white font-medium">{vehicle.torque || "unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Drive Type</span>
                  <span className="text-white font-medium">{vehicle.driveType || "unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-gauge-high text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Mileage</div>
                  <div className="text-lg font-semibold text-white">{vehicle.mileage.toLocaleString()} km</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Mileage</span>
                  <span className="text-white font-medium">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Build Date</span>
                  <span className="text-white font-medium">{vehicle.buildDate || "unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Compliance</span>
                  <span className="text-white font-medium">{vehicle.complianceDate || "unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03, rotate: -1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/30"
                >
                  <i className="fa-solid fa-palette text-white" />
                </motion.div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">Appearance</div>
                  <div className="text-lg font-semibold text-white">{vehicle.color}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Color</span>
                  <span className="text-white font-medium">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Tag</span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.2em] ${vehicle.tag === "PREMIUM" ? "bg-amber text-navy" : "bg-white text-navy"}`}>
                    {vehicle.tag}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-amber/20 flex items-center justify-center">
              <i className="fa-solid fa-comments text-amber text-xl" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold">Chat with Administrator</h2>
              <p className="text-white/60 text-sm mt-1">Get instant help with test drives, financing, and availability</p>
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/60">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-comments text-amber text-2xl" />
                  </div>
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm mt-2">Send a message about test drives, financing, or availability.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={`${message.at}-${index}`} 
                    className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${
                      message.from === "user" 
                        ? "bg-amber text-[#0a1628]" 
                        : "bg-white/[0.08] text-white border border-white/10"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold opacity-70">
                          {message.from === "user" ? currentUser.username : "Linz Admin"}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(message.at).toLocaleString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed">{message.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-6 flex gap-3">
            <input
              name="message"
              placeholder="Type your message to the administrator..."
              className="flex-1 min-h-14 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/40 focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all"
            />
            <button className="rounded-2xl bg-amber px-8 py-4 font-bold text-[#0a1628] hover:bg-amber/90 transition-colors flex items-center gap-2">
              <i className="fa-solid fa-paper-plane" />
              Send
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
