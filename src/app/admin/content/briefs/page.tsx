"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminBriefsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchBriefs() {
      const { data, error } = await supabase
        .from("content_briefs")
        .select(`
          *,
          store:stores(name)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBriefs(data);
      }
      setIsLoading(false);
    }

    fetchBriefs();
  }, [supabase]);

  const filteredBriefs = briefs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.store?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Project Moderation</h1>
          <p className="text-muted-foreground">Monitor and manage all content briefs on the platform</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or store..." 
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
                  <th className="px-6 py-3">Mission</th>
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBriefs.map((brief) => (
                  <tr key={brief.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold">{brief.title}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">{brief.content_type}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{brief.store?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{brief.budget_min} - {brief.budget_max} TND</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        brief.status === "completed" ? "bg-emerald-500" : 
                        brief.status === "published" ? "bg-blue-500" : 
                        "bg-orange-500"
                      )}>
                        {brief.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(brief.created_at), "PP")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => window.open(`/seller/content/briefs/${brief.id}`, "_blank")}>
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <AlertTriangle className="w-4 h-4" /> Flag Content
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <XCircle className="w-4 h-4" /> Cancel Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
