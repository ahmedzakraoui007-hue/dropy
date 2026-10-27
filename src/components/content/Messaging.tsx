"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { fetchProfileCards } from "@/lib/profile-cards";
import { useSearchParams } from "next/navigation";
import { Send, Search, ArrowLeft, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  brief_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

interface Conversation {
  brief_id: string;
  brief_title: string;
  other_party_id: string;
  other_party_name: string;
  other_party_avatar: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
}

function shortTime(date: string | null) {
  if (!date) return "";
  const d = new Date(date);
  return isToday(d) ? format(d, "HH:mm") : format(d, "dd/MM");
}

export function Messaging({ userRole }: { userRole: "seller" | "creator" }) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.messaging.${key}`);
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const briefIdParam = searchParams.get("briefId");
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);

  const selectedConv = conversations.find((c) => c.brief_id === selectedId) || null;
  selectedRef.current = selectedId;

  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    let briefs: any[] = [];
    if (userRole === "creator") {
      const { data } = await supabase
        .from("content_briefs")
        .select("id, title, selected_creator_id, store:stores(name, logo_url, vendor_id)")
        .eq("selected_creator_id", user.id);
      briefs = data || [];
    } else {
      const { data: stores } = await supabase.from("stores").select("id").eq("vendor_id", user.id);
      const storeIds = (stores || []).map((s) => s.id);
      if (storeIds.length) {
        const { data } = await supabase
          .from("content_briefs")
          .select("id, title, selected_creator_id, store:stores(name, logo_url, vendor_id)")
          .in("store_id", storeIds)
          .not("selected_creator_id", "is", null);
        briefs = data || [];
      }
    }

    const briefIds = briefs.map((b) => b.id);
    const { data: allMessages } = briefIds.length
      ? await supabase
          .from("content_messages")
          .select("brief_id, message, created_at, receiver_id, is_read")
          .in("brief_id", briefIds)
          .order("created_at", { ascending: false })
      : { data: [] as any[] };

    const cards = userRole === "seller" ? await fetchProfileCards(supabase, briefs.map((b) => b.selected_creator_id)) : new Map();

    const list: Conversation[] = briefs.map((brief) => {
      const store = Array.isArray(brief.store) ? brief.store[0] : brief.store;
      const msgs = (allMessages || []).filter((m) => m.brief_id === brief.id);
      const card = cards.get(brief.selected_creator_id);
      return {
        brief_id: brief.id,
        brief_title: brief.title,
        other_party_id: userRole === "creator" ? store?.vendor_id || "" : brief.selected_creator_id,
        other_party_name: userRole === "creator" ? store?.name || tr("seller") : card?.full_name || tr("creator"),
        other_party_avatar: userRole === "creator" ? store?.logo_url || "" : card?.avatar_url || "",
        last_message: msgs[0]?.message || tr("start"),
        last_message_at: msgs[0]?.created_at || null,
        unread_count: msgs.filter((m) => m.receiver_id === user.id && !m.is_read).length,
      };
    });

    list.sort((a, b) => (b.last_message_at || "").localeCompare(a.last_message_at || ""));
    setConversations(list);
    setIsLoading(false);
    return list;
  }, [supabase, userRole]);

  const loadMessages = useCallback(
    async (briefId: string) => {
      const { data } = await supabase
        .from("content_messages")
        .select("*")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
      if (selectedRef.current !== briefId) return;
      setMessages((prev) => {
        const pending = prev.filter((m) => m.id.startsWith("temp-") && m.brief_id === briefId);
        return [...(data || []), ...pending];
      });
    },
    [supabase]
  );

  const markRead = useCallback(
    async (briefId: string) => {
      if (!userId) return;
      await supabase
        .from("content_messages")
        .update({ is_read: true })
        .eq("brief_id", briefId)
        .eq("receiver_id", userId)
        .eq("is_read", false);
      setConversations((prev) => prev.map((c) => (c.brief_id === briefId ? { ...c, unread_count: 0 } : c)));
    },
    [supabase, userId]
  );

  useEffect(() => {
    loadConversations().then((list) => {
      if (briefIdParam && list?.some((c) => c.brief_id === briefIdParam)) setSelectedId(briefIdParam);
    });
  }, [loadConversations, briefIdParam]);

  useEffect(() => {
    if (!selectedId) return;
    setMessages([]);
    loadMessages(selectedId).then(() => markRead(selectedId));
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadMessages(selectedId);
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedId, loadMessages, markRead]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`content_messages_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_messages", filter: `receiver_id=eq.${userId}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.brief_id === selectedRef.current) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            markRead(msg.brief_id);
          }
          setConversations((prev) =>
            prev.map((c) =>
              c.brief_id === msg.brief_id
                ? {
                    ...c,
                    last_message: msg.message,
                    last_message_at: msg.created_at,
                    unread_count: msg.brief_id === selectedRef.current ? 0 : c.unread_count + 1,
                  }
                : c
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, markRead]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !selectedConv || !userId || sending) return;

    setSending(true);
    setNewMessage("");
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      brief_id: selectedConv.brief_id,
      sender_id: userId,
      receiver_id: selectedConv.other_party_id,
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const { data, error } = await supabase
      .from("content_messages")
      .insert({ brief_id: tempMsg.brief_id, sender_id: userId, receiver_id: tempMsg.receiver_id, message: text })
      .select()
      .single();

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(text);
      toast.error(tr("send_error"));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data : m)));
      setConversations((prev) =>
        prev.map((c) => (c.brief_id === data.brief_id ? { ...c, last_message: data.message, last_message_at: data.created_at } : c))
      );
    }
    setSending(false);
  };

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.other_party_name.toLowerCase().includes(q) || c.brief_title.toLowerCase().includes(q);
  });

  const missionHref = (briefId: string) =>
    userRole === "creator" ? `/creator/missions/${briefId}` : `/seller/content/briefs/${briefId}`;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] bg-card border rounded-2xl overflow-hidden">
      <div className={cn("w-full md:w-80 border-r flex flex-col", selectedConv && "hidden md:flex")}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tr("search")}
              className="pl-10 bg-muted/50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">{tr("loading")}</p>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              {conversations.length === 0
                ? userRole === "creator"
                  ? tr("empty_creator")
                  : tr("empty_seller")
                : tr("no_result")}
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.brief_id}
                onClick={() => setSelectedId(conv.brief_id)}
                className={cn(
                  "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                  selectedId === conv.brief_id && "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conv.other_party_avatar} />
                    <AvatarFallback>{conv.other_party_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className={cn("text-sm truncate", conv.unread_count ? "font-bold" : "font-semibold")}>{conv.other_party_name}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{shortTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium">{conv.brief_title}</p>
                    <p className={cn("text-xs truncate mt-0.5", conv.unread_count ? "text-foreground font-semibold" : "text-muted-foreground")}>
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={cn("flex-1 flex flex-col bg-muted/20 min-w-0", !selectedConv && "hidden md:flex items-center justify-center text-muted-foreground")}>
        {selectedConv ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="shrink-0">
                  <AvatarImage src={selectedConv.other_party_avatar} />
                  <AvatarFallback>{selectedConv.other_party_name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{selectedConv.other_party_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{selectedConv.brief_title}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={missionHref(selectedConv.brief_id)}>
                  <ExternalLink className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{tr("view_mission")}</span>
                </Link>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground mt-10">
                  Aucun message pour l&apos;instant. Présentez-vous et précisez les détails de la mission.
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const mine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] md:max-w-[70%] p-3 rounded-2xl text-sm whitespace-pre-wrap break-words",
                            mine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none",
                            msg.id.startsWith("temp-") && "opacity-60"
                          )}
                        >
                          {msg.message}
                          <p className={cn("text-[10px] mt-1 text-right opacity-70", mine ? "text-primary-foreground" : "text-muted-foreground")}>
                            {format(new Date(msg.created_at), isToday(new Date(msg.created_at)) ? "HH:mm" : "dd/MM HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-card">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={tr("write")}
                  className="bg-muted/50 border-none"
                  value={newMessage}
                  maxLength={4000}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="shrink-0 bg-primary">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold">{tr("title")}</h3>
            <p className="max-w-xs mx-auto mt-2">{tr("select")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
