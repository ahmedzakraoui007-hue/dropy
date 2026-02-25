"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Star,
  FileText,
  Image as ImageIcon,
  Film,
  MoreVertical,
  Grid,
  List as ListIcon
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

export default function ContentLibraryPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchLibrary() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!store) return;

      const { data, error } = await supabase
        .from("content_library")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data);
      }
      setIsLoading(false);
    }

    fetchLibrary();
  }, [supabase]);

  const filteredItems = items.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.startsWith("video/")) return <Film className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Content Library</h1>
            <p className="text-muted-foreground">Your collection of purchased photos, videos and designs</p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by filename or type..." 
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
        ) : filteredItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Library is empty</h3>
            <p className="text-muted-foreground max-w-sm">
              Your purchased content will appear here once missions are completed.
            </p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                <div className="aspect-square relative bg-muted flex items-center justify-center">
                  {item.thumbnail_url || item.file_url ? (
                    <img 
                      src={item.thumbnail_url || item.file_url} 
                      alt={item.filename} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {getFileIcon(item.file_type)}
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">{item.file_type.split("/")[1]}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.is_favorite && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.file_type.split("/")[1]} • {(item.file_size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Download className="w-4 h-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Star className="w-4 h-4" /> {item.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-xs uppercase font-bold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">File</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          {getFileIcon(item.file_type)}
                        </div>
                        <span className="text-sm font-medium">{item.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {item.file_type.split("/")[1]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {(item.file_size / 1024 / 1024).toFixed(1)} MB
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "PP")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Download className="w-4 h-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Star className="w-4 h-4" /> {item.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
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
