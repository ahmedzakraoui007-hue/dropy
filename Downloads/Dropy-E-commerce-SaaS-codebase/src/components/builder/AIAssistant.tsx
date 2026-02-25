"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  Wand2, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Plus,
  RefreshCcw,
  Layout,
  Type,
  Image as ImageIcon,
  Zap,
  TrendingUp,
  BarChart,
  Eye,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Message {
  role: "assistant" | "user";
  content: string;
  type?: "text" | "suggestion" | "action" | "report";
  actionData?: any;
}

interface AIAssistantProps {
  onClose: () => void;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  onAddSection: (type: string, data?: any) => void;
}

export default function AIAssistant({ onClose, sections, onUpdateSections, onAddSection }: AIAssistantProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant Dropy AI. Comment puis-je vous aider à optimiser votre boutique aujourd'hui ?",
      type: "text"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;

    if (!text) setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulated AI Logic
    setTimeout(() => {
      let response: Message = {
        role: "assistant",
        content: "Je peux vous aider avec ça. Voici une proposition basée sur les meilleures pratiques e-commerce.",
        type: "text"
      };

      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes("titre") || lowerInput.includes("headline")) {
        response.content = "Voici 5 variations de titres accrocheurs pour votre Hero section :";
        response.type = "suggestion";
        response.actionData = {
          type: "text_variations",
          items: [
            "Élevez votre style avec notre collection exclusive",
            "Le luxe accessible, livré chez vous en 24h",
            "La mode tunisienne réinventée pour vous",
            "Exprimez votre personnalité avec nos accessoires uniques",
            "La qualité artisanale au service de votre élégance"
          ]
        };
      } else if (lowerInput.includes("about") || lowerInput.includes("histoire") || lowerInput.includes("crée une section")) {
        response.content = "J'ai généré une section complète qui raconte l'histoire de votre marque de manière engageante.";
        response.type = "action";
        response.actionData = {
          label: "Ajouter la section À Propos",
          type: "add_section",
          sectionType: "features",
          data: {
            title: "Notre Histoire",
            subtitle: "Passion, Qualité et Artisanat",
            description: "Depuis nos débuts, nous nous efforçons de proposer des produits qui allient tradition et modernité. Chaque pièce est sélectionnée avec soin pour garantir une expérience unique à nos clients tunisiens.",
            items: [
              { title: "Artisanat", description: "Savoir-faire local et authentique" },
              { title: "Qualité", description: "Matériaux premium sélectionnés" },
              { title: "Livraison", description: "Partout en Tunisie sous 48h" }
            ]
          }
        };
      } else if (lowerInput.includes("seo") || lowerInput.includes("optimise")) {
        response.content = "Voici une analyse SEO de votre page actuelle avec des recommandations d'optimisation.";
        response.type = "report";
        response.actionData = {
          type: "seo_report",
          score: 72,
          items: [
            { label: "Meta Title", value: "Boutique Fashion Tunisie", status: "optimized" },
            { label: "Meta Description", value: "Manquante ou trop courte", status: "error", suggestion: "Ajoutez une description de 155 caractères." },
            { label: "Balise H1", value: "Correcte", status: "optimized" },
            { label: "Alt Text", value: "3 images manquantes", status: "warning", suggestion: "Ajoutez des textes alternatifs." }
          ]
        };
      } else if (lowerInput.includes("suggestion") || lowerInput.includes("moche") || lowerInput.includes("améliorer")) {
        response.content = "J'ai analysé votre page. Voici quelques suggestions pour améliorer la conversion (+15% estimés) :";
        response.type = "report";
        response.actionData = {
          type: "recommendations",
          score: 85,
          items: [
            { label: "Confiance", value: "Manque de témoignages", status: "warning", action: "Ajouter Testimonials" },
            { label: "Urgence", value: "Pas de compte à rebours", status: "info", action: "Ajouter Countdown" },
            { label: "Navigation", value: "Menu trop simple", status: "info", action: "Ajouter Mega Menu" }
          ]
        };
      } else {
        response.content = "Désolé, je n'ai pas compris votre demande. Je peux vous aider à générer du contenu, optimiser votre SEO, ou suggérer des améliorations de layout.";
      }

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1200);
  };

  const applyAction = (action: any) => {
    if (action.type === "add_section") {
      onAddSection(action.sectionType, action.data);
      toast.success(`Section "${action.data.title || action.sectionType}" ajoutée !`);
    } else if (action.type === "text_variations") {
      // In a real app, we'd update a specific field
      navigator.clipboard.writeText(action.value);
      toast.success("Copié dans le presse-papier !");
    }
  };

  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="fixed right-0 top-0 bottom-0 w-[400px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistant Dropy AI</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">En ligne</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                message.role === "assistant" 
                  ? "bg-violet-100 text-violet-600" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {message.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[85%] ${message.role === "user" ? "items-end" : ""}`}>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  message.role === "assistant" 
                    ? "bg-muted/50 rounded-tl-none border border-border/50" 
                    : "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/20"
                }`}>
                  {message.content}
                </div>

                {message.type === "suggestion" && message.actionData?.type === "text_variations" && (
                  <div className="space-y-2 mt-2">
                    {message.actionData.items.map((item: string, i: number) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-auto py-2 text-left group hover:border-primary/50 transition-all"
                        onClick={() => applyAction({ type: "text_variations", value: item })}
                      >
                        <span className="flex-1 pr-2">{item}</span>
                        <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </Button>
                    ))}
                  </div>
                )}

                {message.type === "report" && (
                  <Card className="mt-2 border-border/50 bg-muted/20 overflow-hidden">
                    <div className="p-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rapport D'Analyse</span>
                      <Badge variant={message.actionData.score > 80 ? "default" : "secondary"} className="h-5 text-[10px]">
                        Score: {message.actionData.score}/100
                      </Badge>
                    </div>
                    <CardContent className="p-3 space-y-3">
                      {message.actionData.items.map((item: any, i: number) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{item.label}</span>
                            <div className="flex items-center gap-1">
                              {item.status === "optimized" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              {item.status === "warning" && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                              {item.status === "error" && <X className="w-3.5 h-3.5 text-red-500" />}
                              <span className={
                                item.status === "optimized" ? "text-emerald-500 font-medium" :
                                item.status === "warning" ? "text-amber-500 font-medium" : 
                                item.status === "info" ? "text-blue-500 font-medium" : "text-red-500 font-medium"
                              }>{item.value}</span>
                            </div>
                          </div>
                          {item.suggestion && (
                            <p className="text-[10px] text-muted-foreground italic pl-4 border-l border-border/50 ml-1">
                              💡 {item.suggestion}
                            </p>
                          )}
                          {item.action && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-[10px] text-primary"
                              onClick={() => handleSendMessage(`Ajouter ${item.action}`)}
                            >
                              Appliquer : {item.action}
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {message.type === "action" && (
                  <Button 
                    className="w-full mt-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all" 
                    size="sm"
                    onClick={() => applyAction(message.actionData)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {message.actionData.label}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { label: "Titres", icon: Type, prompt: "Génère des titres accrocheurs" },
            { label: "SEO", icon: Search, prompt: "Analyse le SEO de cette page" },
            { label: "Suggestions", icon: TrendingUp, prompt: "Améliore ma conversion" },
            { label: "Sections", icon: Layout, prompt: "Suggère de nouvelles sections" },
            { label: "Images", icon: ImageIcon, prompt: "Optimise mes images" }
          ].map((btn) => (
            <Badge 
              key={btn.label}
              variant="outline" 
              className="cursor-pointer hover:bg-muted transition-colors whitespace-nowrap px-3 py-1.5 gap-1.5 border-border/50 bg-background"
              onClick={() => handleSendMessage(btn.prompt)}
            >
              <btn.icon className="w-3.5 h-3.5 text-primary" /> 
              {btn.label}
            </Badge>
          ))}
        </div>
        <div className="relative">
          <Input 
            placeholder="Comment puis-je vous aider ?" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-background pr-12 h-11 rounded-xl focus-visible:ring-violet-500"
          />
          <Button 
            size="icon" 
            onClick={() => handleSendMessage()} 
            disabled={isLoading}
            className={`absolute right-1 top-1 h-9 w-9 rounded-lg transition-all ${
              input.trim() ? "bg-violet-600" : "bg-muted text-muted-foreground"
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Zap className="w-3 h-3 text-amber-500" />
          <p className="text-[10px] text-muted-foreground font-medium">
            Propulsé par Dropy AI Intelligence
          </p>
        </div>
      </div>
    </motion.div>
  );
}
