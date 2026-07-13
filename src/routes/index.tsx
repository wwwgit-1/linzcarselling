import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useInView, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { apiGet, apiSend } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: LinzLanding,
});

/* ---------------- data ---------------- */

interface Car {
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

const cars: Car[] = [
  { id: 1, name: "Audi RS6 Avant", model: "2023", price: 129900, mileage: 4200, tag: "PREMIUM", color: "Nardo Grey", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80", specs: "Performance wagon with AWD, cargo space, luxury interior, practical family use, high power." },
  { id: 2, name: "Porsche 911 Turbo S", model: "2022", price: 219500, mileage: 8600, tag: "PREMIUM", color: "GT Silver", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80", specs: "Fast sports coupe, turbo performance, premium daily supercar, excellent handling." },
  { id: 3, name: "BMW M4 Competition", model: "2024", price: 94500, mileage: 1800, tag: "NEW", color: "Sao Paulo Yellow", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80", specs: "Nearly new performance coupe, low mileage, sporty handling, strong value under 100000." },
  { id: 4, name: "Mercedes-AMG GT", model: "2023", price: 178000, mileage: 5100, tag: "PREMIUM", color: "Obsidian Black", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80", specs: "Luxury grand tourer, AMG performance, premium comfort, powerful coupe." },
  { id: 5, name: "Range Rover Sport", model: "2023", price: 112400, mileage: 6900, tag: "PREMIUM", color: "Santorini Black", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80", specs: "Luxury SUV with space, comfort, family practicality, cargo room, all-weather capability." },
  { id: 6, name: "Tesla Model S Plaid", model: "2024", price: 138900, mileage: 2300, tag: "NEW", color: "Pearl White", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=80", specs: "Electric EV sedan, battery power, very fast acceleration, low mileage, technology focused." },
  { id: 7, name: "Lamborghini Huracán", model: "2022", price: 249000, mileage: 3400, tag: "PREMIUM", color: "Verde Mantis", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80", specs: "Exotic supercar, track performance, dramatic styling, premium collector vehicle." },
  { id: 8, name: "Aston Martin Vantage", model: "2023", price: 165000, mileage: 4100, tag: "PREMIUM", color: "Racing Green", image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&q=80", specs: "Luxury sports coupe, elegant grand touring, premium interior, performance driving." },
];

const EASE = [0.23, 1, 0.32, 1] as const;

type AuthMode = "login" | "signup";
type AuthStep = "form" | "verify";

interface AuthUser {
  email: string;
  username: string;
  avatar: string;
  location?: string;
  country?: string;
  role?: "admin" | "user";
}

interface StoredUser extends AuthUser {
  password: string;
}

interface PendingSignup {
  email: string;
  password: string;
  username: string;
  location: string;
}

const CURRENT_USER_KEY = "linz-current-user";
const ADMIN_EMAIL = "linzadmin@linz.com";
const ADMIN_PASSWORD = "123qwe123QWE'";
const INITIAL_VISIBLE_CARS = 12;
const MORE_CARS_INCREMENT = 8;

const defaultAdmin: StoredUser = {
  email: ADMIN_EMAIL,
  username: "Linz Admin",
  password: ADMIN_PASSWORD,
  avatar: "https://api.dicebear.com/9.x/initials/svg?seed=LA&backgroundColor=e8a838&textColor=0a1628",
  location: "Linz",
  country: "Austria",
  role: "admin",
};

function trackActivity(action: string, detail?: string) {
  try {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as AuthUser | null;
    void apiSend("/api/activity", "POST", {
      action,
      detail: detail ?? "",
      user: currentUser?.email ?? "guest",
    }).catch(console.error);
  } catch (error) {
    console.error(error);
  }
}

// Real-time visitor presence tracking
let visitorHeartbeatInterval: number | null = null;
let visitorUserId: string | null = null;

function startVisitorPresenceTracking() {
  const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as AuthUser | null;
  visitorUserId = currentUser?.email || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Send initial heartbeat
  void apiSend("/api/visitor-heartbeat", "POST", {
    userId: visitorUserId,
    isGuest: !currentUser
  }).catch(console.error);
  
  // Set up periodic heartbeat (every 30 seconds)
  if (visitorHeartbeatInterval) {
    clearInterval(visitorHeartbeatInterval);
  }
  
  visitorHeartbeatInterval = window.setInterval(() => {
    void apiSend("/api/visitor-heartbeat", "POST", {
      userId: visitorUserId,
      isGuest: !currentUser
    }).catch(console.error);
  }, 30000);
}

function stopVisitorPresenceTracking() {
  if (visitorHeartbeatInterval) {
    clearInterval(visitorHeartbeatInterval);
    visitorHeartbeatInterval = null;
  }
  
  if (visitorUserId) {
    void apiSend("/api/visitor-leave", "POST", { userId: visitorUserId }).catch(console.error);
    visitorUserId = null;
  }
}

function createAvatar(username: string) {
  const initial = (username.trim()[0] ?? "U").toUpperCase();
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(initial)}&backgroundColor=e8a838&textColor=0a1628`;
}

async function readUsers(): Promise<Record<string, StoredUser>> {
  return apiGet<Record<string, StoredUser>>("/api/users");
}

async function saveUser(user: StoredUser) {
  return apiSend<AuthUser>("/api/users", "POST", user);
}

async function deleteUser(email: string) {
  await apiSend<{ ok: true }>(`/api/users/${encodeURIComponent(email)}`, "DELETE");
}

async function sendVerificationCode(email: string) {
  await apiSend<{ ok: true }>("/api/send-verification-email", "POST", { email });
}

function localSearchVehicleIds(query: string, inventory: Car[]): number[] {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) {
    return inventory.map(car => car.id);
  }

  const scoredCars = inventory.map(car => {
    let score = 0;
    const searchableText = [
      car.name,
      car.model,
      car.make || '',
      car.vehicle || car.name,
      car.color,
      car.bodyType || '',
      car.fuelType || '',
      car.driveType || '',
      car.engineType || '',
      car.condition || '',
      car.specs || '',
      car.tag,
      String(car.price),
      String(car.year || ''),
      String(car.mileage)
    ].join(' ').toLowerCase();

    searchTerms.forEach(term => {
      // Exact match gets highest score
      if (searchableText.includes(term)) {
        score += 10;
        
        // Bonus for matches in important fields
        if (car.name.toLowerCase().includes(term)) score += 5;
        if (car.model.toLowerCase().includes(term)) score += 4;
        if (car.make?.toLowerCase().includes(term)) score += 4;
        if (car.vehicle?.toLowerCase().includes(term)) score += 4;
        if (car.color.toLowerCase().includes(term)) score += 3;
        
        // Partial word match
        if (searchableText.split(' ').some(word => word.startsWith(term))) {
          score += 2;
        }
      }
    });

    return { id: car.id, score };
  });

  // Sort by score descending and return IDs
  return scoredCars
    .filter(car => car.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(car => car.id);
}

async function requestAiVehicleIds(query: string, inventory: Car[]) {
  // Use local search instead of AI
  return localSearchVehicleIds(query, inventory);
}

/* ---------------- root ---------------- */

function LinzLanding() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) setAuthUser(JSON.parse(stored) as AuthUser);
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    
    // Start visitor presence tracking
    startVisitorPresenceTracking();
    
    // Cleanup on unmount
    return () => {
      stopVisitorPresenceTracking();
    };
  }, []);

  // Restart visitor tracking when auth state changes
  useEffect(() => {
    stopVisitorPresenceTracking();
    startVisitorPresenceTracking();
  }, [authUser]);

  const handleAuthComplete = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    if (user.role === "admin") {
      window.location.href = "/admin";
    }
  };

  const handleMembershipWithdraw = () => {
    if (authUser?.role === "admin") return;
    if (authUser) void deleteUser(authUser.email).catch(console.error);
    localStorage.removeItem(CURRENT_USER_KEY);
    setAuthUser(null);
  };

  return (
    <div className="min-h-screen bg-glacier text-navy overflow-x-hidden">
      <Header authUser={authUser} onAuthRequested={setAuthMode} onMembershipWithdraw={handleMembershipWithdraw} />
      <main>
        <Hero />
        <CarListings authUser={authUser} onAuthRequested={setAuthMode} />
        <MapSection />
        <ContactSection />
      </main>
      <Footer />
      {authMode && (
        <AuthDialog
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuthComplete={(user) => {
            handleAuthComplete(user);
            setAuthMode(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------- header ---------------- */

function Header({
  authUser,
  onAuthRequested,
  onMembershipWithdraw,
}: {
  authUser: AuthUser | null;
  onAuthRequested: (mode: AuthMode) => void;
  onMembershipWithdraw: () => void;
}) {
  const [shrunk, setShrunk] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfileOpen(false);
      setProfileDetailsOpen(false);
    }
  }, [authUser]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-xl bg-[#0A1628]/75 border-b border-[#c0c8d4]/20 transition-[height,padding] duration-300 ${
        shrunk ? "h-[60px]" : "h-20"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
        <a href="#top" className="flex items-center gap-3">
          <LogoMark scale={shrunk ? 0.85 : 1} />
          <span
            className="font-display font-bold text-white hidden sm:inline"
            style={{
              letterSpacing: "0.25em",
              fontSize: shrunk ? "0.85rem" : "1rem",
              textShadow: "0 0 20px rgba(232,168,56,0.35)",
              transition: "font-size 0.3s cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            LINZ CAR SELLING
          </span>
        </a>
        <nav className="flex items-center gap-3 md:gap-5">
          {authUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 text-left hover:border-amber/60"
                aria-expanded={profileOpen}
              >
                <img src={authUser.avatar} alt="" className="h-9 w-9 rounded-full bg-amber" />
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-white">{authUser.username}</div>
                  <div className="text-xs text-[#c0c8d4]">{authUser.email}</div>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] w-64 rounded-2xl border border-white/15 bg-[#0A1628] p-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <button
                    type="button"
                    onClick={() => setProfileDetailsOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[#c0c8d4] hover:bg-white/10 hover:text-white"
                  >
                    <span>Profile</span>
                    <i className={`fa-solid fa-chevron-${profileDetailsOpen ? "up" : "down"} text-xs`} />
                  </button>
                  {profileDetailsOpen && (
                    <div className="my-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
                      <div className="font-semibold text-white">{authUser.username}</div>
                      <div className="mt-1 break-all text-[#c0c8d4]">{authUser.email}</div>
                      {authUser.location && <div className="mt-1 text-[#c0c8d4]">{authUser.location}</div>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onMembershipWithdraw}
                    disabled={authUser.role === "admin"}
                    className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15"
                  >
                    <span>{authUser.role === "admin" ? "Admin protected" : "Logout"}</span>
                    <i className="fa-solid fa-right-from-bracket text-xs" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  trackActivity("button press", "Log In");
                  onAuthRequested("login");
                }}
                className="text-[#c0c8d4] hover:text-white transition-colors text-sm active:scale-95"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  trackActivity("button press", "Sign Up");
                  onAuthRequested("signup");
                }}
                className="bg-amber text-navy px-5 md:px-6 py-2 rounded-full text-sm font-semibold hover:px-7 hover:shadow-[0_0_30px_rgba(232,168,56,0.55)] active:scale-95"
                style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
              >
                Sign Up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function AuthDialog({
  initialMode,
  onClose,
  onAuthComplete,
}: {
  initialMode: AuthMode;
  onClose: () => void;
  onAuthComplete: (user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("form");
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);

  const title = step === "verify" ? "Verify your email" : mode === "signup" ? "Create your account" : "Welcome back";

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("auth-email") ?? "").trim().toLowerCase();
    const password = String(form.get("auth-password") ?? "");
    const confirmPassword = String(form.get("auth-confirm-password") ?? "");
    const username = String(form.get("auth-username") ?? "").trim();
    const location = String(form.get("auth-location") ?? "").trim();

    if (!email || !password || (mode === "signup" && (!username || !location || !confirmPassword))) {
      setError("Fill in every required field.");
      return;
    }

    if (mode === "login") {
      try {
        const user = await apiSend<AuthUser>("/api/auth/login", "POST", { email, password });
        trackActivity("login", user.email);
        onAuthComplete(user);
      } catch {
        setError("Email or password is incorrect.");
      }
      return;
    }

    const users = await readUsers();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (users[email]) {
      setError("An account with that email already exists.");
      return;
    }

    const signup = { email, password, username, location };
    setSendingVerification(true);
    try {
      await sendVerificationCode(email);
      setPendingSignup(signup);
      setCodeDigits(["", "", "", "", "", ""]);
      setStep("verify");
    } catch (error) {
      console.error(error);
      setError("We could not send the verification email. Please check the email address or try again.");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!pendingSignup) return;
    const enteredCode = codeDigits.join("");

    if (enteredCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      await apiSend<{ ok: true }>("/api/verify-code", "POST", {
        email: pendingSignup.email,
        code: enteredCode
      });
      
      const user: StoredUser = {
        email: pendingSignup.email,
        username: pendingSignup.username,
        location: pendingSignup.location,
        password: pendingSignup.password,
        avatar: createAvatar(pendingSignup.username),
        role: "user",
      };
      const savedUser = await saveUser(user);
      trackActivity("signup verified", user.email);
      onAuthComplete(savedUser);
    } catch (error) {
      console.error(error);
      setError("Invalid or expired verification code. Please try again.");
    }
  };

  const resendCode = async () => {
    if (!pendingSignup) return;
    setError("");
    setSendingVerification(true);
    try {
      await sendVerificationCode(pendingSignup.email);
      setCodeDigits(["", "", "", "", "", ""]);
    } catch (error) {
      console.error(error);
      setError("We could not resend the verification email. Please try again.");
    } finally {
      setSendingVerification(false);
    }
  };

  const updateCodeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCodeDigits((digits) => digits.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < 5) {
      document.getElementById(`verification-code-${index + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      document.getElementById(`verification-code-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (pasted.length === 0) return;
    setCodeDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    document.getElementById(`verification-code-${Math.min(pasted.length, 6) - 1}`)?.focus();
  };

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/65 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-[420px] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[20px] border border-white/15 bg-[#0A1628] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase text-amber" style={{ letterSpacing: "0.25em" }}>
              Linz Account
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 hover:border-amber hover:text-amber"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <AuthField label="Username" id="auth-username">
                  <input id="auth-username" name="auth-username" type="text" required className="auth-input" />
                </AuthField>
                <AuthField label="Location" id="auth-location">
                  <input id="auth-location" name="auth-location" type="text" required className="auth-input" />
                </AuthField>
              </>
            )}
            <AuthField label="Email" id="auth-email">
              <input id="auth-email" name="auth-email" type="email" required className="auth-input" />
            </AuthField>
            <AuthField label="Password" id="auth-password">
              <input id="auth-password" name="auth-password" type="password" required minLength={6} className="auth-input" />
            </AuthField>
            {mode === "signup" && (
              <AuthField label="Confirm Password" id="auth-confirm-password">
                <input
                  id="auth-confirm-password"
                  name="auth-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  className="auth-input"
                />
              </AuthField>
            )}
            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
            <button
              type="submit"
              disabled={sendingVerification}
              className="w-full rounded-full bg-amber py-3 font-bold text-navy hover:shadow-[0_0_28px_rgba(232,168,56,0.45)] disabled:cursor-wait disabled:opacity-70"
            >
              {sendingVerification ? "Sending..." : mode === "signup" ? "Send Verification Code" : "Log In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError("");
              }}
              className="w-full text-sm text-[#c0c8d4] hover:text-white"
            >
              {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-[#c0c8d4]">
              Enter the 6-digit code sent to <span className="font-semibold text-white">{pendingSignup?.email}</span>.
            </p>
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#c0c8d4]">Verification Code</div>
              <div className="grid grid-cols-6 gap-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`verification-code-${index}`}
                    aria-label={`Verification code digit ${index + 1}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(event) => updateCodeDigit(index, event.target.value)}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    onPaste={handleCodePaste}
                    className="h-12 rounded-xl border border-white/15 bg-white/10 text-center font-display text-xl font-bold text-white outline-none transition focus:border-amber focus:shadow-[0_0_0_4px_rgba(232,168,56,0.15)]"
                  />
                ))}
              </div>
            </div>
            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
            <button type="submit" className="w-full rounded-full bg-amber py-3 font-bold text-navy hover:shadow-[0_0_28px_rgba(232,168,56,0.45)]">
              Verify and Continue
            </button>
            <button
              type="button"
              onClick={resendCode}
              disabled={sendingVerification}
              className="w-full text-sm text-[#c0c8d4] hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              {sendingVerification ? "Sending..." : "Resend code"}
            </button>
          </form>
        )}

        <style>{`
          .auth-input {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 12px;
            background: rgba(255,255,255,0.08);
            color: white;
            outline: none;
            padding: 0.8rem 0.95rem;
          }
          .auth-input:focus {
            border-color: #e8a838;
            box-shadow: 0 0 0 4px rgba(232,168,56,0.15);
          }
        `}</style>
      </div>
    </div>
  );
}

function AuthField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#c0c8d4]">{label}</span>
      {children}
    </label>
  );
}

function LogoMark({ scale }: { scale: number }) {
  return (
    <img
      src="/favicon.png"
      alt=""
      width={112}
      height={112}
      className="object-contain"
      style={{ transform: `scale(${scale})`, transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1)" }}
    />
  );
}

/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 text-center overflow-hidden bg-[#050912]"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <video
          className="absolute inset-x-0 -top-[1.5cm] h-[calc(100%+1.5cm)] w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/data/car%20video.mp4" type="video/mp4" />
          <source src="/data.webm" type="video/webm" />
          <source src="/data.mov" type="video/quicktime" />
          <source src="/data" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#050912] via-[#050912]/90 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050912]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/55 to-transparent" />
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
        className="relative z-10 max-w-6xl"
      >
        <h1
          className="mx-auto max-w-[min(92vw,1100px)] font-display font-bold text-white leading-[0.92]"
          style={{
            fontSize: "clamp(2.2rem, 5.6vw, 5.6rem)",
            letterSpacing: "0.01em",
            textShadow: "0 8px 32px rgba(0,0,0,0.78), 0 0 22px rgba(232,168,56,0.24)",
          }}
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 34, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE } },
            }}
            className="block whitespace-nowrap"
          >
            DriveYourDream.
          </motion.span>
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 34, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE } },
            }}
            className="mt-3 block whitespace-nowrap text-amber"
            style={{
              fontSize: "clamp(2rem, 4.9vw, 4.8rem)",
              textShadow: "0 8px 30px rgba(0,0,0,0.82), 0 0 28px rgba(232,168,56,0.42)",
            }}
          >
            ExperiencetheFuture
          </motion.span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
          className="mt-6 text-[#c0c8d4]/90 max-w-2xl mx-auto"
        >
          Meticulously inspected pre-owned luxury vehicles in Upper Austria — with a 24-month warranty on every drive.
        </motion.p>

        <RegisteredCounter />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#inventory"
            onClick={() => trackActivity("button press", "Browse Inventory")}
            className="bg-amber text-navy px-8 py-3 rounded-full font-semibold hover:shadow-[0_0_40px_rgba(232,168,56,0.6)] hover:scale-105 active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            Browse Inventory
          </a>
          <a
            href="#contact"
            onClick={() => trackActivity("button press", "Book Test Drive")}
            className="border border-[#c0c8d4]/40 text-white px-8 py-3 rounded-full font-semibold hover:border-amber hover:text-amber active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            Book Test Drive
          </a>
        </motion.div>
      </motion.div>

      {/* twilight highway glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#e8a838]/10 to-transparent" />
    </section>
  );
}

function RegisteredCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.floor(v).toLocaleString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const unsub = rounded.on("change", setDisplay);
    return () => unsub();
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, 12847, { duration: 2, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, mv]);

  return (
    <div ref={ref} className="mt-8 flex items-center justify-center gap-2 text-[#c0c8d4] text-lg">
      <i className="fa-solid fa-star text-amber" />
      <span className="font-display font-semibold text-white">{display}</span>
      <span>Registered Drivers</span>
    </div>
  );
}

/* ---------------- listings ---------------- */

function CarListings({ authUser, onAuthRequested }: { authUser: AuthUser | null; onAuthRequested: (mode: AuthMode) => void }) {
  const [inventory, setInventory] = useState<Car[]>(cars);
  const [query, setQuery] = useState("");
  const [matchedCars, setMatchedCars] = useState<Car[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CARS);
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    apiGet<Car[]>("/api/vehicles")
      .then((storedCars) => {
        setInventory(storedCars.length ? storedCars : cars);
      })
      .catch((error) => {
        console.error(error);
      setInventory(cars);
      });
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_CARS);
  }, [inventory, matchedCars]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setMatchedCars(null);
      setAiStatus("");
      return;
    }
    setAiLoading(true);
    setAiStatus("Asking Puter AI to identify matching vehicle IDs...");
    try {
      const ids = await requestAiVehicleIds(trimmed, inventory);
      const idSet = new Set(ids);
      const matches = inventory.filter((car) => idSet.has(car.id));
      setMatchedCars(matches);
      setAiStatus(matches.length > 0 ? `Puter AI returned vehicle IDs: ${ids.join(", ")}` : "Puter AI did not find a matching vehicle ID.");
      trackActivity("AI API car search", `${trimmed} -> ${ids.join(", ") || "no match"}`);
    } catch (error) {
      setMatchedCars(null);
      setAiStatus(error instanceof Error ? error.message : "The AI search API failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const displayedInventory = matchedCars ?? inventory;
  const visibleCars = displayedInventory.slice(0, visibleCount);
  const hasMoreCars = visibleCount < displayedInventory.length;

  return (
    <section id="inventory" className="max-w-7xl mx-auto px-4 py-24">
      <SectionHeader
        eyebrow="Current Inventory"
        title="Handpicked Machines"
        subtitle="Every vehicle passes a 120-point inspection before it earns its spot in our showroom."
      />
      <form
        onSubmit={handleSearch}
        className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-[#d8dde5] bg-white p-3 shadow-[0_14px_40px_rgba(10,22,40,0.08)] sm:flex-row"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tell the AI what you need: fast coupe, family SUV, electric, under 150000..."
          className="min-h-12 flex-1 rounded-xl border border-[#d8dde5] px-4 outline-none focus:border-amber focus:ring-4 focus:ring-amber/15"
        />
        <button disabled={aiLoading} className="rounded-xl bg-navy px-6 py-3 font-bold text-white hover:bg-amber hover:text-navy disabled:cursor-wait disabled:opacity-60">
          {aiLoading ? "Searching..." : "Find Match"}
        </button>
      </form>
      {aiStatus && (
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber/40 bg-amber/10 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber">AI API Result</div>
          <p className="mt-2 text-sm font-semibold text-navy">{aiStatus}</p>
        </div>
      )}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 items-stretch">
        {visibleCars.map((c, i) => (
          <CarCard key={c.id} car={c} index={i} authUser={authUser} onAuthRequested={onAuthRequested} />
        ))}
      </div>
      {hasMoreCars && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + MORE_CARS_INCREMENT)}
            className="rounded-full bg-navy px-8 py-3 text-sm font-bold tracking-[0.18em] text-white hover:bg-amber hover:text-navy active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            MORE CARS
          </button>
        </div>
      )}
    </section>
  );
}

function getVehicleImages(car: Car) {
  const images = [...(car.images ?? []), ...(car.galleryImages ?? []), car.image].filter(Boolean);
  return [...new Set(images)];
}

function CarCard({
  car,
  index,
  authUser,
  onAuthRequested,
}: {
  car: Car;
  index: number;
  authUser: AuthUser | null;
  onAuthRequested: (mode: AuthMode) => void;
}) {
  const reduce = useReducedMotion();
  const cardImages = getVehicleImages(car);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = cardImages[activeImageIndex] ?? car.image;
  const hasMultipleCardImages = cardImages.length > 1;

  const showPreviousImage = () => {
    setActiveImageIndex((currentIndex) => (currentIndex === 0 ? cardImages.length - 1 : currentIndex - 1));
  };

  const showNextImage = () => {
    setActiveImageIndex((currentIndex) => (currentIndex + 1) % cardImages.length);
  };

  const openDetails = () => {
    trackActivity("button press", `View Details: ${car.name}`);
    if (!authUser) {
      onAuthRequested("signup");
      return;
    }
    window.location.href = `/vehicles/${car.id}`;
  };

  const handleDownloadDetails = (vehicle: Car) => {
    trackActivity("download", `Download Details: ${vehicle.name}`);
    if (!vehicle.detailsPackage) {
      alert("No download package available for this vehicle.");
      return;
    }
    
    const downloadUrl = vehicle.detailsPackage.url;
    
    if (!downloadUrl) {
      console.error("Download URL not found for vehicle:", vehicle.name);
      alert("Download package not available.");
      return;
    }
    
    // Create a download link for the ZIP file
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${vehicle.name.replace(/\s+/g, '_')}_details.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track download for registered users
    if (authUser) {
      apiSend("/api/track-download", "POST", {
        email: authUser.email,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: new Date().toISOString()
      }).catch(console.error);
    } else {
      // Track download count for unregistered users
      apiSend("/api/track-anonymous-download", "POST", {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: new Date().toISOString()
      }).catch(console.error);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 4) * 0.08 }}
      whileHover={
        reduce
          ? undefined
          : { y: -12, rotateX: 2, rotateY: 2, transition: { type: "spring", stiffness: 260, damping: 18 } }
      }
      style={{ perspective: 800 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-[#d8dde5] shadow-[0_4px_20px_rgba(10,22,40,0.05)] hover:shadow-[0_20px_60px_rgba(232,168,56,0.18)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#eef1f6]">
        <img
          src={activeImage}
          alt={`${car.name} ${car.model} in ${car.color}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasMultipleCardImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Previous card image"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-[#0A1628]/70 text-white shadow-lg backdrop-blur hover:bg-amber hover:text-navy"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Next card image"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-[#0A1628]/70 text-white shadow-lg backdrop-blur hover:bg-amber hover:text-navy"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {cardImages.map((image, imageIndex) => (
                <button
                  key={`${image}-${imageIndex}`}
                  type="button"
                  onClick={() => setActiveImageIndex(imageIndex)}
                  aria-label={`Show card image ${imageIndex + 1}`}
                  className={`h-2 rounded-full transition-[width,background-color] ${
                    activeImageIndex === imageIndex ? "w-5 bg-amber" : "w-2 bg-white/70 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
        <span
          className={`absolute top-3 right-3 px-3 py-1 text-[11px] font-bold rounded-full tracking-wider ${
            car.tag === "PREMIUM" ? "bg-amber text-navy" : "bg-white text-navy"
          }`}
        >
          {car.tag}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-base font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{car.name}</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#eef1f6] text-navy/70 font-medium shrink-0">
            {car.model}
          </span>
        </div>
        <div className="mt-1 text-xs text-navy/60">{car.color}</div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="font-display text-2xl font-bold text-amber leading-none">
              € {car.price.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-navy/50 mt-1">EUR</div>
          </div>
          <div className="text-sm text-navy/70 flex items-center gap-1.5">
            <i className="fa-solid fa-gauge-high text-navy/50" />
            {car.mileage.toLocaleString()} km
          </div>
        </div>
        <div className="mt-auto pt-5 flex flex-col gap-2">
          <button
            onClick={openDetails}
            className="w-full py-2.5 rounded-full text-sm font-semibold bg-navy text-white hover:bg-amber hover:text-navy active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            View Details
          </button>
          <button
            onClick={() => handleDownloadDetails(car)}
            className="w-full py-2.5 rounded-full text-sm font-semibold border-2 border-navy text-navy hover:bg-navy hover:text-white active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            Download Details
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------------- map ---------------- */

function MapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!inView || !containerRef.current) return;
    let cancelled = false;
    let map: any;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;

        map = L.map(containerRef.current, {
          center: [47.5162, 14.5501],
          zoom: 7,
          zoomControl: false,
          scrollWheelZoom: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const svg = `
          <svg xmlns='http://www.w3.org/2000/svg' width='40' height='52' viewBox='0 0 40 52'>
            <path d='M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z' fill='#E8A838'/>
            <circle cx='20' cy='20' r='7' fill='#0A1628'/>
          </svg>`;
        const icon = L.divIcon({
          html: `<div class="linz-marker">${svg}</div>`,
          className: "",
          iconSize: [40, 52],
          iconAnchor: [20, 52],
          popupAnchor: [0, -46],
        });

        L.marker([48.3069, 14.2858], { icon })
          .addTo(map)
          .bindPopup("<b>Linz Car Selling</b><br/>Headquarters");

        // Stepped zoom animation
        setTimeout(() => {
          if (cancelled) return;
          map.flyTo([48.5, 14.35], 10, { duration: 0.8, easeLinearity: 0.4 });
          setTimeout(() => {
            if (cancelled) return;
            map.flyTo([48.3069, 14.2858], 14, { duration: 1.2, easeLinearity: 0.3 });
          }, 1200);
        }, 500);
      } catch (e) {
        console.error(e);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [inView]);

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 py-16">
      <SectionHeader
        eyebrow="Visit The Showroom"
        title="Find Us in Linz"
        subtitle="Landstraße 45, 4020 Linz — the heart of Upper Austria."
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mt-10 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(10,22,40,0.35)] relative"
        style={{ height: 450 }}
      >
        {failed ? (
          <div className="w-full h-full grid place-items-center bg-gradient-to-br from-navy to-navy-2 text-white">
            <div className="text-center">
              <div className="mx-auto h-4 w-4 rounded-full bg-amber linz-dot" />
              <div className="mt-4 font-display text-2xl">Find us in Linz</div>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
      </motion.div>
    </section>
  );
}

/* ---------------- contact ---------------- */

function ContactSection() {
  const [toast, setToast] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return;
    trackActivity("button press", "Send Message");
    setToast(true);
    form.reset();
    setTimeout(() => setToast(false), 3200);
  };

  return (
    <section id="contact" className="bg-white border-y border-[#d8dde5]">
      <div className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-[35%_1fr] gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="text-xs uppercase tracking-[0.3em] text-amber font-semibold">Talk To Us</div>
          <h2 className="mt-3 font-display font-bold text-navy" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
            Direct Line
          </h2>
          <a
            href="https://t.me/linzcarselling"
            className="mt-6 flex items-center gap-3 text-navy font-bold hover:text-amber transition-colors"
            style={{ fontSize: "2.2rem" }}
          >
            <i className="fa-brands fa-telegram text-amber text-2xl" />
            linzcarselling
          </a>
          <div className="mt-4 flex items-center gap-2 text-sm text-navy/70">
            <span className="linz-dot inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            Reach us 8:00 – 18:00 CET
          </div>
          <div className="mt-8 p-5 rounded-2xl bg-[#f4f6fa] border border-[#d8dde5]">
            <div className="font-display font-semibold text-navy">Landstraße 45</div>
            <div className="text-sm text-navy/70">4020 Linz, Austria</div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          noValidate={false}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="bg-[#f4f6fa] rounded-3xl p-6 md:p-8 border border-[#d8dde5]"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="name" label="Full Name">
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                className="input"
              />
            </Field>
            <Field id="email" label="Email">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="input"
              />
            </Field>
          </div>
          <Field id="details" label="Inquiry Type">
            <select id="details" name="details" required className="input">
              <option value="">Select…</option>
              <option>General Inquiry</option>
              <option>Test Drive</option>
              <option>Financing</option>
              <option>Trade-in</option>
            </select>
          </Field>
          <Field id="message" label="Message">
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Your message…"
              className="input resize-none"
            />
          </Field>
          <button
            type="submit"
            className="mt-6 w-full py-3.5 rounded-full font-bold bg-amber text-navy hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(232,168,56,0.5)] active:scale-95"
            style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)" }}
          >
            Send Message
          </button>
        </motion.form>
      </div>

      {/* toast */}
      <div
        className={`fixed top-24 right-4 z-[1100] transition-all duration-300 ${
          toast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 pointer-events-none"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
      >
        <div className="flex items-center gap-3 bg-white border border-green-500/30 shadow-2xl rounded-xl px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-green-500 text-white grid place-items-center">
            <i className="fa-solid fa-check" />
          </div>
          <div className="text-sm font-medium text-navy">Message dispatched to administrator!</div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #d8dde5;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: #0a1628;
          outline: none;
          transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
        }
        .input:focus {
          border-color: #e8a838;
          box-shadow: 0 0 0 4px rgba(232,168,56,0.15);
        }
      `}</style>
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block mt-4 first:mt-0">
      <span className="block text-xs font-semibold uppercase tracking-wider text-navy/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- footer ---------------- */

function Footer() {
  return (
    <footer className="bg-[#060E1A] text-white/70 pt-16 pb-6 px-4 mt-8">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <div className="font-display font-bold text-white text-lg">Linz Car Selling GmbH</div>
          <p className="mt-3 text-sm">Redefining pre-owned luxury in Upper Austria since 2012.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-amber transition-colors">Impressum</a></li>
            <li><a href="#" className="hover:text-amber transition-colors">Datenschutz</a></li>
            <li><a href="#" className="hover:text-amber transition-colors">Terms & Conditions</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Social</div>
          <div className="flex gap-4 text-lg">
            <a href="#" aria-label="Facebook" className="hover:text-amber transition-colors"><i className="fa-brands fa-facebook" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-amber transition-colors"><i className="fa-brands fa-instagram" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-amber transition-colors"><i className="fa-brands fa-youtube" /></a>
          </div>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Newsletter</div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-amber"
            />
            <button className="bg-amber text-navy px-4 py-2 rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-transform">
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 border-t border-white/10 pt-6 text-center text-xs opacity-60">
        © 2026 Linz Car Selling. All rights reserved.
      </div>
    </footer>
  );
}

/* ---------------- shared ---------------- */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="text-xs uppercase tracking-[0.3em] text-amber font-semibold">{eyebrow}</div>
      <h2
        className="mt-3 font-display font-bold text-navy"
        style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}
      >
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-navy/70">{subtitle}</p>}
    </motion.div>
  );
}
