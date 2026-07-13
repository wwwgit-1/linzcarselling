import { config as dotenvConfig } from "dotenv";
import "./lib/error-capture";

import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

import { consumeLastCapturedError } from "./lib/error-capture";
import { sendVerificationEmail } from "./lib/email";

const envFiles = [
  path.resolve(process.cwd(), ".env.local"),
  "/etc/secrets/.env.local",
];
console.log(envFiles, "------------envfile----------")
let loadedEnvPath: string | null = null;
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    const result = dotenvConfig({ path: envFile, override: false });
    if (result.parsed) {
      loadedEnvPath = envFile;
      console.log(`Loaded environment from ${envFile}`);
      break;
    }
  }
}

// If no env file was loaded, check if environment variables are set directly (Render.com)
if (!loadedEnvPath) {
  console.log("No environment file found, using system environment variables");
  if (process.env.SMTP_HOST || process.env.DATABASE_URL) {
    console.log("Environment variables detected in system");
  } else {
    console.warn("Warning: No environment variables found. SMTP and database features may not work.");
  }
}

import { renderErrorPage } from "./lib/error-page";
import {
  deleteFromStoreCollection,
  readStoreCollection,
  readUploadAsset,
  writeStoreCollection,
  writeUploadAsset,
  type StoredUploadAsset,
} from "./lib/server-data-store";

// Simple in-memory SSE subscribers map: threadKey -> Set of send functions
const chatSubscribers: Map<string, Set<(data: unknown) => void>> = new Map();

function createSseChannel(onCancel: () => void) {
  let controller: ReadableStreamDefaultController | null = null;
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      ctrl.enqueue(new TextEncoder().encode(':ok\n\n'));
    },
    cancel() {
      onCancel();
      controller = null;
    },
  });

  return {
    response: new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }),
    send(data: unknown) {
      if (!controller) return;
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch {
        // ignore
      }
    },
    close() {
      if (!controller) return;
      try {
        controller.close();
      } finally {
        controller = null;
      }
    },
  };
}


type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

interface Vehicle {
  id: number;
  [key: string]: unknown;
}

interface UploadResponse {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

interface StoredUser {
  email: string;
  username: string;
  password: string;
  avatar: string;
  location?: string;
  country?: string;
  role?: "admin" | "user";
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

interface ActiveVisitor {
  userId: string; // email or session ID for guests
  lastSeen: number; // timestamp
  isGuest: boolean;
}

interface ActivityItem {
  action: string;
  detail: string;
  user: string;
  at: string;
}

interface AnonymousDownload {
  vehicleId: number;
  vehicleName: string;
  timestamp: string;
  count: number;
}

interface ChatMessage {
  from: "user" | "admin";
  body: string;
  at: string;
}

interface ChatThread {
  key: string;
  messages: ChatMessage[];
}

interface VerificationEmailPayload {
  email: string;
}

interface VerificationCodeEntry {
  email: string;
  code: string;
  expiresAt: number;
}

// Fallback in-memory storage for when database is not available
const fallbackVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Real-time visitor presence tracking
const activeVisitors = new Map<string, ActiveVisitor>();
const VISITOR_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity = visitor left

// Clean up inactive visitors periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [userId, visitor] of activeVisitors) {
    if (now - visitor.lastSeen > VISITOR_TIMEOUT) {
      activeVisitors.delete(userId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} inactive visitors`);
  }
}, 60 * 1000); // Check every minute

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeVerificationCode(email: string, code: string) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  const entry: VerificationCodeEntry = {
    email: email.toLowerCase(),
    code,
    expiresAt,
  };
  
  try {
    const codes = await readStoreCollection<VerificationCodeEntry>("verification-codes");
    // Remove any existing code for this email
    const filteredCodes = codes.filter(c => c.email !== email.toLowerCase());
    // Add new code
    const updatedCodes = [...filteredCodes, entry];
    await writeStoreCollection("verification-codes", updatedCodes);
    console.log(`Stored verification code for ${email} in database`);
  } catch (error) {
    console.error(`Database storage failed for ${email}, using fallback in-memory storage:`, error);
    // Fallback to in-memory storage
    fallbackVerificationCodes.set(email.toLowerCase(), { code, expiresAt });
  }
}

async function getVerificationCode(email: string): Promise<string | null> {
  // Try database first
  try {
    const codes = await readStoreCollection<VerificationCodeEntry>("verification-codes");
    const entry = codes.find(c => c.email === email.toLowerCase());
    
    if (entry) {
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await clearVerificationCode(email);
        return null;
      }
      return entry.code;
    }
  } catch (error) {
    console.error(`Database read failed for ${email}, checking fallback:`, error);
  }
  
  // Fallback to in-memory storage
  const entry = fallbackVerificationCodes.get(email.toLowerCase());
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    fallbackVerificationCodes.delete(email.toLowerCase());
    return null;
  }
  
  return entry.code;
}

async function clearVerificationCode(email: string) {
  // Try database first
  try {
    const codes = await readStoreCollection<VerificationCodeEntry>("verification-codes");
    const filteredCodes = codes.filter(c => c.email !== email.toLowerCase());
    await writeStoreCollection("verification-codes", filteredCodes);
    console.log(`Cleared verification code for ${email} from database`);
  } catch (error) {
    console.error(`Database clear failed for ${email}, clearing fallback:`, error);
  }
  
  // Always clear from fallback
  fallbackVerificationCodes.delete(email.toLowerCase());
}

const ADMIN_EMAIL = "linzadmin@linz.com";
const ADMIN_PASSWORD = "123qwe123QWE'";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const defaultAdmin: StoredUser = {
  email: ADMIN_EMAIL,
  username: "Linz Admin",
  password: ADMIN_PASSWORD,
  avatar: "https://api.dicebear.com/9.x/initials/svg?seed=LA&backgroundColor=e8a838&textColor=0a1628",
  location: "Linz",
  country: "Austria",
  role: "admin",
};

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function formString(form: FormData, name: string) {
  return String(form.get(name) ?? "");
}

function formNumber(form: FormData, name: string) {
  return Number(form.get(name) ?? 0);
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createNumericId() {
  // Generate a unique numeric ID using timestamp and random component
  return Date.now() + Math.floor(Math.random() * 10000);
}

async function saveUploadFile(file: File): Promise<UploadResponse> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
  }

  const id = createId();
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload: StoredUploadAsset = {
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    dataBase64: buffer.toString("base64"),
    createdAt: new Date().toISOString(),
  };
  await writeUploadAsset(upload);
  return { id, url: `/api/uploads/${id}`, name: upload.name, size: upload.size, type: upload.type };
}

async function saveUploadFiles(files: File[]) {
  return Promise.all(files.filter((file) => file.size > 0).map(saveUploadFile));
}

function formFiles(form: FormData, name: string) {
  return form.getAll(name).flatMap((value) => {
    if (value instanceof File && value.size > 0) {
      return [value];
    }

    if (value instanceof Blob && typeof (value as any).name === "string" && value.size > 0) {
      return [new File([value], (value as any).name, { type: value.type })];
    }

    return [];
  });
}

async function vehicleFromMultipartForm(form: FormData): Promise<Vehicle> {
  const cardUploads = await saveUploadFiles(formFiles(form, "cardImages"));
  const galleryUploads = await saveUploadFiles(formFiles(form, "galleryImages"));
  const allVehicleImages = [...cardUploads, ...galleryUploads].map((upload) => upload.url);
  const detailsPackageFile = formFiles(form, "detailsPackage")[0];
  const detailsPackageUpload = detailsPackageFile ? await saveUploadFile(detailsPackageFile) : undefined;

  // Helper function to get form value or default to "unknown"
  const formStringWithDefault = (form: FormData, name: string) => {
    const value = String(form.get(name) ?? "").trim();
    return value || "unknown";
  };

  return {
    id: createNumericId(),
    name: formStringWithDefault(form, "vehicle"),
    vehicle: formStringWithDefault(form, "vehicle"),
    model: formStringWithDefault(form, "model"),
    price: formNumber(form, "price") || 0,
    weeklyRepayment: formNumber(form, "weeklyRepayment") || 0,
    mileage: formNumber(form, "mileage") || 0,
    tag: formString(form, "tag") || "PREMIUM",
    color: formStringWithDefault(form, "color"),
    image: allVehicleImages[0] ?? "",
    images: cardUploads.length > 0 ? cardUploads.map((upload) => upload.url) : allVehicleImages,
    galleryImages: allVehicleImages,
    specs: formStringWithDefault(form, "specs"),
    make: formStringWithDefault(form, "make"),
    bodyType: formStringWithDefault(form, "bodyType"),
    year: formStringWithDefault(form, "year"),
    condition: formStringWithDefault(form, "condition"),
    fuelType: formStringWithDefault(form, "fuelType"),
    cylinders: formStringWithDefault(form, "cylinders"),
    driveType: formStringWithDefault(form, "driveType"),
    engineType: formStringWithDefault(form, "engineType"),
    capacityCc: formStringWithDefault(form, "capacityCc"),
    power: formStringWithDefault(form, "power"),
    torque: formStringWithDefault(form, "torque"),
    releaseDate: formStringWithDefault(form, "releaseDate"),
    buildDate: formStringWithDefault(form, "buildDate"),
    complianceDate: formStringWithDefault(form, "complianceDate"),
    modelYear: formStringWithDefault(form, "modelYear"),
    detailsPackage: detailsPackageUpload
      ? {
          name: detailsPackageUpload.name,
          size: detailsPackageUpload.size,
          url: detailsPackageUpload.url,
        }
      : undefined,
  };
}

function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

function userToSession(user: StoredUser) {
  const { password: _password, ...sessionUser } = user;
  return sessionUser;
}

async function readUsersRecord() {
  const users = await readStoreCollection<StoredUser>("users");
  const record = Object.fromEntries(users.map((user) => [normalizeEmail(user.email), user]));

  if (!record[ADMIN_EMAIL]) {
    record[ADMIN_EMAIL] = defaultAdmin;
    await writeUsersRecord(record);
  }

  return record;
}

async function writeUsersRecord(users: Record<string, StoredUser>) {
  const normalizedUsers = Object.fromEntries(
    Object.values(users).map((user) => {
      const email = normalizeEmail(user.email);
      return [email, { ...user, email }];
    }),
  );

  if (!normalizedUsers[ADMIN_EMAIL]) {
    normalizedUsers[ADMIN_EMAIL] = defaultAdmin;
  }

  await writeStoreCollection("users", Object.values(normalizedUsers));
  return normalizedUsers;
}

function getChatKey(vehicleId: number, email: string) {
  return `${vehicleId}:${normalizeEmail(email)}`;
}

async function readChatThread(vehicleId: number, email: string) {
  const key = getChatKey(vehicleId, email);
  const threads = await readStoreCollection<ChatThread>("chats");
  return threads.find((thread) => thread.key === key) ?? { key, messages: [] };
}

async function listChatThreadsForEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const threads = await readStoreCollection<ChatThread>("chats");
  return threads.filter((thread) => thread.key.endsWith(`:${normalizedEmail}`));
}

function broadcastChatMessage(threadKey: string, message: ChatMessage) {
  const subscribers = chatSubscribers.get(threadKey);
  if (!subscribers) return;
  for (const send of Array.from(subscribers)) {
    try {
      send({ message });
    } catch (error) {
      console.error(`Failed to send SSE update for thread ${threadKey}:`, error);
    }
  }
}

async function writeChatThread(thread: ChatThread) {
  const threads = await readStoreCollection<ChatThread>("chats");
  const nextThreads = [thread, ...threads.filter((item) => item.key !== thread.key)];
  await writeStoreCollection("chats", nextThreads);
}

async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return undefined;

  if (url.pathname === "/api/health") {
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    return jsonResponse({ ok: true, smtpConfigured });
  }

  if (url.pathname === "/api/debug-env") {
    return jsonResponse({
      ok: true,
      loadedEnvPath: loadedEnvPath ?? "none",
      smtpHost: process.env.SMTP_HOST ? "configured" : "missing",
      smtpUser: process.env.SMTP_USER ? "configured" : "missing",
      smtpPass: process.env.SMTP_PASS ? "configured" : "missing",
      smtpFrom: process.env.SMTP_FROM ? "configured" : "missing",
    });
  }

  const uploadMatch = url.pathname.match(/^\/api\/uploads\/([a-z0-9-]+)$/i);
  if (uploadMatch && request.method === "GET") {
    const upload = await readUploadAsset(uploadMatch[1]);
    if (!upload) return jsonResponse({ error: "Upload not found" }, { status: 404 });

    return new Response(Buffer.from(upload.dataBase64, "base64"), {
      headers: {
        "content-type": upload.type,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (url.pathname === "/api/uploads" && request.method === "POST") {
    console.log("=== UPLOAD ENDPOINT REACHED ===");
    let file: File | null = null;
    try {
      const form = await request.formData();
      const value = form.get("file");
      file = value instanceof File ? value : null;
      console.log(`File upload request: ${file?.name || 'no file'} (${file?.size || 0} bytes)`);
    } catch (error) {
      console.error("Upload form parsing error:", error);
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid upload body" }, { status: 400 });
    }

    if (!file || file.size === 0) {
      console.error("No file or empty file provided");
      return jsonResponse({ error: "A file is required" }, { status: 400 });
    }

    try {
      console.log("Starting file save process");
      const result = await saveUploadFile(file);
      console.log("File saved successfully:", result.id);
      return jsonResponse(result, { status: 201 });
    } catch (error) {
      console.error("File save error:", error);
      return jsonResponse({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
    }
  }

  console.log(`Incoming request: ${request.method} ${url.pathname}`);
  
  // Health check endpoint for Render.com
  if (url.pathname === "/health" && request.method === "GET") {
    return jsonResponse({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: loadedEnvPath ? "file" : "system",
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      databaseConfigured: !!process.env.DATABASE_URL
    });
  }
  
  if (url.pathname === "/api/send-verification-email" && request.method === "POST") {
    console.log("=== VERIFICATION EMAIL ENDPOINT REACHED ===");
    console.log("Received verification email request");
    let payload: VerificationEmailPayload;
    try {
      payload = await readJsonBody<VerificationEmailPayload>(request);
      console.log(`Email verification request for: ${payload.email}`);
    } catch (error) {
      console.error("JSON parsing error:", error);
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error(`Invalid email format: ${email}`);
      return jsonResponse({ error: "A valid email is required" }, { status: 400 });
    }

    try {
      const code = generateVerificationCode();
      console.log(`Generated verification code for ${email}`);
      
      await storeVerificationCode(email, code);
      console.log(`Stored verification code for ${email}`);

      await sendVerificationEmail({ email, code });
      console.log(`Sent verification email to ${email}`);
      
      return jsonResponse({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification email could not be sent";
      console.error(`Signup process failed for ${email}:`, message, error);
      return jsonResponse({ error: message }, { status: 500 });
    }
  }

  if (url.pathname === "/api/verify-code" && request.method === "POST") {
    let payload: { email?: unknown; code?: unknown };
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const email = String(payload.email ?? "").trim().toLowerCase();
    const code = String(payload.code ?? "").trim();

    if (!email || !code) {
      return jsonResponse({ error: "Email and code are required" }, { status: 400 });
    }

    const storedCode = await getVerificationCode(email);
    if (!storedCode) {
      return jsonResponse({ error: "Invalid or expired code" }, { status: 400 });
    }

    if (storedCode !== code) {
      return jsonResponse({ error: "Invalid code" }, { status: 400 });
    }

    await clearVerificationCode(email);
    return jsonResponse({ ok: true });
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    let payload: { email?: unknown; password?: unknown };
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const email = normalizeEmail(payload.email);
    const password = String(payload.password ?? "");
    const users = await readUsersRecord();
    const user = users[email];
    if (!user || user.password !== password) {
      return jsonResponse({ error: "Email or password is incorrect." }, { status: 401 });
    }

    return jsonResponse(userToSession(user));
  }

  if (url.pathname === "/api/users" && request.method === "GET") {
    return jsonResponse(await readUsersRecord());
  }

  if (url.pathname === "/api/users" && request.method === "POST") {
    let user: StoredUser;
    try {
      user = await readJsonBody<StoredUser>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const email = normalizeEmail(user.email);
    if (!email || !user.username || !user.password) {
      return jsonResponse({ error: "Email, username, and password are required" }, { status: 400 });
    }

    const users = await readUsersRecord();
    users[email] = { ...user, email, role: user.role ?? "user" };
    await writeUsersRecord(users);
    return jsonResponse(userToSession(users[email]), { status: 201 });
  }

  if (url.pathname === "/api/users" && request.method === "PUT") {
    let users: Record<string, StoredUser>;
    try {
      users = await readJsonBody<Record<string, StoredUser>>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    return jsonResponse(await writeUsersRecord(users));
  }

  const userMatch = url.pathname.match(/^\/api\/users\/(.+)$/);
  if (userMatch && request.method === "DELETE") {
    const email = normalizeEmail(decodeURIComponent(userMatch[1]));
    const users = await readUsersRecord();
    if (email !== ADMIN_EMAIL) {
      delete users[email];
      await writeUsersRecord(users);
    }
    return jsonResponse({ ok: true });
  }

  if (url.pathname === "/api/activity" && request.method === "GET") {
    return jsonResponse(await readStoreCollection<ActivityItem>("activity"));
  }

  // Public visitor count endpoint - no authentication required
  if (url.pathname === "/api/visitor-count" && request.method === "GET") {
    // Use real-time active visitors instead of historical activity
    const now = Date.now();
    let activeCount = 0;
    let guestCount = 0;
    let registeredCount = 0;
    
    for (const visitor of activeVisitors.values()) {
      if (now - visitor.lastSeen < VISITOR_TIMEOUT) {
        activeCount++;
        if (visitor.isGuest) {
          guestCount++;
        } else {
          registeredCount++;
        }
      }
    }
    
    return jsonResponse({
      currentActiveVisitors: activeCount,
      registeredUsers: registeredCount,
      guests: guestCount,
      lastUpdated: new Date().toISOString()
    });
  }

  // Download count endpoint - counts unique downloads from both registered and anonymous users
  if (url.pathname === "/api/download-count" && request.method === "GET") {
    const users = await readUsersRecord();
    const anonymousDownloads = await readStoreCollection<AnonymousDownload>("anonymous-downloads");
    
    // Count unique downloads from registered users (unique user-vehicle combinations)
    let registeredDownloadCount = 0;
    for (const user of Object.values(users)) {
      if (user.downloads && user.downloads.length > 0) {
        registeredDownloadCount += user.downloads.length;
      }
    }
    
    // Count unique downloads from anonymous users (each vehicle downloaded counts once, regardless of how many times)
    // The anonymous-downloads collection already tracks unique vehicle downloads with a count
    const anonymousDownloadCount = anonymousDownloads.length;
    
    const totalDownloadCount = registeredDownloadCount + anonymousDownloadCount;
    
    return jsonResponse({
      totalDownloads: totalDownloadCount,
      registeredDownloads: registeredDownloadCount,
      anonymousDownloads: anonymousDownloadCount,
      lastUpdated: new Date().toISOString()
    });
  }

  // Visitor heartbeat endpoint - called periodically to maintain presence
  if (url.pathname === "/api/visitor-heartbeat" && request.method === "POST") {
    let payload: { userId?: string; isGuest?: boolean };
    try {
      payload = await readJsonBody<{ userId?: string; isGuest?: boolean }>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const userId = payload.userId || "guest";
    const isGuest = payload.isGuest !== false; // Default to guest if not specified
    
    const now = Date.now();
    activeVisitors.set(userId, {
      userId,
      lastSeen: now,
      isGuest
    });
    
    console.log(`Visitor heartbeat: ${userId} (guest: ${isGuest})`);
    return jsonResponse({ ok: true, activeCount: activeVisitors.size });
  }

  // Visitor leave endpoint - called when user explicitly leaves
  if (url.pathname === "/api/visitor-leave" && request.method === "POST") {
    let payload: { userId?: string };
    try {
      payload = await readJsonBody<{ userId?: string }>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const userId = payload.userId || "guest";
    activeVisitors.delete(userId);
    console.log(`Visitor left: ${userId}`);
    return jsonResponse({ ok: true, activeCount: activeVisitors.size });
  }

  if (url.pathname === "/api/activity" && request.method === "POST") {
    let payload: Partial<ActivityItem>;
    try {
      payload = await readJsonBody<Partial<ActivityItem>>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const action = String(payload.action ?? "").trim();
    if (!action) return jsonResponse({ error: "Action is required" }, { status: 400 });

    const item: ActivityItem = {
      action,
      detail: String(payload.detail ?? ""),
      user: normalizeEmail(payload.user) || "guest",
      at: new Date().toISOString(),
    };
    const activity = await readStoreCollection<ActivityItem>("activity");
    await writeStoreCollection("activity", [item, ...activity].slice(0, 120));
    return jsonResponse(item, { status: 201 });
  }

  if (url.pathname === "/api/chats" && request.method === "GET") {
    const requestedEmail = String(url.searchParams.get("email") ?? "");
    if (!requestedEmail) {
      return jsonResponse({ error: "Email query parameter is required" }, { status: 400 });
    }
    return jsonResponse(await listChatThreadsForEmail(requestedEmail));
  }

  const chatStreamMatch = url.pathname.match(/^\/api\/chats\/(\d+)\/(.+)\/stream$/);
  if (chatStreamMatch && request.method === "GET") {
    const vehicleId = Number(chatStreamMatch[1]);
    const email = decodeURIComponent(chatStreamMatch[2]);
    const threadKey = getChatKey(vehicleId, email);
    let sendFn: (data: unknown) => void;
    const channel = createSseChannel(() => {
      const subscribers = chatSubscribers.get(threadKey);
      if (!subscribers) return;
      subscribers.delete(sendFn);
      if (subscribers.size === 0) {
        chatSubscribers.delete(threadKey);
      }
    });
    sendFn = (data: unknown) => channel.send(data);
    const currentSubscribers = chatSubscribers.get(threadKey) ?? new Set<(data: unknown) => void>();
    currentSubscribers.add(sendFn);
    chatSubscribers.set(threadKey, currentSubscribers);
    return channel.response;
  }

  const chatMatch = url.pathname.match(/^\/api\/chats\/(\d+)\/(.+)$/);
  if (chatMatch && request.method === "GET") {
    const thread = await readChatThread(Number(chatMatch[1]), decodeURIComponent(chatMatch[2]));
    return jsonResponse(thread.messages);
  }

  if (chatMatch && request.method === "POST") {
    let payload: Partial<ChatMessage>;
    try {
      payload = await readJsonBody<Partial<ChatMessage>>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const body = String(payload.body ?? "").trim();
    if (!body) return jsonResponse({ error: "Message body is required" }, { status: 400 });

    const thread = await readChatThread(Number(chatMatch[1]), decodeURIComponent(chatMatch[2]));
    const message: ChatMessage = {
      from: payload.from === "admin" ? "admin" : "user",
      body,
      at: new Date().toISOString(),
    };
    thread.messages = [...thread.messages, message];
    await writeChatThread(thread);
    broadcastChatMessage(thread.key, message);
    return jsonResponse(thread.messages, { status: 201 });
  }

  if (url.pathname === "/api/vehicles" && request.method === "GET") {
    return jsonResponse(await readStoreCollection<Vehicle>("vehicles"));
  }

  if (url.pathname === "/api/vehicles" && request.method === "POST") {
    let vehicle: Vehicle;
    try {
      const contentType = request.headers.get("content-type") ?? "";
      vehicle = contentType.includes("multipart/form-data")
        ? await vehicleFromMultipartForm(await request.formData())
        : await readJsonBody<Vehicle>(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid vehicle body" }, { status: 400 });
    }
    const vehicles = await readStoreCollection<Vehicle>("vehicles");
    
    // Check if vehicle ID already exists and generate new one if needed
    if (vehicles.some((item) => item.id === vehicle.id)) {
      vehicle.id = createNumericId();
    }
    
    const nextVehicles = [vehicle, ...vehicles];
    await writeStoreCollection("vehicles", nextVehicles);
    return jsonResponse(vehicle, { status: 201 });
  }

  console.log(`Request: ${request.method} ${url.pathname}`);
  
  const vehicleMatch = url.pathname.match(/^\/api\/vehicles\/(\d+)$/);
  console.log(`Vehicle match result:`, vehicleMatch);
  
  if (vehicleMatch && request.method === "GET") {
    const id = Number(vehicleMatch[1]);
    const vehicles = await readStoreCollection<Vehicle>("vehicles");
    const vehicle = vehicles.find((item) => item.id === id);
    return vehicle ? jsonResponse(vehicle) : jsonResponse({ error: "Vehicle not found" }, { status: 404 });
  }

  if (vehicleMatch && request.method === "DELETE") {
    const id = Number(vehicleMatch[1]);
    try {
      console.log(`Attempting to delete vehicle with ID: ${id} (type: ${typeof id})`);
      
      // First check if vehicle exists
      const vehicles = await readStoreCollection<Vehicle>("vehicles");
      console.log(`Current vehicles in database: ${vehicles.length}`);
      
      const vehicleToDelete = vehicles.find((item) => {
        console.log(`Comparing vehicle ID ${item.id} (type: ${typeof item.id}) with ${id}`);
        return Number(item.id) === id;
      });
      
      if (!vehicleToDelete) {
        console.error(`Vehicle with ID ${id} not found in database`);
        return jsonResponse({ error: "Vehicle not found in database" }, { status: 404 });
      }
      
      console.log(`Found vehicle to delete: ${vehicleToDelete.name} (ID: ${vehicleToDelete.id})`);
      
      // Use direct delete function for PostgreSQL
      const deleted = await deleteFromStoreCollection<Vehicle>("vehicles", (item) => Number(item.id) === id);
      
      if (!deleted) {
        console.error(`Failed to delete vehicle with ID ${id}`);
        return jsonResponse({ error: "Failed to delete vehicle" }, { status: 500 });
      }
      
      // Verify deletion by reading back from database
      const verificationVehicles = await readStoreCollection<Vehicle>("vehicles");
      const stillExists = verificationVehicles.some((item) => Number(item.id) === id);
      
      if (stillExists) {
        console.error(`Vehicle with ID ${id} still exists after deletion attempt`);
        return jsonResponse({ error: "Deletion failed - vehicle still exists in database" }, { status: 500 });
      }
      
      console.log(`Successfully deleted vehicle with ID ${id}. Remaining vehicles: ${verificationVehicles.length}`);
      return jsonResponse({ ok: true, remainingCount: verificationVehicles.length });
    } catch (error) {
      console.error(`Error deleting vehicle with ID ${id}:`, error);
      return jsonResponse({ error: error instanceof Error ? error.message : "Failed to delete vehicle" }, { status: 500 });
    }
  }

  // Log unmatched API routes for debugging
  if (url.pathname.startsWith("/api/")) {
    console.log(`Unmatched API route: ${request.method} ${url.pathname}`);
  }

  if (url.pathname === "/api/track-download" && request.method === "POST") {
    let payload: { email?: unknown; vehicleId?: unknown; vehicleName?: unknown; timestamp?: unknown };
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const email = normalizeEmail(payload.email);
    const vehicleId = Number(payload.vehicleId);
    const vehicleName = String(payload.vehicleName ?? "");
    const timestamp = String(payload.timestamp ?? new Date().toISOString());

    if (!email || !vehicleId || !vehicleName) {
      return jsonResponse({ error: "Email, vehicleId, and vehicleName are required" }, { status: 400 });
    }

    const users = await readUsersRecord();
    const user = users[email];
    if (!user) {
      return jsonResponse({ error: "User not found" }, { status: 404 });
    }

    if (!user.downloads) {
      user.downloads = [];
    }

    // Check if user already downloaded this vehicle
    const existingDownload = user.downloads.find(d => d.vehicleId === vehicleId);
    if (existingDownload) {
      // Update existing download as completed
      existingDownload.completed = true;
      existingDownload.timestamp = timestamp;
    } else {
      // Add new download record
      user.downloads.push({
        vehicleId,
        vehicleName,
        timestamp,
        completed: true
      });
    }

    await writeUsersRecord(users);
    return jsonResponse({ ok: true, downloads: user.downloads });
  }

  if (url.pathname === "/api/track-anonymous-download" && request.method === "POST") {
    let payload: { vehicleId?: unknown; vehicleName?: unknown; timestamp?: unknown };
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Invalid JSON body" }, { status: 400 });
    }

    const vehicleId = Number(payload.vehicleId);
    const vehicleName = String(payload.vehicleName ?? "");
    const timestamp = String(payload.timestamp ?? new Date().toISOString());

    if (!vehicleId || !vehicleName) {
      return jsonResponse({ error: "VehicleId and vehicleName are required" }, { status: 400 });
    }

    const anonymousDownloads = await readStoreCollection<AnonymousDownload>("anonymous-downloads");
    const existingDownload = anonymousDownloads.find(d => d.vehicleId === vehicleId);
    
    if (existingDownload) {
      existingDownload.count++;
      existingDownload.timestamp = timestamp;
    } else {
      anonymousDownloads.push({
        vehicleId,
        vehicleName,
        timestamp,
        count: 1
      });
    }

    await writeStoreCollection("anonymous-downloads", anonymousDownloads);
    return jsonResponse({ ok: true });
  }

  if (url.pathname === "/api/anonymous-downloads" && request.method === "GET") {
    return jsonResponse(await readStoreCollection<AnonymousDownload>("anonymous-downloads"));
  }

  return jsonResponse({ error: "API route not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiRequest(request);
      if (apiResponse) return apiResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
