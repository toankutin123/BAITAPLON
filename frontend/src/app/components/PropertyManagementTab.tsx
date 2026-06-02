import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Building2, Home, MapPin, Edit, Trash2, Plus, Eye, Check,
  X, DollarSign, Ruler, Bed, Bath, Clock, CheckCircle, AlertCircle,
  Image, Upload, X as XIcon, ArrowLeft, FileText, User, Compass, Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { propertyService, Property, PropertyFormData } from "../services/property.service";
import { useAuth } from "../context/AuthContext";

export function PropertyManagementTab() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [addStep, setAddStep] = useState(1);

  const handleOpenAddDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) setAddStep(1);
  };
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    property_type: "",
    price: 0,
    price_unit: "vnd",
    area: 0,
    address: "",
    city: "hcm",
    district: "",
    bedrooms: 1,
    bathrooms: 1,
    images: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getMyProperties();
      // Filter chỉ lấy BĐS của user hiện tại
      const myProperties = data.filter(p => p.user_id === user?.id);
      setProperties(myProperties);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Không thể tải danh sách BĐS");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async () => {
    console.log("handleAddProperty called, formData:", formData);
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }
    if (!formData.property_type) {
      toast.error("Vui lòng chọn loại BĐS");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Vui lòng nhập giá hợp lệ");
      return;
    }

    try {
      console.log("Calling API...");
      const result = await propertyService.createProperty(formData);
      console.log("API result:", result);
      toast.success("Đã thêm BĐS mới. Đang chờ admin duyệt.");
      setShowAddDialog(false);
      resetFormData();
      loadProperties();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi khi thêm BĐS");
    }
  };

  const handleUpdateProperty = async () => {
    if (!selectedProperty) return;

    try {
      await propertyService.updateProperty(selectedProperty.id, formData);
      toast.success("Đã cập nhật BĐS. Đang chờ admin duyệt.");
      setShowEditDialog(false);
      setSelectedProperty(null);
      resetFormData();
      loadProperties();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật");
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;

    try {
      await propertyService.deleteProperty(selectedProperty.id);
      toast.success("Đã xóa BĐS");
      setShowDeleteDialog(false);
      setSelectedProperty(null);
      loadProperties();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa");
    }
  };

  const resetFormData = () => {
    setFormData({
      title: "",
      description: "",
      property_type: "",
      price: 0,
      price_unit: "vnd",
      area: 0,
      address: "",
      city: "hcm",
      district: "",
      bedrooms: 1,
      bathrooms: 1,
      images: [],
    });
  };

  const openEditDialog = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      price: property.price,
      price_unit: property.price_unit,
      area: property.area,
      address: property.address,
      city: property.city,
      district: property.district,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      images: (property as any).images || [],
    });
    setShowEditDialog(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit && selectedProperty) {
          setFormData((prev: any) => ({
            ...prev,
            images: [...prev.images, base64],
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, base64],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setFormData((prev: any) => ({
        ...prev,
        images: prev.images.filter((_: any, i: number) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(2)} tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-green-500 gap-1">
          <CheckCircle className="w-3 h-3" />
          Đã xác minh
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 gap-1">
          <Clock className="w-3 h-3" />
          Chờ duyệt
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <X className="w-3 h-3" />
        Bị từ chối
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Quản Lý Bất Động Sản</h2>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm BĐS Mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{properties.length}</p>
              <p className="text-sm text-foreground/70">Tổng BĐS</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {properties.filter(p => p.status === "pending").length}
              </p>
              <p className="text-sm text-foreground/70">Đang chờ duyệt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {properties.filter(p => p.status === "approved").length}
              </p>
              <p className="text-sm text-foreground/70">Đã xác minh</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Properties List */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-foreground/70">Đang tải...</p>
        </Card>
      ) : properties.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-foreground/70 mb-4">Chưa có BĐS nào. Hãy thêm BĐS đầu tiên!</p>
          <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
            <Plus className="w-4 h-4 mr-2" />
            Thêm BĐS Mới
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {properties.map((property) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-white border-border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-10 h-10 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-foreground line-clamp-1">{property.title}</h3>
                      {getStatusBadge(property.status)}
                    </div>
                    <p className="text-sm text-foreground/70 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.address}, {property.district}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-foreground/70 mb-3">
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {property.area}m²
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        {property.bedrooms} PN
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3" />
                        {property.bathrooms} PT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-[#3B82F6]">
                        {formatPrice(property.price)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(property)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedProperty(property);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Property Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleOpenAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5" />
              Thêm Bất Động Sản Mới
            </DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {[
                { number: 1, title: "Cơ Bản" },
                { number: 2, title: "Vị Trí" },
                { number: 3, title: "Giá" },
                { number: 4, title: "Chi Tiết" },
                { number: 5, title: "Hình Ảnh" }
              ].map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      addStep >= step.number
                        ? "bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {addStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                    </div>
                    <div className={`mt-1 text-xs font-medium ${
                      addStep >= step.number ? "text-foreground" : "text-foreground/50"
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < 4 && (
                    <div className={`h-0.5 flex-1 mx-1 ${
                      addStep > step.number ? "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Step 1: Thông Tin Cơ Bản */}
            {addStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Tiêu Đề BĐS <span className="text-red-500">*</span></Label>
                  <Input placeholder="VD: Căn Hộ Vinhomes Central Park" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Loại BĐS <span className="text-red-500">*</span></Label>
                  <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn loại BĐS" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Căn Hộ Chung Cư</SelectItem>
                      <SelectItem value="house">Nhà Phố</SelectItem>
                      <SelectItem value="villa">Biệt Thự</SelectItem>
                      <SelectItem value="townhouse">Nhà Liền Kề</SelectItem>
                      <SelectItem value="land">Đất Nền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Mô Tả <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Mô tả về BĐS..." rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 2: Vị Trí */}
            {addStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Tỉnh/Thành <span className="text-red-500">*</span></Label>
                    <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hcm">TP. HCM</SelectItem>
                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Quận/Huyện <span className="text-red-500">*</span></Label>
                    <Input placeholder="Quận 1" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Địa Chỉ <span className="text-red-500">*</span></Label>
                  <Input placeholder="123 Đường Nguyễn Huệ" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 3: Giá & Diện Tích */}
            {addStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Giá (VND) <span className="text-red-500">*</span></Label>
                    <Input type="number" placeholder="5200000000" value={formData.price || ""} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
                    {formData.price > 0 && <p className="text-xs text-foreground/60 mt-1">≈ {(formData.price / 1000000000).toFixed(2)} tỷ</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Diện Tích (m²) <span className="text-red-500">*</span></Label>
                    <Input type="number" placeholder="80" value={formData.area || ""} onChange={(e) => setFormData({ ...formData, area: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formData.price ? (formData.price / 1000000000).toFixed(2) : "0"} tỷ</div>
                      <div className="text-xs text-foreground/70">Tổng Giá</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-purple-50 border-purple-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formData.area || "0"} m²</div>
                      <div className="text-xs text-foreground/70">Diện Tích</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Chi Tiết */}
            {addStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Phòng Ngủ</Label>
                    <Select value={String(formData.bedrooms)} onValueChange={(v) => setFormData({ ...formData, bedrooms: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Studio</SelectItem>
                        <SelectItem value="1">1 Phòng</SelectItem>
                        <SelectItem value="2">2 Phòng</SelectItem>
                        <SelectItem value="3">3 Phòng</SelectItem>
                        <SelectItem value="4">4 Phòng</SelectItem>
                        <SelectItem value="5">5+ Phòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Phòng Tắm</Label>
                    <Select value={String(formData.bathrooms)} onValueChange={(v) => setFormData({ ...formData, bathrooms: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Phòng</SelectItem>
                        <SelectItem value="2">2 Phòng</SelectItem>
                        <SelectItem value="3">3 Phòng</SelectItem>
                        <SelectItem value="4">4+ Phòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Pháp Lý</Label>
                  <Select defaultValue="full">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Sổ Đỏ/Sổ Hồng</SelectItem>
                      <SelectItem value="waiting">Đang Chờ Sổ</SelectItem>
                      <SelectItem value="contract">Hợp Đồng</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Hình Ảnh */}
            {addStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Hình Ảnh BĐS</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={(e) => handleImageUpload(e)} className="hidden" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl flex items-center justify-center">
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-3 text-sm text-foreground/60 hover:text-foreground border-2 border-dashed border-border rounded-lg hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      <span>Chọn Hình Ảnh</span>
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">BĐS sẽ được hiển thị sau khi admin duyệt.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="flex-row gap-3 mt-6">
            {addStep > 1 ? (
              <Button variant="outline" onClick={() => setAddStep(addStep - 1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay Lại
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleOpenAddDialog(false)} className="flex-1">
                Hủy
              </Button>
            )}
            {addStep < 5 ? (
              <Button onClick={() => setAddStep(addStep + 1)} className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                Tiếp Theo
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  console.log("Button clicked!");
                  handleAddProperty();
                }}
                className="flex-1 h-10 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                Hoàn Tất
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Sửa BĐS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tiêu Đề *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại BĐS *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(v) => setFormData({ ...formData, property_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Căn Hộ Chung Cư</SelectItem>
                    <SelectItem value="house">Nhà Phố</SelectItem>
                    <SelectItem value="villa">Biệt Thự</SelectItem>
                    <SelectItem value="townhouse">Nhà Liền Kề</SelectItem>
                    <SelectItem value="land">Đất Nền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Diện Tích (m²) *</Label>
                <Input
                  type="number"
                  value={formData.area || ""}
                  onChange={(e) => setFormData({ ...formData, area: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giá (VND) *</Label>
                <Input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Tỉnh/Thành *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(v) => setFormData({ ...formData, city: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                    <SelectItem value="hanoi">Hà Nội</SelectItem>
                    <SelectItem value="danang">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Địa Chỉ Chi Tiết *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Quận/Huyện *</Label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phòng Ngủ</Label>
                <Select
                  value={String(formData.bedrooms)}
                  onValueChange={(v) => setFormData({ ...formData, bedrooms: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phòng Tắm</Label>
                <Select
                  value={String(formData.bathrooms)}
                  onValueChange={(v) => setFormData({ ...formData, bathrooms: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Mô Tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Hình Ảnh</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  {(formData as any).images?.map((img: string, index: number) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, true)}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-4 text-foreground/70 hover:text-foreground transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Click để tải lên hình ảnh</span>
                </button>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <p className="text-sm text-orange-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Sau khi sửa, BĐS sẽ được chuyển về trạng thái chờ duyệt.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedProperty(null); resetFormData(); }} className="flex-1">
              Hủy
            </Button>
            <Button onClick={handleUpdateProperty} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Xác Nhận Xóa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc muốn xóa BĐS "<strong>{selectedProperty?.title}</strong>"?</p>
            <p className="text-sm text-foreground/70 mt-2">Hành động này không thể hoàn tác.</p>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedProperty(null); }} className="flex-1">
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteProperty} className="flex-1">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}