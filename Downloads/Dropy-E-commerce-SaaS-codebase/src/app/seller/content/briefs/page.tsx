"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  MessageSquare,
  ArrowRight,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export default function BriefsListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchBriefs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!store) return;

      const { data, error } = await supabase
        .from("content_briefs")
        .select(`
          *,
          applications:content_applications(count)
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBriefs(data);
      }
      setIsLoading(false);
    }

    fetchBriefs();
  }, [supabase]);

  const filteredBriefs = briefs.filter(brief => {
    const matchesSearch = brief.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && ["published", "assigned", "in_progress"].includes(brief.status)) ||
      (activeTab === "completed" && brief.status === "completed") ||
      (activeTab === "draft" && brief.status === "draft");
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge className="bg-blue-500">Published</Badge>;
      case "assigned": return <Badge className="bg-purple-500">Assigned</Badge>;
      case "in_progress": return <Badge className="bg-orange-500">In Progress</Badge>;
      case "delivered": return <Badge className="bg-emerald-500">Delivered</Badge>;
      case "completed": return <Badge className="bg-gray-500">Completed</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Content Briefs</h1>
            <p className="text-muted-foreground">Manage your content creation missions</p>
          </div>
          <Button 
            onClick={() => router.push("/seller/content/create-brief")}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Brief
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search briefs..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredBriefs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No briefs found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven&apos;t created any content briefs yet. Start by defining your first mission!
            </p>
            <Button onClick={() => router.push("/seller/content/create-brief")}>
              Create Your First Brief
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBriefs.map((brief) => (
              <Card 
                key={brief.id} 
                className="hover:shadow-md transition-all cursor-pointer group border-border/50"
                onClick={() => router.push(`/seller/content/briefs/${brief.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {brief.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Badge variant="secondary">{brief.content_type}</Badge>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Deadline: {format(new Date(brief.deadline), "PP")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {brief.applications?.[0]?.count || 0} applications
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(brief.status)}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {brief.description}
                      </p>

                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <span className="text-muted-foreground font-normal">Budget:</span>
                          {brief.budget_min} - {brief.budget_max} TND
                        </div>
                        {brief.preferred_city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            {brief.preferred_city}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col justify-between items-center md:items-end gap-4 min-w-[150px]">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                        <p className="text-sm font-medium">{format(new Date(brief.created_at), "PP")}</p>
                      </div>
                      <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                        View Details
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
