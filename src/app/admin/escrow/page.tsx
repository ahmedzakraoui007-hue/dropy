"use client";

import { useState, useEffect } from "react";
import { 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search,
  ExternalLink,
  ShieldAlert,
  Gavel,
  Undo2,
  SendHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function AdminEscrowDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionType, setResolutionType] = useState<string>("refund_full");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>("0");
  const [releasedAmount, setReleasedAmount] = useState<string>("0");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await fetch("/api/content/disputes");
      const data = await response.json();
      if (response.ok) {
        setDisputes(data);
      }
    } catch (error) {
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes) {
      toast.error("Please provide resolution notes");
      return;
    }

    setIsResolving(true);
    try {
      const response = await fetch(`/api/admin/content/disputes/${selectedDispute.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution_type: resolutionType,
          resolution_notes: resolutionNotes,
          refund_amount: Number(refundAmount),
          released_amount: Number(releasedAmount)
        })
      });

      if (response.ok) {
        toast.success("Dispute resolved successfully");
        setSelectedDispute(null);
        fetchDisputes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to resolve dispute");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsResolving(false);
    }
  };

  const filteredDisputes = disputes.filter(d => 
    d.brief?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Open</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Escrow & Disputes
          </h1>
          <p className="text-muted-foreground">Arbitrate between sellers and creators to resolve mission disputes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search disputes..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <Card className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No disputes found</h3>
            <p className="text-muted-foreground">Everything is running smoothly.</p>
          </Card>
        ) : (
          filteredDisputes.map((dispute) => (
            <Card key={dispute.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(dispute.status)}
<span className="text-sm text-muted-foreground">
  Opened on {formatDate(dispute.created_at)}
</span>

                    </div>
                    <Badge variant="outline">
                      Mission ID: {dispute.brief_id.slice(0, 8)}...
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{dispute.brief?.title}</h3>
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="font-medium text-sm text-muted-foreground uppercase mb-1">Reason for Dispute:</p>
                    <p className="text-sm">{dispute.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount in Escrow</p>
                      <p className="font-bold text-lg">€{dispute.payment?.amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opened By</p>
                      <p className="font-medium">{dispute.opened_by_profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{dispute.opened_by_profile?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border gap-3">
                  {dispute.status === "open" ? (
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setRefundAmount(dispute.payment?.amount.toString());
                        setReleasedAmount("0");
                      }}
                    >
                      <Gavel className="w-4 h-4" /> Arbitrate
                    </Button>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-xs font-bold uppercase text-emerald-500">Resolved</p>
                      <p className="text-sm font-medium">{dispute.resolution_type.replace('_', ' ')}</p>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <ExternalLink className="w-3 h-3" /> View Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Arbitration Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Dispute Arbitration
            </DialogTitle>
            <DialogDescription>
              Carefully review the evidence and decide how to split the escrowed funds.
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total in Escrow</p>
                    <p className="text-2xl font-bold">€{selectedDispute.payment?.amount?.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Current Status</p>
                    <Badge variant="destructive">Needs Review</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Action</label>
                  <Select 
                    value={resolutionType} 
                    onValueChange={(val) => {
                      setResolutionType(val);
                      if (val === 'refund_full') {
                        setRefundAmount(selectedDispute.payment?.amount.toString());
                        setReleasedAmount("0");
                      } else if (val === 'release_full') {
                        setRefundAmount("0");
                        setReleasedAmount(selectedDispute.payment?.amount.toString());
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund_full">Full Refund to Seller</SelectItem>
                      <SelectItem value="release_full">Full Release to Creator</SelectItem>
                      <SelectItem value="refund_partial">Partial Refund & Release</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(resolutionType === 'refund_partial') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Refund to Seller (€)</label>
                      <Input 
                        type="number" 
                        value={refundAmount} 
                        onChange={(e) => {
                          setRefundAmount(e.target.value);
                          setReleasedAmount((selectedDispute.payment.amount - Number(e.target.value)).toFixed(2));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Release to Creator (€)</label>
                      <Input 
                        type="number" 
                        value={releasedAmount}
                        onChange={(e) => {
                          setReleasedAmount(e.target.value);
                          setRefundAmount((selectedDispute.payment.amount - Number(e.target.value)).toFixed(2));
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Notes (Visible to both parties)</label>
                  <Textarea 
                    placeholder="Explain the decision..." 
                    className="min-h-[100px]"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>Cancel</Button>
            <Button 
              className="gap-2" 
              onClick={handleResolve}
              disabled={isResolving}
            >
              {isResolving ? "Processing..." : <><SendHorizontal className="w-4 h-4" /> Finalize Resolution</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
