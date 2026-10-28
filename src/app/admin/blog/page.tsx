"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Row = { id: string; slug: string; title: string; locale: string; status: string; published_at: string | null; updated_at: string };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("blog_posts")
      .select("id, slug, title, locale, status, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as Row[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Articles publiés sur dropy.store/blog.</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Aucun article. Créez le premier.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-4">
                <Link href={`/admin/blog/${post.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold hover:underline">{post.title}</p>
                  <p className="text-xs text-muted-foreground">/blog/{post.slug} · {post.locale.toUpperCase()} · modifié le {formatDate(post.updated_at)}</p>
                </Link>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status === "published" ? `Publié le ${formatDate(post.published_at || post.updated_at)}` : "Brouillon"}
                </Badge>
                {post.status === "published" && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Voir l'article">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
