import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Check, X, MessageSquare, Building2,
  Calendar, PhoneIcon, MapPin
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";
import { sellerService, SellerRequest } from "../services/seller.service";
import { useAuth } from "../context/AuthContext";

export function SellerRequestsTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isRejectingId, setIsRejectingId] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedFilter === "all") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(
        requests.filter((req) => req.status === selectedFilter)
      );
    }
  }, [requests, selectedFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await sellerService.getSellerRequests("all");
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Không thể tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!user?.id) return;

    try {
      await sellerService.approveSellerRequest(requestId, user.id);
      toast.success("Đã phê duyệt yêu cầu");
      loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể phê duyệt"
      );
    }
  };

  const handleReject = async () => {
    if (!user?.id || !isRejectingId) return;

    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await sellerService.rejectSellerRequest(
        isRejectingId,
        user.id,
        rejectReason
      );
      toast.success("Đã từ chối yêu cầu");
      setShowRejectDialog(false);
      setRejectReason("");
      setIsRejectingId(null);
      loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể từ chối"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Chờ duyệt
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500">
            ✓ Được duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500">
            ✗ Bị từ chối
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "outline"}
            onClick={() =>
              setSelectedFilter(
                filter as "pending" | "approved" | "rejected" | "all"
              )
            }
            size="sm"
          >
            {filter === "pending"
              ? `Chờ Duyệt (${requests.filter((r) => r.status === "pending").length})`
              : filter === "approved"
                ? `Được Duyệt (${requests.filter((r) => r.status === "approved").length})`
                : filter === "rejected"
                  ? `Bị Từ Chối (${requests.filter((r) => r.status === "rejected").length})`
                  : `Tất Cả (${requests.length})`}
          </Button>
        ))}
      </div>

      {/* Requests Grid */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-foreground/70">Đang tải...</p>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-foreground/70">Không có yêu cầu nào</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 bg-white border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">
                        {request.business_name}
                      </h3>
                      <p className="text-sm text-foreground/70">
                        User ID: {request.user_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === "pending" && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Duyệt
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRejectingId(request.id);
                            setShowRejectDialog(true);
                          }}
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                        >
                          <X className="w-4 h-4" />
                          Từ chối
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-foreground/70">
                    <PhoneIcon className="w-4 h-4" />
                    {request.phone_number}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <MapPin className="w-4 h-4" />
                    {request.city}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <Calendar className="w-4 h-4" />
                    Gửi: {formatDate(request.requested_at)}
                  </div>
                  {request.reviewed_at && (
                    <div className="flex items-center gap-2 text-foreground/70">
                      <MessageSquare className="w-4 h-4" />
                      Xét: {formatDate(request.reviewed_at)}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ Chối Yêu Cầu</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Từ Chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
