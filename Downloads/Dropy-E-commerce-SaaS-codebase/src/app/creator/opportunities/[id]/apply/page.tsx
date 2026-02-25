"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  Send,
  Upload,
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brief, setBrief] = useState<any>(null);

  // Form State
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [message, setMessage] = useState("");
  const [portfolioSamples, setPortfolioSamples] = useState<File[]>([]);

  useEffect(() => {
    async function fetchBrief() {
      const { data, error } = await supabase
        .from("content_briefs")
        .select("*, store:stores(name)")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Brief not found");
        router.push("/creator/opportunities");
        return;
      }
      setBrief(data);
    }
    fetchBrief();
  }, [id, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedPrice || !deliveryDays || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // In a real app, upload portfolio samples to Storage
      const sampleUrls: string[] = [];

      const { error } = await supabase
        .from("content_applications")
        .insert({
          brief_id: id,
          creator_id: user.id,
          proposed_price: parseFloat(proposedPrice),
          delivery_days: parseInt(deliveryDays),
          message,
          portfolio_samples: sampleUrls,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Proposal submitted successfully!");
      router.push("/creator/missions");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!brief) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Proposal</h1>
          <p className="text-muted-foreground">
            Applying for: <span className="font-semibold text-foreground">{brief.title}</span> by {brief.store?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
              <CardDescription>Specify your terms for this mission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Proposed Price (TND)*</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-10"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Budget range: {brief.budget_min} - {brief.budget_max} TND</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Delivery Time (Days)*</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="days" 
                      type="number" 
                      placeholder="e.g. 5" 
                      className="pl-10"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Why are you a good fit?*</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell the seller about your experience and how you plan to approach this project..."
                  className="min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevant Work Samples</CardTitle>
              <CardDescription>Upload 3-5 examples of similar work</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload 
                onFilesSelected={setPortfolioSamples}
                maxFiles={5}
                acceptedTypes={["image/*", "video/*"]}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Important Information</p>
                <p className="text-muted-foreground mt-1">
                  If selected, the payment will be held in escrow. You will receive 85% of the proposed price ({(parseFloat(proposedPrice || "0") * 0.85).toFixed(2)} TND) after the seller approves your work.
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Proposal"}
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
