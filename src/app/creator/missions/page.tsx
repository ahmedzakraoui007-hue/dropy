"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Briefcase,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CreatorMissionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchMissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("content_briefs")
        .select(`
          *,
          store:stores(name),
          applications:content_applications(*)
        `)
        .or(`selected_creator_id.eq.${user.id},id.in.(${
          // Get brief IDs where I applied
          (await supabase
            .from("content_applications")
            .select("brief_id")
            .eq("creator_id", user.id)
          ).data?.map(a => a.brief_id).join(",") || "00000000-0000-0000-0000-000000000000"
        })`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMissions(data);
      }
      setIsLoading(false);
    }

    fetchMissions();
  }, [supabase]);

  const getStatusBadge = (brief: any, userId: string) => {
    const myApp = brief.applications?.find((a: any) => a.creator_id === userId);
    
    if (brief.selected_creator_id === userId) {
      switch (brief.status) {
        case "assigned": return <Badge className="bg-purple-500">Hired - Starting</Badge>;
        case "in_progress": return <Badge className="bg-orange-500">In Progress</Badge>;
        case "delivered": return <Badge className="bg-blue-500">Delivered - Pending Approval</Badge>;
        case "completed": return <Badge className="bg-emerald-500">Completed</Badge>;
        default: return <Badge>{brief.status}</Badge>;
      }
    }

    if (myApp) {
      switch (myApp.status) {
        case "pending": return <Badge variant="outline">Applied - Pending</Badge>;
        case "rejected": return <Badge variant="destructive">Not Selected</Badge>;
        case "accepted": return <Badge className="bg-emerald-500">Accepted</Badge>;
        default: return <Badge variant="outline">{myApp.status}</Badge>;
      }
    }

    return <Badge variant="outline">{brief.status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Missions</h1>
            <p className="text-muted-foreground">Track your proposals and active projects</p>
          </div>
          <Button 
            onClick={() => router.push("/creator/opportunities")}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            Find New Opportunities
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full md:w-auto bg-muted">
            <TabsTrigger value="all" className="flex-1 md:flex-none">All</TabsTrigger>
            <TabsTrigger value="proposals" className="flex-1 md:flex-none">Proposals</TabsTrigger>
            <TabsTrigger value="active" className="flex-1 md:flex-none">Active Missions</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-none">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : missions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No missions yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven&apos;t applied to any missions yet. Explore opportunities to get started!
            </p>
            <Button onClick={() => router.push("/creator/opportunities")}>
              Browse Opportunities
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {missions.map((mission) => (
              <Card 
                key={mission.id} 
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/creator/missions/${mission.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {mission.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {mission.store?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Badge variant="outline">{mission.content_type}</Badge>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Deadline: {format(new Date(mission.deadline), "PP")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(mission, mission.applications?.[0]?.creator_id)}
                          <p className="text-xs text-muted-foreground">
                            Applied {format(new Date(mission.created_at), "PP")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">My Proposal:</span>
                          <span className="font-bold">
                            {mission.applications?.find((a: any) => a.creator_id === mission.applications?.[0]?.creator_id)?.proposed_price} TND
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <AlertCircle className="w-4 h-4" />
                          {mission.applications?.find((a: any) => a.creator_id === mission.applications?.[0]?.creator_id)?.delivery_days} days delivery
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center min-w-[120px]">
                      <Button variant="ghost" className="w-full group-hover:translate-x-1 transition-transform">
                        Details
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
