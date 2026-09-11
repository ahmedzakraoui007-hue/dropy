"use client";

import { useState, useEffect } from "react";
import { 
  Star, 
  Search, 
  Filter, 
  Check, 
  X, 
  MoreVertical,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Trash2
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/reviews/StarRating";

export default function AdminReviewsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("creator");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReviews = async (type: string) => {
    setIsLoading(true);
    let query = supabase.from(`${type}_reviews`).select("*");

    if (type === "creator") {
      query = supabase.from("creator_reviews").select(`
        *,
        creator:profiles(*),
        store:stores(name),
        brief:content_briefs(title)
      `);
    } else if (type === "product") {
      query = supabase.from("product_reviews").select(`
        *,
        store_product:store_products(title, store:stores(name))
      `);
    } else if (type === "store") {
      query = supabase.from("store_reviews").select(`
        *,
        store:stores(name)
      `);
    } else if (type === "supplier") {
      query = supabase.from("supplier_reviews").select(`
        *,
        supplier:profiles(*),
        seller:profiles(*)
      `);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews(activeTab);
  }, [activeTab]);

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    const { error } = await supabase
      .from(`${activeTab}_reviews`)
      .update({ status })
      .eq("id", reviewId);

    if (!error) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
    }
  };

  const filteredReviews = reviews.filter(r => {
    const text = (r.comment || "") + (r.customer_name || "") + (r.creator?.full_name || "") + (r.store?.name || "") + (r.supplier?.full_name || "");
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <p className="text-muted-foreground">Manage and moderate marketplace reviews</p>
        </div>

        <Tabs defaultValue="creator" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="creator">Creators</TabsTrigger>
            <TabsTrigger value="product">Products</TabsTrigger>
            <TabsTrigger value="store">Stores</TabsTrigger>
            <TabsTrigger value="supplier">Suppliers</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search reviews..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground">No reviews found in this category.</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <Card key={review.id} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>
                                  {(review.creator?.full_name || review.customer_name || review.supplier?.full_name || "A")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold">
                                  {activeTab === 'creator' && `Review for ${review.creator?.full_name}`}
                                  {activeTab === 'product' && `Review for ${review.store_product?.title}`}
                                  {activeTab === 'store' && `Review for ${review.store?.name}`}
                                  {activeTab === 'supplier' && `Review for ${review.supplier?.full_name}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {activeTab === 'creator' && `By ${review.store?.name} on ${review.brief?.title}`}
                                  {activeTab === 'product' && `By ${review.customer_name} on ${review.store_product?.store?.name}`}
                                  {activeTab === 'store' && `By ${review.customer_name}`}
                                  {activeTab === 'supplier' && `By ${review.seller?.full_name}`}
                                </p>
                              </div>
                            </div>
                            <Badge className={cn(
                              review.status === "approved" || review.status === "published" ? "bg-emerald-500" : 
                              review.status === "pending" ? "bg-orange-500" : 
                              "bg-destructive"
                            )}>
                              {review.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <span className="text-xs text-muted-foreground ml-2">{format(new Date(review.created_at), "PP", { locale: fr })}</span>
                          </div>

                          <p className="text-sm italic text-muted-foreground">
                            "{review.comment}"
                          </p>

                          {activeTab === 'creator' && (
                            <div className="grid grid-cols-3 gap-4 text-[10px] uppercase font-bold text-muted-foreground">
                              <div>Quality: {review.quality_rating}/5</div>
                              <div>Comm: {review.communication_rating}/5</div>
                              <div>Deadline: {review.deadline_rating}/5</div>
                            </div>
                          )}
                        </div>

                        <div className="flex md:flex-col gap-2 min-w-[120px]">
                          {(review.status === "pending" || review.status === "rejected") && (
                            <Button 
                              size="sm" 
                              className="w-full bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleUpdateStatus(review.id, activeTab === "creator" ? "approved" : "published")}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1.5" /> Approve
                            </Button>
                          )}
                          {(review.status === "approved" || review.status === "published" || review.status === "pending") && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-destructive"
                              onClick={() => handleUpdateStatus(review.id, "rejected")}
                            >
                              <ThumbsDown className="w-3 h-3 mr-1.5" /> Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
