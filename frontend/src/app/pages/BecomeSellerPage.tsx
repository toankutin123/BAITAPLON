import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Building2, Phone, MapPin, FileText, ArrowLeft, Send, AlertCircle,
  CheckCircle, Clock, X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { sellerService, SellerRequest } from "../services/seller.service";
import { useAuth } from "../context/AuthContext";

export function BecomeSellerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sellerRequest, setSellerRequest] = useState<SellerRequest | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "individual",
    business_registration_number: "",
    tax_id: "",
    phone_number: user?.phone || "",
    business_address: "",
    city: "hcm",
    district: "",
    description: "",
  });

  // Load existing seller request if any
  useEffect(() => {
    if (user?.id) {
      loadExistingRequest();
    }
  }, [user?.id]);

  const loadExistingRequest = async () => {
    if (!user?.id) return;
    try {
      const request = await sellerService.getMySellerRequest();
      if (request) {
        setSellerRequest(request);
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error loading seller request:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Vui lòng đăng nhập trước");
      return;
    }

    // Validation
    if (!formData.business_name.trim()) {
      toast.error("Vui lòng nhập tên kinh doanh");
      return;
    }
    if (!formData.phone_number.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.business_address.trim()) {
      toast.error("Vui lòng nhập địa chỉ kinh doanh");
      return;
    }

    setLoading(true);
    try {
      const result = await sellerService.submitSellerRequest(formData);
      setSellerRequest(result);
      setSubmitted(true);
      toast.success("Yêu cầu đã được gửi. Vui lòng chờ admin phê duyệt.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay Lại
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Trở Thành Người Bán Bất Động Sản
          </h1>
          <p className="text-foreground/70">
            Hãy điền thông tin kinh doanh để gửi yêu cầu
          </p>
        </div>

        {/* Submitted State */}
        {submitted && sellerRequest ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 bg-white border-border">
              <div className="text-center mb-8">
                {sellerRequest.status === "pending" && (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                )}
                {sellerRequest.status === "approved" && (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                  </div>
                )}
                {sellerRequest.status === "rejected" && (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                      <X className="w-10 h-10 text-red-600" />
                    </div>
                  </div>
                )}
              </div>

              {sellerRequest.status === "pending" && (
                <>
                  <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                    Yêu Cầu Đang Chờ Duyệt
                  </h2>
                  <p className="text-center text-foreground/70 mb-6">
                    Admin sẽ xem xét yêu cầu của bạn sớm nhất. Bạn sẽ nhận được thông báo khi có quyết định.
                  </p>
                </>
              )}

              {sellerRequest.status === "approved" && (
                <>
                  <h2 className="text-2xl font-bold text-green-600 text-center mb-2">
                    Yêu Cầu Đã Được Phê Duyệt!
                  </h2>
                  <p className="text-center text-foreground/70 mb-6">
                    Bạn hiện có thể đăng bán bất động sản trên hệ thống.
                  </p>
                  <Button
                    onClick={() => navigate("/add-property")}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Đăng Bán BĐS Đầu Tiên
                  </Button>
                </>
              )}

              {sellerRequest.status === "rejected" && (
                <>
                  <h2 className="text-2xl font-bold text-red-600 text-center mb-2">
                    Yêu Cầu Bị Từ Chối
                  </h2>
                  {sellerRequest.reason_for_rejection && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Lý do:</strong> {sellerRequest.reason_for_rejection}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setSellerRequest(null);
                    }}
                    className="w-full"
                  >
                    Gửi Yêu Cầu Mới
                  </Button>
                </>
              )}

              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Thông Tin Đã Gửi
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-1">Tên kinh doanh</p>
                    <p className="font-medium">{sellerRequest.business_name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-1">Loại hình</p>
                    <p className="font-medium capitalize">
                      {sellerRequest.business_type === "individual" ? "Cá Nhân" :
                       sellerRequest.business_type === "company" ? "Công Ty" : "Sàn Giao Dịch"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-1">Số điện thoại</p>
                    <p className="font-medium">{sellerRequest.phone_number}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-1">Địa chỉ</p>
                    <p className="font-medium">
                      {sellerRequest.business_address}, {sellerRequest.district}, {sellerRequest.city}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 bg-white border-border">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Business Information */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Thông Tin Kinh Doanh
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="business_name" className="mb-2 block">
                        Tên Kinh Doanh <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        placeholder="VD: Công ty Bất Động Sản ABC"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="business_type" className="mb-2 block">
                        Loại Hình Kinh Doanh <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.business_type}
                        onValueChange={(value) =>
                          handleSelectChange("business_type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Cá Nhân</SelectItem>
                          <SelectItem value="company">Công Ty</SelectItem>
                          <SelectItem value="agency">Sàn Giao Dịch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="business_registration_number" className="mb-2 block">
                        Số Đăng Ký Kinh Doanh
                      </Label>
                      <Input
                        id="business_registration_number"
                        name="business_registration_number"
                        placeholder="VD: 0123456789"
                        value={formData.business_registration_number}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tax_id" className="mb-2 block">
                        Mã Số Thuế
                      </Label>
                      <Input
                        id="tax_id"
                        name="tax_id"
                        placeholder="VD: 0123456789"
                        value={formData.tax_id}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Thông Tin Liên Hệ
                  </h2>
                  <div>
                    <Label htmlFor="phone_number" className="mb-2 block">
                      Số Điện Thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      placeholder="VD: 0901234567"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Địa Chỉ Kinh Doanh
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="business_address" className="mb-2 block">
                        Địa Chỉ Chi Tiết <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="business_address"
                        name="business_address"
                        placeholder="VD: 123 Đường Lê Lợi, Phường 1"
                        value={formData.business_address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city" className="mb-2 block">
                          Tỉnh/Thành Phố <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) =>
                            handleSelectChange("city", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                            <SelectItem value="hanoi">Hà Nội</SelectItem>
                            <SelectItem value="danang">Đà Nẵng</SelectItem>
                            <SelectItem value="haiphong">Hải Phòng</SelectItem>
                            <SelectItem value="cantho">Cần Thơ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="district" className="mb-2 block">
                          Quận/Huyện <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="district"
                          name="district"
                          placeholder="VD: Quận 1"
                          value={formData.district}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Mô Tả Thêm
                  </h2>
                  <div>
                    <Label htmlFor="description" className="mb-2 block">
                      Giới Thiệu Về Kinh Doanh
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Khoảng 5 năm kinh nghiệm trong lĩnh vực BĐS..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-6 border-t border-border">
                  <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Yêu cầu của bạn sẽ được admin xem xét trong vòng 24-48 giờ
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "Đang gửi..." : "Gửi Yêu Cầu"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
