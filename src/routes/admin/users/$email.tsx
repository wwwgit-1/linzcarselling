import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { apiGet, apiSend } from "@/lib/api";

export const Route = createFileRoute("/admin/users/$email")({
  component: AdminUserDetailPage,
});

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
}

interface ActivityItem {
  action: string;
  detail: string;
  user: string;
  at: string;
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

const CURRENT_USER_KEY = "linz-current-user";

function AdminUserDetailPage() {
  const { email } = Route.useParams();
  const decodedEmail = decodeURIComponent(email);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  // Chat state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) ?? "null") as StoredUser | null;
    if (current?.role !== "admin") {
      window.location.href = "/";
      return;
    }

    void Promise.all([
      apiGet<Record<string, StoredUser>>("/api/users"),
      apiGet<ActivityItem[]>("/api/activity"),
      apiGet<ChatThread[]>(`/api/chats?email=${encodeURIComponent(decodedEmail)}`),
    ])
      .then(([users, activityItems, chatThreads]) => {
        setUser(users[decodedEmail.toLowerCase()] ?? null);
        setActivity(activityItems);
        setThreads(chatThreads ?? []);
        if ((chatThreads ?? []).length > 0) setSelectedThreadKey(chatThreads[0].key);
      })
      .catch(console.error);

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [decodedEmail]);

  const userActivity = useMemo(
    () => activity.filter((item) => item.user.toLowerCase() === decodedEmail.toLowerCase()),
    [activity, decodedEmail],
  );

  const selectedThread = useMemo(() => threads.find((t) => t.key === selectedThreadKey) ?? null, [threads, selectedThreadKey]);

  useEffect(() => {
    // open SSE when a thread is selected
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
        const data = JSON.parse(ev.data) as { message: ChatMessage } | ChatMessage;
        const msg = (data as any).message ?? data;
        setThreads((prev) => prev.map((t) => (t.key === selectedThreadKey ? { ...t, messages: [...t.messages, msg] } : t)));
      } catch (e) {
        console.error(e);
      }
    };
    es.onerror = (e) => {
      // console.warn('SSE error', e);
    };
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
      const messages = await apiSend<ChatMessage[]>(`/api/chats/${vehicleId}/${encodeURIComponent(decodedEmail)}`, "POST", { from: "admin", body });
      setThreads((prev) => prev.map((t) => (t.key === selectedThread.key ? { ...t, messages } : t)));
      setMessageText("");
    } catch (e) {
      console.error(e);
      alert("Message not sent");
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#e8a838]">User Activity</div>
            <h1 className="mt-2 font-display text-4xl font-bold">{user?.username ?? decodedEmail}</h1>
            <p className="mt-2 text-white/60">Activity history and account/location context for this specific user.</p>
          </div>
          <a href="/admin" className="rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]">
            Back to admin
          </a>
        </div>

        {user ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <DetailCard label="Email" value={user.email} />
              <DetailCard label="Country" value={user.country || "Not set"} />
              <DetailCard label="Residence" value={user.location || "Not set"} />
              <DetailCard label="Role" value={user.role || "user"} />
              <DetailCard label="VPN" value={user.vpnActive == null ? "Unknown" : user.vpnActive ? "Active" : "No"} />
              <DetailCard label="VPN Location" value={user.vpnLocation || "Not recorded"} />
              <DetailCard label="Actual Location" value={user.actualLocation || "Not recorded"} />
              <DetailCard label="Last Seen" value={user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "Not recorded"} />
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-display text-xl font-bold">Activity History</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-white/45">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivity.map((item, index) => (
                      <tr key={`${item.at}-${index}`} className="bg-white/[0.055]">
                        <td className="rounded-l-xl px-3 py-3 text-white/60">{new Date(item.at).toLocaleString()}</td>
                        <td className="px-3 py-3 font-semibold">{item.action}</td>
                        <td className="rounded-r-xl px-3 py-3 text-white/65">{item.detail || "No detail"}</td>
                      </tr>
                    ))}
                    {userActivity.length === 0 && (
                      <tr className="bg-white/[0.055]">
                        <td className="rounded-xl px-3 py-5 text-white/60" colSpan={3}>
                          No activity recorded for this user yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="font-display text-xl font-bold mb-4">Message Threads</h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-2 max-h-[300px] overflow-y-auto">
                  {threads.length === 0 && <div className="text-white/60 text-sm">No threads found.</div>}
                  {threads.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setSelectedThreadKey(t.key)}
                      className={`w-full text-left rounded-xl px-4 py-3 transition-all ${
                        t.key === selectedThreadKey 
                          ? "bg-amber text-navy font-semibold shadow-lg" 
                          : "hover:bg-white/[0.08] border border-white/10"
                      }`}>
                      <div className="text-sm font-medium truncate">{t.key}</div>
                      <div className="text-xs mt-1 opacity-70 truncate">
                        {t.messages[t.messages.length - 1]?.body ?? "No messages"}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-3 flex flex-col">
                  <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/10 p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {(!selectedThread || selectedThread.messages.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-white/60">
                        <div className="text-center">
                          <i className="fa-solid fa-comments text-4xl mb-3 opacity-30" />
                          <p>No messages yet. Start a conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedThread.messages.map((m, i) => (
                          <div 
                            key={`${m.at}-${i}`} 
                            className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                              m.from === "admin" 
                                ? "bg-amber text-navy" 
                                : "bg-white/[0.08] text-white border border-white/10"
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold opacity-70">
                                  {m.from === "admin" ? "You" : user?.username || "User"}
                                </span>
                                <span className="text-xs opacity-50">
                                  {new Date(m.at).toLocaleString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="text-sm leading-relaxed">{m.body}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <input 
                      value={messageText} 
                      onChange={(e) => setMessageText(e.target.value)} 
                      placeholder="Type your message..."
                      className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all text-white placeholder:text-white/40"
                    />
                    <button 
                      onClick={sendAdminMessage} 
                      className="rounded-xl bg-amber px-6 py-3 font-bold text-navy hover:bg-amber/90 transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-paper-plane" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70">User not found.</div>
        )}
      </div>
    </main>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-2 break-words font-semibold">{value}</div>
    </div>
  );
}
