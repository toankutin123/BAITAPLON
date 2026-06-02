import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, Users, Home, BarChart3, Settings, Bell, Search,
  ChevronDown, MoreVertical, Eye, Edit, Trash2, Plus, Download,
  Building2, DollarSign, Activity, UserCheck, Clock, MapPin,
  ArrowUp, ArrowDown, Filter, Calendar, Ban, CheckCircle, X,
  MessageSquare
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
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
import { userService, User } from "../services/user.service";
import { toast } from "sonner";
import { getRoleName, ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { sellerService, SellerRequest } from "../services/seller.service";
import { propertyService, Property } from "../services/property.service";
import { marketService } from "../services/market.service";
import { predictService, PredictionHistoryItem } from "../services/predict.service";
import { AdminChatManage } from "../components/AdminChatManage";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

export function AdminDashboardPage() {
  // Live data state
  const [statsData, setStatsData] = useState([
    { label: "Tổng Người Dùng", value: "0", change: "0%", trend: "up" as const, icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "BĐS Trong Hệ Thống", value: "0", change: "0%", trend: "up" as const, icon: Building2, color: "from-purple-500 to-pink-500" },
    { label: "Chờ Duyệt", value: "0", change: "0%", trend: "up" as const, icon: Clock, color: "from-orange-500 to-red-500" },
    { label: "Doanh Thu Tháng", value: "0", change: "0%", trend: "up" as const, icon: DollarSign, color: "from-green-500 to-emerald-500" },
  ]);

  const [userGrowthData, setUserGrowthData] = useState<{ month: string; users: number; active: number }[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [predictionData, setPredictionData] = useState<{ day: string; predictions: number }[]>([]);
  const [locationData, setLocationData] = useState<{ name: string; value: number }[]>([]);
  const [activityData, setActivityData] = useState<{ time: string; listings: number; views: number }[]>([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState<SellerRequest[]>([]);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<Property[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const pendingPropertiesCount = pendingProperties.length;

  useEffect(() => {
    loadUsers();
    loadPendingRequests();
    loadPendingProperties();
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const stats = await marketService.getAdminStats();
      setStatsData([
        { label: "Tổng Người Dùng", value: stats.total_users.toLocaleString(), change: "+0%", trend: "up" as const, icon: Users, color: "from-blue-500 to-cyan-500" },
        { label: "BĐS Trong Hệ Thống", value: stats.total_properties.toLocaleString(), change: "+0%", trend: "up" as const, icon: Building2, color: "from-purple-500 to-pink-500" },
        { label: "Chờ Duyệt", value: stats.pending_properties.toLocaleString(), change: "0", trend: "up" as const, icon: Clock, color: "from-orange-500 to-red-500" },
        { label: "Doanh Thu Tháng", value: "0", change: "0", trend: "up" as const, icon: DollarSign, color: "from-green-500 to-emerald-500" },
      ]);
      
      // Transform user growth data
      if (stats.users_growth && stats.users_growth.length > 0) {
        setUserGrowthData(stats.users_growth.map((item: any, idx: number) => ({
          month: item.month?.slice(5) || `T${idx + 1}`,
          users: item.count || 0,
          active: Math.floor((item.count || 0) * 0.8),
        })));
      }
      
      // Load recent properties
      const recentProps = await marketService.getRecentProperties(5);
      setRecentProperties(recentProps.map((p: any) => ({
        id: p.id,
        title: p.title,
        location: `${p.district}, ${p.city}`,
        price: `${(p.price / 1000000000).toFixed(1)} tỷ`,
        status: p.status,
        views: 0,
      })));
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  // Reload pending properties when switching to property-approvals tab
  useEffect(() => {
    if (activeTab === "property-approvals") {
      loadPendingProperties();
    }
    if (activeTab === "properties") {
      loadApprovedProperties();
    }
    if (activeTab === "predictions") {
      loadPredictionHistory();
    }
  }, [activeTab]);

  const loadPredictionHistory = async () => {
    try {
      const data = await predictService.getPredictionHistory(20);
      setPredictionHistory(data);
    } catch (error) {
      console.error("Error loading prediction history:", error);
    }
  };

  const loadPendingProperties = async () => {
    try {
      console.log("Loading pending properties...");
      const data = await propertyService.getPendingProperties();
      console.log("Pending properties data:", data);
      setPendingProperties(data);
    } catch (error) {
      console.error("Error loading pending properties:", error);
    }
  };

  const loadApprovedProperties = async () => {
    try {
      const data = await propertyService.getApprovedProperties();
      setApprovedProperties(data);
    } catch (error) {
      console.error("Error loading approved properties:", error);
    }
  };

  const handleApproveProperty = async (id: number) => {
    console.log("Approve property:", id);
    try {
      await propertyService.approveProperty(id);
      console.log("Approve success");
      toast.success("Đã duyệt BĐS");
      loadPendingProperties();
      setShowPropertyDialog(false);
      setSelectedProperty(null);
    } catch (e: any) {
      console.error("Approve error:", e);
      toast.error(e.message || "Lỗi khi duyệt BĐS");
    }
  };

  const handleRejectProperty = async (id: number) => {
    console.log("Reject property:", id);
    try {
      await propertyService.rejectProperty(id, "Bị từ chối bởi Admin");
      console.log("Reject success");
      toast.success("Đã từ chối BĐS");
      loadPendingProperties();
      setShowPropertyDialog(false);
      setSelectedProperty(null);
    } catch (e: any) {
      console.error("Reject error:", e);
      toast.error(e.message || "Lỗi khi từ chối BĐS");
    }
  };

  const handleViewPropertyDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await sellerService.getPendingRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await sellerService.approveSellerRequest(id);
      toast.success("Đã phê duyệt yêu cầu");
      loadPendingRequests();
      setShowRequestDialog(false);
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi phê duyệt");
    }
  };

  const handleRejectRequest = async (id: number) => {
    try {
      await sellerService.rejectSellerRequest(id, "Bị từ chối bởi Admin");
      toast.success("Đã từ chối yêu cầu");
      loadPendingRequests();
      setShowRequestDialog(false);
      setSelectedRequest(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi từ chối");
    }
  };

  const handleViewRequestDetails = (request: SellerRequest) => {
    setSelectedRequest(request);
    setShowRequestDialog(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpdateRole = async (userId: number, newRole: number) => {
    try {
      await userService.updateUserRole(userId, newRole);
      toast.success("Cập nhật vai trò thành công");
      loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Không thể cập nhật vai trò");
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await userService.updateUserStatus(userId, !currentStatus);
      toast.success(currentStatus ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản");
      loadUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleToggleRestriction = async (userId: number, isRestricted: boolean) => {
    try {
      await userService.updateUserRestriction(userId, !isRestricted);
      toast.success(isRestricted ? "Đã gỡ hạn chế nội dung" : "Đã hạn chế nội dung");
      loadUsers();
    } catch (error) {
      console.error("Error updating restriction:", error);
      toast.error("Không thể cập nhật giới hạn nội dung");
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-[#0F2557] text-white p-6 flex flex-col">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">EstateAI</span>
              <div className="text-xs opacity-70">Admin Panel</div>
            </div>
          </Link>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "overview" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Tổng Quan</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "users" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Người Dùng</span>
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "properties" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Bất Động Sản</span>
            </button>
            <button
              onClick={() => setActiveTab("property-approvals")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "property-approvals" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Duyệt BĐS</span>
              {pendingPropertiesCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {pendingPropertiesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("predictions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "predictions" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dự Đoán</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "chat" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Chat</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "settings" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Cài Đặt</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/20">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Về Trang Chủ</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <header className="bg-white border-b border-border px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === "overview" && "Tổng Quan"}
                  {activeTab === "users" && "Quản Lý Người Dùng"}
                  {activeTab === "properties" && "Quản Lý Bất Động Sản"}
                  {activeTab === "property-approvals" && "Duyệt Bất Động Sản"}
                  {activeTab === "predictions" && "Quản Lý Dự Đoán"}
                  {activeTab === "chat" && "Quản Lý Chat Admin"}
                  {activeTab === "settings" && "Cài Đặt Hệ Thống"}
                </h1>
                <p className="text-sm text-foreground/70">Chào mừng quay trở lại, Admin</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="Tìm kiếm..."
                    className="pl-10 w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      {pendingRequests.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                          {pendingRequests.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-4 py-3 border-b border-border font-medium">Thông Báo Yêu Cầu</div>
                    {pendingRequests.length === 0 ? (
                      <div className="p-4 text-center text-sm text-foreground/70">Không có yêu cầu mới</div>
                    ) : (
                      pendingRequests.slice(0, 5).map(req => (
                        <div
                          key={req.id}
                          className="p-4 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleViewRequestDetails(req)}
                        >
                          <div className="font-medium text-sm mb-1">{req.business_name}</div>
                          <div className="text-xs text-foreground/70">Từ: {req.full_name || req.username}</div>
                          <div className="mt-2 text-xs text-blue-600">Click để xem chi tiết</div>
                        </div>
                      ))
                    )}
                    {pendingRequests.length > 5 && (
                      <div className="p-3 text-center text-sm text-blue-600 hover:bg-blue-50 border-t border-border">
                        Còn {pendingRequests.length - 5} yêu cầu khác
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                          A
                        </div>
                      </Avatar>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Hồ Sơ</DropdownMenuItem>
                    <DropdownMenuItem>Cài Đặt</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={handleLogout}>Đăng Xuất</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="p-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsData.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="p-6 bg-white border-border hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            {stat.trend === "up" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {stat.change}
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {stat.label}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* User Growth Chart */}
                  <Card className="p-6 bg-white border-border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-foreground">Tăng Trưởng Người Dùng</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            6 Tháng <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>1 Tháng</DropdownMenuItem>
                          <DropdownMenuItem>3 Tháng</DropdownMenuItem>
                          <DropdownMenuItem>6 Tháng</DropdownMenuItem>
                          <DropdownMenuItem>1 Năm</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={userGrowthData}>
                        <defs>
                          <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fill="url(#userGradient)"
                          name="Tổng Người Dùng"
                        />
                        <Area
                          type="monotone"
                          dataKey="active"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          fill="url(#activeGradient)"
                          name="Người Dùng Hoạt Động"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Predictions Chart */}
                  <Card className="p-6 bg-white border-border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-foreground">Dự Đoán Tuần Này</h3>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Xuất
                      </Button>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={predictionData}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="predictions" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Location Distribution & Recent Activity */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Location Pie Chart */}
                  <Card className="p-6 bg-white border-border">
                    <h3 className="text-lg font-bold text-foreground mb-6">
                      Phân Bố Theo Khu Vực
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={locationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {locationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {locationData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-foreground/70">{item.name}</span>
                          </div>
                          <span className="font-medium text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="p-6 bg-white border-border lg:col-span-2">
                    <h3 className="text-lg font-bold text-foreground mb-6">
                      Hoạt Động Gần Đây
                    </h3>
                    <div className="space-y-4">
                      {[
                        { icon: UserCheck, text: "Nguyễn Văn A đã đăng ký tài khoản", time: "2 phút trước", color: "text-blue-600 bg-blue-50" },
                        { icon: Building2, text: "BĐS mới: Căn hộ Vinhomes Central Park", time: "15 phút trước", color: "text-purple-600 bg-purple-50" },
                        { icon: Activity, text: "127 dự đoán mới trong 1 giờ qua", time: "1 giờ trước", color: "text-green-600 bg-green-50" },
                        { icon: DollarSign, text: "Giao dịch thành công: 5.2 tỷ VND", time: "2 giờ trước", color: "text-orange-600 bg-orange-50" },
                        { icon: Users, text: "15 người dùng mới đăng ký hôm nay", time: "3 giờ trước", color: "text-cyan-600 bg-cyan-50" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center flex-shrink-0`}>
                            <activity.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground font-medium">{activity.text}</p>
                            <p className="text-xs text-foreground/60 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Tìm người dùng..."
                      className="w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Lọc
                    </Button>
                  </div>
                  <div className="text-sm text-foreground/70">
                    Tổng: {filteredUsers.length} người dùng
                  </div>
                </div>

                {loading ? (
                  <Card className="p-8 text-center">
                    <p className="text-foreground/70">Đang tải...</p>
                  </Card>
                ) : (
                  <Card className="bg-white border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-border">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Người Dùng</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Vai Trò</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Trạng Thái</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Tham Gia</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-foreground/70 uppercase">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                                    {(user.full_name || user.username).charAt(0).toUpperCase()}
                                  </div>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-foreground">{user.full_name || user.username}</div>
                                  {user.full_name && <div className="text-xs text-foreground/60">@{user.username}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground/70">{user.email}</td>
                            <td className="px-6 py-4">
                              <Badge variant={user.role === 1 ? "default" : "secondary"}>
                                {getRoleName(user.role)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={user.status ? "default" : "secondary"} className={user.status ? "bg-green-500" : "bg-gray-400"}>
                                {user.status ? "Hoạt động" : "Bị khóa"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground/70">{formatDate(user.created_at)}</td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    onClick={() => handleToggleRestriction(user.id, user.content_restricted)}
                                    className="text-orange-600"
                                  >
                                    {user.content_restricted ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Gỡ hạn chế nội dung
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Hạn chế nội dung (Người bán)
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                    className={user.status ? "text-red-600" : "text-green-600"}
                                  >
                                    {user.status ? (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Khóa tài khoản
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mở khóa tài khoản
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                )}
              </div>
            )}

            {activeTab === "properties" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Tìm BĐS..."
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Lọc
                    </Button>
                  </div>
                  <div className="text-sm text-foreground/70">
                    Tổng: {approvedProperties.length} BĐS đã duyệt
                  </div>
                </div>

                <Card className="bg-white border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Tiêu Đề</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Vị Trí</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Giá</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Diện Tích</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Trạng Thái</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-foreground/70 uppercase">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {approvedProperties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{property.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-foreground/70">
                                <MapPin className="w-4 h-4" />
                                {property.address}, {property.district}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">
                                {(property.price / 1000000000).toFixed(2)} tỷ
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-foreground">{property.area}m²</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="default" className="bg-green-500">
                                {property.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Xem Chi Tiết
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Chỉnh Sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "predictions" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <div className="text-sm opacity-80 mb-2">Tổng Dự Đoán</div>
                    <div className="text-4xl font-bold mb-1">{predictionHistory.length}</div>
                    <div className="text-sm opacity-70">Lịch sử dự đoán</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <div className="text-sm opacity-80 mb-2">Độ Chính Xác TB</div>
                    <div className="text-4xl font-bold mb-1">
                      {predictionHistory.length > 0
                        ? (predictionHistory.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictionHistory.length * 100).toFixed(0)
                        : 0}%
                    </div>
                    <div className="text-sm opacity-70">Độ tin cậy trung bình</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <div className="text-sm opacity-80 mb-2">Hôm Nay</div>
                    <div className="text-4xl font-bold mb-1">
                      {predictionHistory.filter(p => {
                        const today = new Date();
                        const predDate = new Date(p.created_at);
                        return predDate.toDateString() === today.toDateString();
                      }).length}
                    </div>
                    <div className="text-sm opacity-70">Dự đoán hôm nay</div>
                  </Card>
                </div>

                <Card className="p-6 bg-white border-border">
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Lịch Sử Dự Đoán Gần Đây
                  </h3>
                  {predictionHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-foreground/70">Chưa có dự đoán nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {predictionHistory.slice(0, 10).map((pred) => (
                        <div key={pred.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <Activity className="w-6 h-6 text-[#3B82F6]" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground capitalize">{pred.property_type} - {pred.location}</div>
                              <div className="text-sm text-foreground/70">{pred.area}m² • {pred.bedrooms} phòng ngủ • {pred.bathrooms} phòng tắm</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{(pred.predicted_price / 1000000000).toFixed(2)} tỷ VND</div>
                            <div className="text-sm text-green-600">{(pred.confidence * 100).toFixed(0)}% độ tin cậy</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === "property-approvals" && (
              <div className="space-y-6">
                <Card className="p-6 bg-white border-border">
                  <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Bất Động Sản Chờ Duyệt ({pendingProperties.length})
                  </h3>
                  {pendingProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-foreground/70">Không có BĐS nào chờ duyệt</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProperties.map((property) => (
                        <div
                          key={property.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-[#3B82F6]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{property.title}</h4>
                              <p className="text-sm text-foreground/70 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.address}, {property.district}
                              </p>
                              <p className="text-sm font-bold text-[#3B82F6]">
                                {(property.price / 1000000000).toFixed(2)} tỷ - {property.area}m²
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPropertyDetails(property)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Chi Tiết
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveProperty(property.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectProperty(property.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Từ Chối
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="p-6">
                <AdminChatManage />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <Card className="p-6 bg-white border-border">
                  <h3 className="text-lg font-bold text-foreground mb-6">Cài Đặt Chung</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tên Hệ Thống
                      </label>
                      <Input defaultValue="EstateAI" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Hỗ Trợ
                      </label>
                      <Input defaultValue="support@estateai.vn" type="email" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Số Điện Thoại
                      </label>
                      <Input defaultValue="1900 xxxx" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white border-border">
                  <h3 className="text-lg font-bold text-foreground mb-6">Cài Đặt AI</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Độ Chính Xác Tối Thiểu (%)
                      </label>
                      <Input type="number" defaultValue="85" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Thời Gian Cache (giây)
                      </label>
                      <Input type="number" defaultValue="300" />
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button variant="outline">Hủy</Button>
                  <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                    Lưu Thay Đổi
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Seller Request Detail Dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Chi Tiết Yêu Cầu Trở Thành Người Bán
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-left">
                {selectedRequest && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-foreground/60 mb-1">Tên kinh doanh</p>
                        <p className="font-medium">{selectedRequest.business_name}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-foreground/60 mb-1">Loại hình</p>
                        <p className="font-medium capitalize">
                          {selectedRequest.business_type === "individual" ? "Cá Nhân" :
                           selectedRequest.business_type === "company" ? "Công Ty" : "Sàn Giao Dịch"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-foreground/60 mb-1">Số điện thoại</p>
                        <p className="font-medium">{selectedRequest.phone_number}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-foreground/60 mb-1">Người dùng</p>
                        <p className="font-medium">{selectedRequest.full_name || selectedRequest.username}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Địa chỉ kinh doanh</p>
                      <p className="font-medium">
                        {selectedRequest.business_address}, {selectedRequest.district}, {selectedRequest.city}
                      </p>
                    </div>
                    {selectedRequest.description && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-foreground/60 mb-1">Mô tả</p>
                        <p className="font-medium">{selectedRequest.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1">Quay Lại</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleRejectRequest(selectedRequest.id)}
              className="flex-1 gap-1"
            >
              <X className="w-4 h-4" />
              Từ Chối
            </Button>
            <Button
              onClick={() => selectedRequest && handleApproveRequest(selectedRequest.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Chấp Nhận
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
