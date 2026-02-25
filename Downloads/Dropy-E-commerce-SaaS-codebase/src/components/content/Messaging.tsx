"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Send, 
  Search, 
  Paperclip, 
  Image as ImageIcon, 
  MoreVertical,
  ArrowLeft,
  Circle,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  brief_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface Conversation {
  brief_id: string;
  brief_title: string;
  other_party_id: string;
  other_party_name: string;
  other_party_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function Messaging({ userRole }: { userRole: 'seller' | 'creator' }) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const briefIdParam = searchParams.get("briefId");
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      
      // Get all briefs where user is involved
      let briefs: any[] = [];
      
      if (userRole === "creator") {
          // Get briefs where creator has applied or is assigned
          const { data: applications } = await supabase
            .from("content_applications")
            .select(`
              brief_id,
              brief:content_briefs(
                id,
                title,
                store_id,
                selected_creator_id,
                store:stores(name, logo_url, seller_id)
              )
            `)
            .eq("creator_id", user.id)
            .eq("status", "accepted");
            
          briefs = applications?.map(a => a.brief).filter(Boolean) || [];
        } else {
          // Get seller's store first
          const { data: stores } = await supabase
            .from("stores")
            .select("id")
            .eq("seller_id", user.id);
            
          const storeIds = stores?.map(s => s.id) || [];
          
          if (storeIds.length > 0) {
            // Get briefs owned by seller's stores with assigned creators
            const { data: sellerBriefs } = await supabase
              .from("content_briefs")
              .select(`
                id,
                title,
                selected_creator_id,
                store:stores(name, logo_url, seller_id),
                creator:profiles!content_briefs_selected_creator_id_fkey(id, full_name, avatar_url)
              `)
              .in("store_id", storeIds)
              .not("selected_creator_id", "is", null);
              
            briefs = sellerBriefs || [];
          }
        }
      
        // Build conversations from briefs (deduplicate by brief_id)
        const convMap = new Map<string, Conversation>();
        
        for (const brief of briefs) {
          if (!brief || convMap.has(brief.id)) continue;
        
        let otherPartyId = "";
        let otherPartyName = "";
        let otherPartyAvatar = "";
        
        if (userRole === "creator") {
          otherPartyId = brief.store?.seller_id || "";
          otherPartyName = brief.store?.name || "Vendeur";
          otherPartyAvatar = brief.store?.logo_url || "";
        } else {
          otherPartyId = brief.selected_creator_id || "";
          otherPartyName = brief.creator?.full_name || "Créateur";
          otherPartyAvatar = brief.creator?.avatar_url || "";
        }
        
        // Get last message for this brief
        const { data: lastMsg } = await supabase
          .from("content_messages")
          .select("message, created_at")
          .eq("brief_id", brief.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
          convMap.set(brief.id, {
            brief_id: brief.id,
            brief_title: brief.title,
            other_party_id: otherPartyId,
            other_party_name: otherPartyName,
            other_party_avatar: otherPartyAvatar,
            last_message: lastMsg?.message || "Démarrer la conversation",
            last_message_at: lastMsg?.created_at || new Date().toISOString(),
            unread_count: 0
          });
        }
        
        const convList = Array.from(convMap.values());
        setConversations(convList);
      
        // If briefId param is provided, auto-select that conversation
        if (briefIdParam) {
          const existingConv = convList.find(c => c.brief_id === briefIdParam);
          if (existingConv) {
            setSelectedConv(existingConv);
          } else {
            // Create a temp conversation for this brief
            const { data: briefData } = await supabase
              .from("content_briefs")
              .select(`
                id,
                title,
                selected_creator_id,
                store:stores(name, logo_url, seller_id),
                creator:profiles!content_briefs_selected_creator_id_fkey(id, full_name, avatar_url)
              `)
              .eq("id", briefIdParam)
              .single();
              
            if (briefData) {
              let otherPartyId = "";
              let otherPartyName = "";
              let otherPartyAvatar = "";
              
              if (userRole === "creator") {
                otherPartyId = briefData.store?.seller_id || "";
                otherPartyName = briefData.store?.name || "Vendeur";
                otherPartyAvatar = briefData.store?.logo_url || "";
              } else {
                otherPartyId = briefData.selected_creator_id || "";
                otherPartyName = (briefData.creator as any)?.full_name || "Créateur";
                otherPartyAvatar = (briefData.creator as any)?.avatar_url || "";
              }
              
              const newConv: Conversation = {
                brief_id: briefData.id,
                brief_title: briefData.title,
                other_party_id: otherPartyId,
                other_party_name: otherPartyName,
                other_party_avatar: otherPartyAvatar,
                last_message: "Démarrer la conversation",
                last_message_at: new Date().toISOString(),
                unread_count: 0
              };
              
              // Add only if not already in list
              setConversations(prev => {
                if (prev.some(c => c.brief_id === newConv.brief_id)) return prev;
                return [newConv, ...prev];
              });
              setSelectedConv(newConv);
            }
          }
        }
      
      setIsLoading(false);
    }
    
    async function loadMessages(briefId: string) {
      const { data: msgs } = await supabase
        .from("content_messages")
        .select("*")
        .eq("brief_id", briefId)
        .order("created_at", { ascending: true });
        
      setMessages(msgs || []);
    }
    
    init();

    // Realtime subscription
    const channel = supabase
      .channel("content_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_messages" },
        (payload) => {
          if (selectedConv && (payload.new.sender_id === selectedConv.other_party_id || payload.new.receiver_id === selectedConv.other_party_id)) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, briefIdParam, userRole]);

  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (!selectedConv) return;
      
      const { data: msgs } = await supabase
        .from("content_messages")
        .select("*")
        .eq("brief_id", selectedConv.brief_id)
        .order("created_at", { ascending: true });
        
      setMessages(msgs || []);
    }
    
    loadMessages();
  }, [selectedConv, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !currentUser) return;

    const msgToSend = newMessage;
    setNewMessage("");
    
    // Add message locally immediately
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      brief_id: selectedConv.brief_id,
      sender_id: currentUser.id,
      receiver_id: selectedConv.other_party_id,
      message: msgToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await supabase
      .from("content_messages")
      .insert({
        brief_id: selectedConv.brief_id,
        sender_id: currentUser.id,
        receiver_id: selectedConv.other_party_id,
        message: msgToSend
      })
      .select()
      .single();

    if (data) {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-card border rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col",
        selectedConv && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-10 bg-muted/50 border-none" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {conversations.map((conv, idx) => (
                <div
                  key={`${conv.brief_id}-${idx}`}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedConv?.brief_id === conv.brief_id && "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conv.other_party_avatar} />
                    <AvatarFallback>{conv.other_party_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-sm truncate">{conv.other_party_name}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(conv.last_message_at), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium">{conv.brief_title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-muted/20",
        !selectedConv && "hidden md:flex items-center justify-center text-muted-foreground"
      )}>
        {selectedConv ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setSelectedConv(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedConv.other_party_avatar} />
                  <AvatarFallback>{selectedConv.other_party_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConv.other_party_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                      <Circle className="w-2 h-2 fill-current" />
                      En ligne
                    </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] p-3 rounded-2xl text-sm",
                      msg.sender_id === currentUser?.id 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card border rounded-tl-none"
                    )}>
                      {msg.message}
                      <p className={cn(
                        "text-[10px] mt-1 text-right opacity-70",
                        msg.sender_id === currentUser?.id ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Input 
                    placeholder="Écrivez votre message..." 
                    className="bg-muted/50 border-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="shrink-0 bg-primary"
                >
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
              <h3 className="text-xl font-bold">Vos Messages</h3>
              <p className="max-w-xs mx-auto mt-2">
                Sélectionnez une conversation pour commencer à discuter avec vos partenaires.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
