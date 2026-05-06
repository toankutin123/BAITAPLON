import { useState } from "react"
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

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // User Data State
  const [userData, setUserData] = useState({
    // Basic Info
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    dateOfBirth: "1990-01-15",
    gender: "male",

    // Address
    province: "hcm",
    district: "q1",
    ward: "Phường Bến Nghé",
    streetAddress: "123 Đường Nguyễn Huệ",

    // Contact Info
    contactName: "Nguyễn Văn A",
    contactPhone: "0901234567",
    contactEmail: "nguyenvana@example.com",
    zalo: "0901234567",
    facebook: "",

    // Account Info
    accountType: "personal", // personal, agent, company
    memberSince: "2024-01-15",
    verified: true,
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

  const updateUserData = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const updatePasswordData = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // Validate & Save logic here
    toast.success("Đã lưu thông tin thành công!");
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    // Change password logic here
    toast.success("Đã đổi mật khẩu thành công!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setIsEditingPassword(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original data
  };

  const myProperties = [
    { id: 1, title: "Căn Hộ Vinhomes Central Park", status: "active", views: 1234, favorites: 45 },
    { id: 2, title: "Nhà Phố Thảo Điền", status: "active", views: 856, favorites: 32 },
    { id: 3, title: "Biệt Thự Phú Mỹ Hưng", status: "pending", views: 2341, favorites: 78 },
  ];

  const savedProperties = [
    { id: 4, title: "Căn Hộ The Sun Avenue", price: "3.8 tỷ", location: "Bình Thạnh" },
    { id: 5, title: "Căn Hộ Masteri Thảo Điền", price: "6.8 tỷ", location: "Quận 2" },
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
                    {userData.fullName.charAt(0)}
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
                {userData.fullName}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Loại tài khoản</span>
                <span className="font-medium text-foreground capitalize">
                  {userData.accountType === "personal" ? "Cá nhân" :
                   userData.accountType === "agent" ? "Môi giới" : "Doanh nghiệp"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Thành viên từ</span>
                <span className="font-medium text-foreground">
                  {new Date(userData.memberSince).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Thông Tin
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Bảo Mật
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  BĐS Của Tôi
                </TabsTrigger>
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
                            value={userData.fullName}
                            onChange={(e) => updateUserData("fullName", e.target.value)}
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
                              <SelectItem value="personal">Cá Nhân</SelectItem>
                              <SelectItem value="agent">Môi Giới</SelectItem>
                              <SelectItem value="company">Doanh Nghiệp</SelectItem>
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

              {/* My Properties Tab */}
              <TabsContent value="properties">
                <Card className="p-8 bg-white border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      Bất Động Sản Của Tôi
                    </h2>
                    <Link to="/admin/add-property">
                      <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                        <Building2 className="w-4 h-4 mr-2" />
                        Đăng Tin Mới
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {myProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground mb-2">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-foreground/70">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {property.views} lượt xem
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {property.favorites} yêu thích
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {property.status === "active" ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Đang hiển thị
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                              Chờ duyệt
                            </span>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Saved Properties Tab */}
              <TabsContent value="saved">
                <Card className="p-8 bg-white border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Bất Động Sản Đã Lưu
                  </h2>

                  <div className="space-y-4">
                    {savedProperties.map((property) => (
                      <Link
                        key={property.id}
                        to={`/properties/${property.id}`}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="font-bold text-foreground mb-2">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-foreground/70">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {property.location}
                            </div>
                            <div className="font-bold text-foreground">
                              {property.price}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </Link>
                    ))}
                  </div>
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
