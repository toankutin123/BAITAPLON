import { useState } from "react";
import { Link } from "react-router-dom"; 
import { motion } from "motion/react";
import {
  TrendingUp, ArrowLeft, Home, MapPin, DollarSign, Ruler, Bed, Bath,
  Building2, FileText, Image, Phone, Mail, User, Calendar, Compass,
  Check, Upload, X, Plus
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

export function AddPropertyPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Thông tin cơ bản
    title: "",
    description: "",
    propertyType: "",

    // Vị trí
    province: "",
    district: "",
    ward: "",
    streetAddress: "",

    // Giá & Diện tích
    price: "",
    priceUnit: "vnd",
    priceType: "total", // total hoặc per_m2
    area: "",

    // Chi tiết BĐS
    bedrooms: "",
    bathrooms: "",
    floors: "",
    direction: "",
    yearBuilt: "",

    // Pháp lý
    legalStatus: "",
    ownership: "",

    // Tiện ích
    furniture: [] as string[],
    amenities: [] as string[],

    // Liên hệ
    contactName: "",
    contactPhone: "",
    contactEmail: "",

    // Trạng thái
    status: "available",

    // Hình ảnh
    images: [] as string[],
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "furniture" | "amenities", item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = () => {
    // Validate & Submit
    console.log("Form Data:", formData);
    toast.success("Đã thêm bất động sản thành công!");
  };

  const steps = [
    { number: 1, title: "Thông Tin Cơ Bản" },
    { number: 2, title: "Vị Trí" },
    { number: 3, title: "Giá & Diện Tích" },
    { number: 4, title: "Chi Tiết" },
    { number: 5, title: "Tiện Ích & Liên Hệ" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EstateAI</span>
          </Link>

          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về Admin Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Thêm Bất Động Sản Mới
          </h1>
          <p className="text-foreground/70">
            Điền đầy đủ thông tin để thêm BĐS vào hệ thống
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.number
                      ? "bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s.number ? <Check className="w-6 h-6" /> : s.number}
                  </div>
                  <div className={`mt-2 text-sm font-medium ${
                    step >= s.number ? "text-foreground" : "text-foreground/50"
                  }`}>
                    {s.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 mb-8 transition-all ${
                    step > s.number ? "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 bg-white border-border shadow-lg">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Thông Tin Cơ Bản */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4" />
                    Tiêu Đề BĐS <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="VD: Căn Hộ Vinhomes Central Park - View Sông Tuyệt Đẹp"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Tiêu đề hấp dẫn giúp thu hút người mua/thuê
                  </p>
                </div>

                <div>
                  <Label htmlFor="property-type" className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    Loại Bất Động Sản <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.propertyType} onValueChange={(value) => updateFormData("propertyType", value)}>
                    <SelectTrigger id="property-type">
                      <SelectValue placeholder="Chọn loại BĐS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Căn Hộ Chung Cư</SelectItem>
                      <SelectItem value="house">Nhà Phố</SelectItem>
                      <SelectItem value="villa">Biệt Thự</SelectItem>
                      <SelectItem value="townhouse">Nhà Liền Kề</SelectItem>
                      <SelectItem value="land">Đất Nền</SelectItem>
                      <SelectItem value="office">Văn Phòng</SelectItem>
                      <SelectItem value="shophouse">Shop House</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Mô Tả Chi Tiết <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về BĐS: vị trí, tiện ích, đặc điểm nổi bật..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Mô tả càng chi tiết càng tốt (tối thiểu 100 ký tự)
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Vị Trí */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="province" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Tỉnh/Thành Phố <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.province} onValueChange={(value) => updateFormData("province", value)}>
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Chọn tỉnh/TP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                        <SelectItem value="haiphong">Hải Phòng</SelectItem>
                        <SelectItem value="cantho">Cần Thơ</SelectItem>
                        <SelectItem value="binhduong">Bình Dương</SelectItem>
                        <SelectItem value="dongnai">Đồng Nai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="district" className="flex items-center gap-2 mb-2">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.district} onValueChange={(value) => updateFormData("district", value)}>
                      <SelectTrigger id="district">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="q1">Quận 1</SelectItem>
                        <SelectItem value="q2">Quận 2</SelectItem>
                        <SelectItem value="q3">Quận 3</SelectItem>
                        <SelectItem value="q7">Quận 7</SelectItem>
                        <SelectItem value="binhthanh">Bình Thạnh</SelectItem>
                        <SelectItem value="thuduc">Thủ Đức</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ward" className="flex items-center gap-2 mb-2">
                      Phường/Xã
                    </Label>
                    <Input
                      id="ward"
                      placeholder="VD: Phường Bến Nghé"
                      value={formData.ward}
                      onChange={(e) => updateFormData("ward", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="street-address" className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Địa Chỉ Chi Tiết <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street-address"
                    placeholder="VD: 123 Đường Nguyễn Huệ"
                    value={formData.streetAddress}
                    onChange={(e) => updateFormData("streetAddress", e.target.value)}
                  />
                </div>

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Mẹo về Vị Trí</h4>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        Cung cấp địa chỉ chính xác giúp khách hàng dễ dàng tìm thấy BĐS.
                        Nếu có thể, thêm tọa độ GPS hoặc link Google Maps.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Giá & Diện Tích */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price" className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4" />
                      Giá <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="VD: 5200000000"
                      value={formData.price}
                      onChange={(e) => updateFormData("price", e.target.value)}
                    />
                    {formData.price && (
                      <p className="text-xs text-foreground/60 mt-1">
                        ≈ {(parseFloat(formData.price) / 1000000000).toFixed(2)} tỷ VND
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price-type" className="flex items-center gap-2 mb-2">
                      Loại Giá
                    </Label>
                    <Select value={formData.priceType} onValueChange={(value) => updateFormData("priceType", value)}>
                      <SelectTrigger id="price-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">Tổng Giá</SelectItem>
                        <SelectItem value="per_m2">Giá/m²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="area" className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4" />
                    Diện Tích (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="VD: 80"
                    value={formData.area}
                    onChange={(e) => updateFormData("area", e.target.value)}
                  />
                  {formData.price && formData.area && (
                    <p className="text-xs text-foreground/60 mt-1">
                      Giá/m²: ≈ {(parseFloat(formData.price) / parseFloat(formData.area) / 1000000).toFixed(1)} triệu VND/m²
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground mb-2">
                        {formData.price ? (parseFloat(formData.price) / 1000000000).toFixed(2) : "0"} tỷ
                      </div>
                      <div className="text-sm text-foreground/70">Tổng Giá Trị</div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground mb-2">
                        {formData.area || "0"} m²
                      </div>
                      <div className="text-sm text-foreground/70">Diện Tích</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Chi Tiết */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="bedrooms" className="flex items-center gap-2 mb-2">
                      <Bed className="w-4 h-4" />
                      Số Phòng Ngủ
                    </Label>
                    <Select value={formData.bedrooms} onValueChange={(value) => updateFormData("bedrooms", value)}>
                      <SelectTrigger id="bedrooms">
                        <SelectValue placeholder="Chọn số phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Studio</SelectItem>
                        <SelectItem value="1">1 Phòng</SelectItem>
                        <SelectItem value="2">2 Phòng</SelectItem>
                        <SelectItem value="3">3 Phòng</SelectItem>
                        <SelectItem value="4">4 Phòng</SelectItem>
                        <SelectItem value="5+">5+ Phòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bathrooms" className="flex items-center gap-2 mb-2">
                      <Bath className="w-4 h-4" />
                      Số Phòng Tắm
                    </Label>
                    <Select value={formData.bathrooms} onValueChange={(value) => updateFormData("bathrooms", value)}>
                      <SelectTrigger id="bathrooms">
                        <SelectValue placeholder="Chọn số phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Phòng</SelectItem>
                        <SelectItem value="2">2 Phòng</SelectItem>
                        <SelectItem value="3">3 Phòng</SelectItem>
                        <SelectItem value="4+">4+ Phòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="floors" className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4" />
                      Số Tầng
                    </Label>
                    <Input
                      id="floors"
                      type="number"
                      placeholder="VD: 3"
                      value={formData.floors}
                      onChange={(e) => updateFormData("floors", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="direction" className="flex items-center gap-2 mb-2">
                      <Compass className="w-4 h-4" />
                      Hướng Nhà
                    </Label>
                    <Select value={formData.direction} onValueChange={(value) => updateFormData("direction", value)}>
                      <SelectTrigger id="direction">
                        <SelectValue placeholder="Chọn hướng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dong">Đông</SelectItem>
                        <SelectItem value="tay">Tây</SelectItem>
                        <SelectItem value="nam">Nam</SelectItem>
                        <SelectItem value="bac">Bắc</SelectItem>
                        <SelectItem value="dongbac">Đông Bắc</SelectItem>
                        <SelectItem value="dongnam">Đông Nam</SelectItem>
                        <SelectItem value="taybac">Tây Bắc</SelectItem>
                        <SelectItem value="taynam">Tây Nam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year-built" className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Năm Xây Dựng
                    </Label>
                    <Input
                      id="year-built"
                      type="number"
                      placeholder="VD: 2020"
                      value={formData.yearBuilt}
                      onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="legal-status" className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      Tình Trạng Pháp Lý <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.legalStatus} onValueChange={(value) => updateFormData("legalStatus", value)}>
                      <SelectTrigger id="legal-status">
                        <SelectValue placeholder="Chọn tình trạng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Sổ Đỏ/Sổ Hồng</SelectItem>
                        <SelectItem value="waiting">Đang Chờ Sổ</SelectItem>
                        <SelectItem value="contract">Hợp Đồng Mua Bán</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ownership" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Quyền Sở Hữu
                    </Label>
                    <Select value={formData.ownership} onValueChange={(value) => updateFormData("ownership", value)}>
                      <SelectTrigger id="ownership">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Cá Nhân</SelectItem>
                        <SelectItem value="company">Công Ty</SelectItem>
                        <SelectItem value="shared">Sở Hữu Chung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Tiện Ích & Liên Hệ */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block font-bold">Nội Thất</Label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {["Đầy Đủ", "Cơ Bản", "Cao Cấp", "Không Nội Thất", "Bếp", "Điều Hòa", "Máy Giặt", "Tủ Lạnh", "TV"].map((item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          checked={formData.furniture.includes(item)}
                          onCheckedChange={() => toggleArrayItem("furniture", item)}
                        />
                        <span className="text-sm text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block font-bold">Tiện Ích Xung Quanh</Label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {["Bãi Đỗ Xe", "Sân Vườn", "Hồ Bơi", "Phòng Gym", "Siêu Thị", "Trường Học", "Bệnh Viện", "Công Viên", "An Ninh 24/7"].map((item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          checked={formData.amenities.includes(item)}
                          onCheckedChange={() => toggleArrayItem("amenities", item)}
                        />
                        <span className="text-sm text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Thông Tin Liên Hệ</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="contact-name" className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        Tên Người Liên Hệ <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact-name"
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.contactName}
                        onChange={(e) => updateFormData("contactName", e.target.value)}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-phone" className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4" />
                          Số Điện Thoại <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contact-phone"
                          placeholder="VD: 0901234567"
                          value={formData.contactPhone}
                          onChange={(e) => updateFormData("contactPhone", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="contact-email" className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="VD: contact@example.com"
                          value={formData.contactEmail}
                          onChange={(e) => updateFormData("contactEmail", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                    Trạng Thái BĐS <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Đang Bán</SelectItem>
                      <SelectItem value="renting">Cho Thuê</SelectItem>
                      <SelectItem value="sold">Đã Bán</SelectItem>
                      <SelectItem value="pending">Đang Giao Dịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-border pt-6">
                  <Label className="mb-3 block font-bold flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Hình Ảnh BĐS
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-foreground/50 mb-4" />
                    <p className="text-foreground/70 mb-2">
                      Kéo thả hình ảnh vào đây hoặc nhấn để chọn
                    </p>
                    <p className="text-xs text-foreground/60">
                      Hỗ trợ: JPG, PNG (Tối đa 10 ảnh, mỗi ảnh &lt; 5MB)
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Chọn Ảnh
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay Lại
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(Math.min(5, step + 1))}
                className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
              >
                Tiếp Theo
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Check className="w-4 h-4 mr-2" />
                Hoàn Tất & Thêm BĐS
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
