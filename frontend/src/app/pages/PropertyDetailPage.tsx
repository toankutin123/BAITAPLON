import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useParams } from "react-router-dom";
import {
  TrendingUp, ArrowLeft, Heart, Share2, MapPin, Bed, Bath, Ruler,
  Building2, Compass, Calendar, Home, Phone, Mail, MessageCircle,
  Eye, Star, CheckCircle, FileText, DollarSign,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Avatar } from "../components/ui/avatar";
import { propertyService, Property } from "../services/property.service";
import { PropertyMap } from "../components/PropertyMap";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function PropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty(id);
      checkIfSaved(id);
    }
  }, [id]);

  const checkIfSaved = async (propertyId: string) => {
    if (!user) return;
    try {
      const SAVED_API_URL = "http://localhost:8001/api/saved-properties";
      const response = await fetch(`${SAVED_API_URL}/check/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.saved);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu BĐS");
      return;
    }

    if (!id) return;

    try {
      if (isLiked) {
        await propertyService.removeSavedProperty(parseInt(id));
        setIsLiked(false);
        toast.success("Đã xóa khỏi danh sách đã lưu");
      } else {
        await propertyService.saveProperty(parseInt(id));
        setIsLiked(true);
        toast.success("Đã lưu BĐS");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu BĐS");
    }
  };

  const loadProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      const data = await propertyService.getPropertyById(parseInt(propertyId));
      setProperty(data);
    } catch (error) {
      console.error("Error loading property:", error);
      toast.error("Không thể tải thông tin BĐS");
    } finally {
      setLoading(false);
    }
  };

  const getImages = (p: Property): string[] => {
    if (!p) return [];
    if (Array.isArray(p.images)) return p.images;
    if (typeof p.images === "string") {
      try { return JSON.parse(p.images); } catch { return []; }
    }
    return [];
  };

  const getPropertyTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      apartment: "Căn Hộ",
      house: "Nhà Phố",
      villa: "Biệt Thự",
      townhouse: "Nhà Liền Kề",
      land: "Đất Nền",
    };
    return typeMap[type] || type || "Khác";
  };

  const formatPrice = (price: number) => {
    if (!price) return "0";
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(2)} tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const images = property ? getImages(property) : [];
  const defaultImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
          <p className="text-foreground/70">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/70 mb-4">Không tìm thấy BĐS</p>
          <Link to="/properties">
            <Button>Quay Lại Danh Sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          <Link to="/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay Lại Danh Sách
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-foreground/70 mb-6">
          <Link to="/" className="hover:text-foreground">Trang Chủ</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-foreground">Bất Động Sản</Link>
          <span>/</span>
          <span className="text-foreground">{getPropertyTypeName(property.property_type)}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden bg-white border-border">
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={images[currentImageIndex] || defaultImage}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />

                {property.verified && (
                  <Badge className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Đã Xác Minh
                  </Badge>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleToggleLike}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button size="icon" variant="secondary">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {images.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white w-8"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 p-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-[#3B82F6]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Title & Basic Info */}
            <Card className="p-6 bg-white border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{getPropertyTypeName(property.property_type)}</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      {property.status}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-3">
                    {property.title}
                  </h1>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-foreground/60 mb-1">Giá Bán</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(property.price)}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <Ruler className="w-5 h-5 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-foreground">{property.area}m²</div>
                  <div className="text-xs text-foreground/60">Diện tích</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Ruler className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {(property.price / property.area / 1000000).toFixed(1)}
                  </div>
                  <div className="text-xs text-foreground/60">Triệu/m²</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Bed className="w-5 h-5 text-gray-600 mb-2" />
                  <div className="text-2xl font-bold text-foreground">{property.bedrooms}</div>
                  <div className="text-xs text-foreground/60">Phòng ngủ</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Bath className="w-5 h-5 text-foreground/70" />
                  <div>
                    <div className="font-bold text-foreground">{property.bathrooms}</div>
                    <div className="text-xs text-foreground/60">Phòng tắm</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-foreground/70" />
                  <div>
                    <div className="font-bold text-foreground">{property.district}</div>
                    <div className="text-xs text-foreground/60">Quận</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-foreground/70" />
                  <div>
                    <div className="font-bold text-foreground">{property.city || "TP.HCM"}</div>
                    <div className="text-xs text-foreground/60">Thành phố</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-foreground/70">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{property.address}, {property.district}, {property.city || "TP.HCM"}</span>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 bg-white border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mô Tả Chi Tiết
              </h2>
              <div className="text-foreground/80 whitespace-pre-line leading-relaxed">
                {property.description || "Không có mô tả"}
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 bg-white border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Thông Tin Khác
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-foreground/60">Người đăng:</div>
                  <div className="font-medium text-foreground">{(property as any).username || "N/A"}</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-foreground/60">Ngày đăng:</div>
                  <div className="font-medium text-foreground">
                    {property.created_at ? new Date(property.created_at).toLocaleDateString("vi-VN") : "N/A"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Map */}
            <PropertyMap
              address={property.address || ""}
              district={property.district || ""}
              city={property.city || "TP.HCM"}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="p-6 bg-white border-border sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-16 h-16">
                  <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold">
                    {((property as any).username || (property as any).full_name || "U").charAt(0).toUpperCase()}
                  </div>
                </Avatar>
                <div className="flex-1">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {(property as any).full_name || (property as any).username || "Người bán"}
                    {property.verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                        ✓ Xác Minh
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-foreground/70">Người bán BĐS</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Button className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-base py-6">
                  <Phone className="w-5 h-5 mr-2" />
                  Liên hệ ngay
                </Button>
                <Button variant="outline" className="w-full text-base py-6">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat Zalo
                </Button>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-bold text-foreground">Gửi Tin Nhắn</h3>
                <Input placeholder="Họ và tên" />
                <Input placeholder="Số điện thoại" />
                <Textarea placeholder="Nội dung tin nhắn..." rows={4} />
                <Button className="w-full">Gửi Tin Nhắn</Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-white border-border">
              <h3 className="font-bold text-foreground mb-4">Công Cụ Hỗ Trợ</h3>
              <div className="space-y-3">
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Dự Đoán Giá AI
                  </Button>
                </Link>
                <Link to="/market-analysis">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Phân Tích Thị Trường
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Posted Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="text-sm text-foreground/70 space-y-2">
                <div>Đăng: {property.created_at ? new Date(property.created_at).toLocaleDateString("vi-VN") : "N/A"}</div>
                <div>Cập nhật: {property.updated_at ? new Date(property.updated_at).toLocaleDateString("vi-VN") : "N/A"}</div>
                <div>Mã tin: #{property.id}</div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
