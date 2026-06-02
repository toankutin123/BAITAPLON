import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, User, MapPin, Phone, Mail, Lock, Camera, Save,
  Edit, X, Check, Building2, Home, Heart, Eye, FileText, Settings,
  Bell, Shield, CreditCard, ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Avatar } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { ROLES, getRoleName } from "../constants/roles";
import { PropertyManagementTab } from "../components/PropertyManagementTab";
import { userService } from "../services/user.service";
import { propertyService, Property } from "../services/property.service";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // User Data State - initialized from AuthContext user
  const [userData, setUserData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    province: "hcm",
    district: "",
    ward: "",
    streetAddress: "",
    zalo: "",
    facebook: "",
    accountType: "personal",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  // Saved properties state
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  // Load saved properties
  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      setSavedLoading(true);
      const data = await propertyService.getSavedProperties();
      setSavedProperties(data);
    } catch (error) {
      console.error("Error loading saved properties:", error);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleRemoveSaved = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await propertyService.removeSavedProperty(propertyId);
      toast.success("Đã xóa khỏi danh sách đã lưu");
      loadSavedProperties();
    } catch (error) {
      toast.error("Lỗi khi xóa BĐS đã lưu");
    }
  };

  const updateUserData = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const updatePasswordData = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile({
        full_name: userData.full_name,
      });
      toast.success("Đã lưu thông tin thành công!");
      updateUser({ ...user, full_name: userData.full_name });
      setIsEditing(false);
    } catch (error) {
      toast.error("Lỗi khi lưu thông tin");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Đã đổi mật khẩu thành công!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsEditingPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi đổi mật khẩu");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setUserData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: "",
        dateOfBirth: "",
        gender: "male",
        province: "hcm",
        district: "",
        ward: "",
        streetAddress: "",
        zalo: "",
        facebook: "",
        accountType: "personal",
      });
    }
  };

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

          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Thông Tin Tài Khoản
          </h1>
          <p className="text-foreground/70">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <Card className="p-6 bg-white border-border h-fit">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-4">
                  <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-4xl font-bold">
                    {(userData.full_name || user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-4 right-0 rounded-full bg-white border-2 border-border hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4 text-foreground" />
                </Button>
              </div>

              <h3 className="text-xl font-bold text-foreground text-center mb-1">
                {userData.full_name || user?.username}
              </h3>
              <p className="text-sm text-foreground/70 mb-2">{userData.email}</p>

              {userData.verified && (
                <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <Check className="w-4 h-4" />
                  Đã Xác Minh
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Loại tài khoản</span>
                <span className="font-medium text-foreground">
                  {getRoleName(user?.role || 3)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Thành viên từ</span>
                <span className="font-medium text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : "N/A"}
                </span>
              </div>
            </div>

            {(user?.role === ROLES.BUYER || user?.role === ROLES.SELLER) && (
              <Link to="/become-seller">
                <Button className="w-full gap-2" variant="default">
                  <Building2 className="w-4 h-4" />
                  {user?.role === ROLES.BUYER ? "Trở Thành Người Bán" : "Quản Lý Yêu Cầu Bán"}
                </Button>
              </Link>
            )}
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className={`grid w-full ${(user?.role === ROLES.SELLER || user?.role === ROLES.ADMIN) ? "grid-cols-5" : "grid-cols-4"}`}>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Thông Tin
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Bảo Mật
                </TabsTrigger>
                {(user?.role === ROLES.SELLER || user?.role === ROLES.ADMIN) && (
                  <TabsTrigger value="properties" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Quản Lý BĐS
                  </TabsTrigger>
                )}
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Đã Lưu
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Cài Đặt
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="p-8 bg-white border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      Thông Tin Cá Nhân
                    </h2>
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh Sửa
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Lưu Thay Đổi
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Thông Tin Cơ Bản
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="fullName" className="mb-2 block">
                            Họ và Tên <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            value={userData.full_name}
                            onChange={(e) => updateUserData("full_name", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="mb-2 block">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={userData.email}
                            onChange={(e) => updateUserData("email", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone" className="mb-2 block">
                            Số Điện Thoại <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            value={userData.phone}
                            onChange={(e) => updateUserData("phone", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="dateOfBirth" className="mb-2 block">
                            Ngày Sinh
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={userData.dateOfBirth}
                            onChange={(e) => updateUserData("dateOfBirth", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gender" className="mb-2 block">
                            Giới Tính
                          </Label>
                          <Select
                            value={userData.gender}
                            onValueChange={(value) => updateUserData("gender", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger id="gender">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Nam</SelectItem>
                              <SelectItem value="female">Nữ</SelectItem>
                              <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="accountType" className="mb-2 block">
                            Loại Tài Khoản
                          </Label>
                          <Select
                            value={userData.accountType}
                            onValueChange={(value) => updateUserData("accountType", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger id="accountType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Người mua bất động sản</SelectItem>
                              <SelectItem value="agent">Người bán bất động sản</SelectItem>
                              <SelectItem value="company">Công Ty/Doanh Nghiệp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address Information */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Địa Chỉ
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="province" className="mb-2 block">
                            Tỉnh/Thành Phố <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={userData.province}
                            onValueChange={(value) => updateUserData("province", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger id="province">
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
                          <Select
                            value={userData.district}
                            onValueChange={(value) => updateUserData("district", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger id="district">
                              <SelectValue />
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
                          <Label htmlFor="ward" className="mb-2 block">
                            Phường/Xã
                          </Label>
                          <Input
                            id="ward"
                            value={userData.ward}
                            onChange={(e) => updateUserData("ward", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="streetAddress" className="mb-2 block">
                            Địa Chỉ Chi Tiết <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="streetAddress"
                            value={userData.streetAddress}
                            onChange={(e) => updateUserData("streetAddress", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Thông Tin Liên Hệ
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="contactName" className="mb-2 block">
                            Tên Liên Hệ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contactName"
                            value={userData.contactName}
                            onChange={(e) => updateUserData("contactName", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contactPhone" className="mb-2 block">
                            Số Điện Thoại Liên Hệ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contactPhone"
                            value={userData.contactPhone}
                            onChange={(e) => updateUserData("contactPhone", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contactEmail" className="mb-2 block">
                            Email Liên Hệ
                          </Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={userData.contactEmail}
                            onChange={(e) => updateUserData("contactEmail", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div>
                          <Label htmlFor="zalo" className="mb-2 block">
                            Zalo
                          </Label>
                          <Input
                            id="zalo"
                            value={userData.zalo}
                            onChange={(e) => updateUserData("zalo", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="facebook" className="mb-2 block">
                            Facebook URL
                          </Label>
                          <Input
                            id="facebook"
                            value={userData.facebook}
                            onChange={(e) => updateUserData("facebook", e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="p-8 bg-white border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Bảo Mật & Mật Khẩu
                  </h2>

                  <div className="space-y-6">
                    {/* Change Password */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Đổi Mật Khẩu
                        </h3>
                        {!isEditingPassword && (
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPassword(true)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Đổi Mật Khẩu
                          </Button>
                        )}
                      </div>

                      {isEditingPassword && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword" className="mb-2 block">
                              Mật Khẩu Hiện Tại <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => updatePasswordData("currentPassword", e.target.value)}
                              placeholder="Nhập mật khẩu hiện tại"
                            />
                          </div>

                          <div>
                            <Label htmlFor="newPassword" className="mb-2 block">
                              Mật Khẩu Mới <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => updatePasswordData("newPassword", e.target.value)}
                              placeholder="Nhập mật khẩu mới"
                            />
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword" className="mb-2 block">
                              Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => updatePasswordData("confirmPassword", e.target.value)}
                              placeholder="Nhập lại mật khẩu mới"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={handleChangePassword}
                              className="bg-gradient-to-r from-green-500 to-emerald-500"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Xác Nhận Đổi Mật Khẩu
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingPassword(false);
                                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Hủy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Two-Factor Authentication */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Xác Thực Hai Yếu Tố (2FA)
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border">
                        <div>
                          <div className="font-medium text-foreground mb-1">
                            Bật xác thực hai yếu tố
                          </div>
                          <div className="text-sm text-foreground/70">
                            Tăng cường bảo mật cho tài khoản của bạn
                          </div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {(user?.role === ROLES.SELLER || user?.role === ROLES.ADMIN) && (
                <TabsContent value="properties">
                  <PropertyManagementTab />
                </TabsContent>
              )}

              {/* Saved Properties Tab */}
              <TabsContent value="saved">
                <Card className="p-8 bg-white border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Bất Động Sản Đã Lưu
                  </h2>

                  {savedLoading ? (
                    <div className="text-center py-8 text-foreground/70">Đang tải...</div>
                  ) : savedProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-foreground/70">Chưa có BĐS nào được lưu</p>
                      <Link to="/properties">
                        <Button className="mt-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                          Tìm Kiếm BĐS
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {savedProperties.map((property) => {
                        const images = Array.isArray(property.images) ? property.images : [];
                        const imageUrl = images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400";
                        return (
                          <Link
                            key={property.id}
                            to={`/properties/${property.id}`}
                            className="group p-4 border border-border rounded-xl hover:shadow-md transition-all bg-white"
                          >
                            <div className="w-full h-40 rounded-lg bg-gray-100 mb-4 overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={property.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <h3 className="font-bold text-foreground mb-2 line-clamp-1">
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-foreground/70 mb-3">
                              <MapPin className="w-4 h-4" />
                              {property.address}, {property.district}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg text-[#3B82F6]">
                                {property.price >= 1000000000
                                  ? `${(property.price / 1000000000).toFixed(1)} tỷ`
                                  : `${(property.price / 1000000).toFixed(0)} triệu`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleRemoveSaved(property.id, e)}
                              >
                                <Heart className="w-5 h-5 fill-current" />
                              </Button>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="p-8 bg-white border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Cài Đặt
                  </h2>

                  <div className="space-y-6">
                    {/* Notifications */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Thông Báo
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground mb-1">
                              Email thông báo
                            </div>
                            <div className="text-sm text-foreground/70">
                              Nhận thông báo qua email
                            </div>
                          </div>
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground mb-1">
                              SMS thông báo
                            </div>
                            <div className="text-sm text-foreground/70">
                              Nhận thông báo qua SMS
                            </div>
                          </div>
                          <Switch
                            checked={notificationSettings.smsNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground mb-1">
                              Push notification
                            </div>
                            <div className="text-sm text-foreground/70">
                              Nhận thông báo đẩy trên thiết bị
                            </div>
                          </div>
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground mb-1">
                              Email marketing
                            </div>
                            <div className="text-sm text-foreground/70">
                              Nhận email khuyến mãi và tin tức
                            </div>
                          </div>
                          <Switch
                            checked={notificationSettings.marketingEmails}
                            onCheckedChange={(checked) =>
                              setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-lg font-bold text-red-600 mb-4">
                        Vùng Nguy Hiểm
                      </h3>
                      <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                        <div className="font-medium text-foreground mb-2">
                          Xóa tài khoản
                        </div>
                        <div className="text-sm text-foreground/70 mb-4">
                          Sau khi xóa, tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </div>
                        <Button variant="destructive">
                          Xóa Tài Khoản
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
