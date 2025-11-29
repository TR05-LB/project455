import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Send, Shield, KeyRound, Eye, EyeOff, WifiOff, RefreshCw } from "lucide-react";

type ChatMessage = {
  id: string;
  sender: string;
  ciphertext?: string;
  cover?: string;
  sent_at?: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const SECRET_SEQUENCE = "aezakmi";

function xorEncrypt(plain: string, key: string): string {
  if (!plain || !key) return "";
  const plainBytes = textEncoder.encode(plain);
  const keyBytes = textEncoder.encode(key);
  const out = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i += 1) {
    out[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...out));
}

function xorDecrypt(ciphertext: string, key: string): string {
  if (!ciphertext || !key) return "";
  const keyBytes = textEncoder.encode(key);
  const cipherBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const out = new Uint8Array(cipherBytes.length);
  for (let i = 0; i < cipherBytes.length; i += 1) {
    out[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return textDecoder.decode(out);
}

function decodeBase64Text(data: string): string {
  return textDecoder.decode(Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
}

function buildWsUrl() {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:3001";
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  if (trimmed.startsWith("https://")) return `wss://${trimmed.slice(8)}/ws/chat`;
  if (trimmed.startsWith("http://")) return `ws://${trimmed.slice(7)}/ws/chat`;
  return `${trimmed}/ws/chat`;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ChatPanel = () => {
  const alias = useMemo(() => `Tab-${Math.random().toString(16).slice(2, 6).toUpperCase()}`, []);
  const [sharedKey, setSharedKey] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [secretMessage, setSecretMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectDelay, setReconnectDelay] = useState(0);
  const [secretUIVisible, setSecretUIVisible] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const sequenceRef = useRef(0);

  // Toggle the hidden controls when the secret sequence is typed anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      if (!key || key.length !== 1) {
        sequenceRef.current = 0;
        return;
      }

      if (key === SECRET_SEQUENCE[sequenceRef.current]) {
        sequenceRef.current += 1;
        if (sequenceRef.current === SECRET_SEQUENCE.length) {
          sequenceRef.current = 0;
          setSecretUIVisible((prev) => {
            if (prev) {
              setSecretMessage("");
              setSharedKey("");
            }
            return !prev;
          });
        }
      } else {
        sequenceRef.current = key === SECRET_SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const wsUrl = useMemo(buildWsUrl, []);
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("connected");
      toast.success("Joined secret chat");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type !== "chat") return;
        setMessages((prev) => {
          if (!data?.id) return prev;
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("disconnected");
      toast.error("Chat connection encountered an error");
      ws.close();
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, reconnectAttempts]);

  // Start a 10-second reconnect countdown when disconnected.
  useEffect(() => {
    if (status !== "disconnected") {
      setReconnectDelay(0);
      return;
    }
    setReconnectDelay(10);
    const interval = setInterval(() => {
      setReconnectDelay((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setReconnectAttempts((n) => n + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = () => {
    const cover = coverMessage.trim();
    const secret = secretMessage.trim();
    if (!cover) {
      toast.error("Enter a cover message to send");
      return;
    }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Chat is not connected");
      return;
    }
    try {
      let ciphertext = "";
      if (secret && sharedKey) {
        ciphertext = xorEncrypt(secret, sharedKey);
      }
      if (!ciphertext) {
        const fallback = secret || cover || " ";
        ciphertext = btoa(fallback);
      }
      ws.send(JSON.stringify({ ciphertext, sender: alias, cover }));
      setSecretMessage("");
      setCoverMessage("");
    } catch (error) {
      console.error("Encrypt/send error:", error);
      toast.error("Failed to encrypt or send message");
    }
  };

  const toggleView = () => {
    setShowDecrypted((prev) => !prev);
  };

  return (
    <Card className="p-6 glass-effect">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/20">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Secret Chat (local demo)</h2>
            <p className="text-sm text-muted-foreground">
              Share the same key in two tabs. Messages are XOR-encrypted client-side and relayed via WebSocket.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`px-3 py-1 rounded-full ${
            status === "connected" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}>
            {status === "connected"
              ? "Connected"
              : reconnectDelay > 0
              ? `Reconnecting in ${reconnectDelay}s`
              : "Reconnecting..."}
          </span>
          {secretUIVisible && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs">
              Secure controls unlocked
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">You: {alias}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setReconnectAttempts((n) => n + 1)}
            disabled={status === "connecting"}
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 bg-background/70 border border-primary/10 h-[480px] flex flex-col gap-3">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Start the conversation—open another tab, enter the same key, and send an encrypted message.
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isSelf = msg.sender === alias;
                    let decrypted: string | null = null;
                    if (showDecrypted && msg.ciphertext !== undefined) {
                      try {
                        if (sharedKey) {
                          decrypted = xorDecrypt(msg.ciphertext, sharedKey);
                        }
                        if (!decrypted) {
                          decrypted = decodeBase64Text(msg.ciphertext);
                        }
                      } catch {
                        decrypted = null;
                      }
                    }
                    const cover = msg.cover || "[no cover message]";
                    const displayText = showDecrypted
                      ? decrypted ?? "[unable to decode]"
                      : cover;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? "justify-start" : "justify-end"}`}
                      >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl border shadow-sm ${
                          isSelf
                            ? "bg-primary/10 border-primary/30 rounded-bl-sm"
                            : "bg-muted/70 border-border rounded-br-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span className={isSelf ? "text-primary font-semibold" : "text-foreground/80"}>
                            {isSelf ? "You" : msg.sender}
                          </span>
                          <span>{formatTime(msg.sent_at)}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap break-words">
                          {displayText}
                        </p>
                        {showDecrypted && decrypted === null && (
                          <p className="text-xs text-destructive mt-1">Unable to decode this message</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                  <div ref={scrollAnchorRef} />
                </>
              )}
            </div>

            <div className="flex items-center gap-3 bg-background border border-border rounded-full px-4 py-2 shadow-sm">
              <Input
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                placeholder="Type your public cover message..."
                className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button onClick={sendMessage} disabled={status !== "connected"} className="gap-2">
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </Card>

          {secretUIVisible ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Secret message</label>
              <Textarea
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder="Hidden message (only visible after decrypting with the key)"
                className="min-h-[120px]"
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-muted/50 text-xs text-muted-foreground" />
          )}
        </div>

        <div className="space-y-4">
          {secretUIVisible ? (
            <>
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Shared Secret Key</span>
                </div>
                <Input
                  value={sharedKey}
                  onChange={(e) => setSharedKey(e.target.value)}
                  placeholder="Enter the agreed secret key"
                  type="password"
                />
                <p className="text-xs text-muted-foreground">
                  Both tabs must use the exact same key. Cover text is visible to everyone; the secret is encrypted.
                </p>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground text-sm">Secret View Toggle</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleView}
                    className="gap-2"
                  >
                    {showDecrypted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showDecrypted ? "Show encrypted" : "Decrypt view"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the correct key first. The button switches between the raw ciphertext and the decrypted text.
                </p>
              </Card>
            </>
          ) : (
            <Card className="p-4 space-y-2 text-xs text-muted-foreground border-dashed border-muted/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm">Secure controls locked</span>
              </div>
              <p className="invisible">Controls locked.</p>
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Troubleshooting</span>
            </div>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Keep both tabs pointed at the same server URL.</li>
              <li>Hit reconnect if the WebSocket goes idle.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Card>
  );
};
