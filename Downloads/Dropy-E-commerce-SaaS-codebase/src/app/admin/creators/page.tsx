"use client";

import { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  Search, 
  Filter, 
  ExternalLink, 
  Star,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminCreatorsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCreators() {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          profile:profiles(full_name, avatar_url, email)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCreators(data);
      }
      setIsLoading(false);
    }

    fetchCreators();
  }, [supabase]);

  const handleUpdateStatus = async (creatorId: string, userId: string, status: string) => {
    try {
      const { error: creatorError } = await supabase
        .from("creator_profiles")
        .update({ status })
        .eq("id", creatorId);

      if (creatorError) throw creatorError;

      const profileStatus = status === "approved" ? "approved" : status === "suspended" ? "suspended" : "pending";
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: profileStatus })
        .eq("id", userId);

      if (profileError) throw profileError;

      setCreators(prev => prev.map(c => 
        c.id === creatorId ? { ...c, status } : c
      ));
      toast.success(`Créateur ${status === "approved" ? "approuvé" : status === "suspended" ? "suspendu" : "mis en attente"}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const filteredCreators = creators.filter(c => 
    c.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Creator Management</h1>
          <p className="text-muted-foreground">Approve and moderate marketplace creators</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-left">
              <thead className="bg-muted text-xs uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Creator</th>
                  <th className="px-6 py-3">Specialties</th>
                  <th className="px-6 py-3">Performance</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCreators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={creator.profile?.avatar_url} />
                          <AvatarFallback>{creator.profile?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{creator.profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{creator.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {creator.specialties?.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[10px] uppercase">{s}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold">{creator.rating || "N/A"}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{creator.total_projects || 0} Projects completed</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        creator.status === "approved" ? "bg-emerald-500" : 
                        creator.status === "pending" ? "bg-orange-500" : 
                        "bg-destructive"
                      )}>
                        {creator.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {creator.status === "pending" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/10"
                              onClick={() => handleUpdateStatus(creator.id, creator.user_id, "approved")}
                            >
                              <UserCheck className="w-4 h-4 mr-1.5" />
                              Approuver
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => window.open(`/creator/profile/${creator.user_id}`, "_blank")}>
                                <ExternalLink className="w-4 h-4" /> Voir profil
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleUpdateStatus(creator.id, creator.user_id, "suspended")}>
                                <ShieldAlert className="w-4 h-4" /> Suspendre
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
