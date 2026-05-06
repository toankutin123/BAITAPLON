import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, Users, Home, BarChart3, Settings, Bell, Search,
  ChevronDown, MoreVertical, Eye, Edit, Trash2, Plus, Download,
  Building2, DollarSign, Activity, UserCheck, Clock, MapPin,
  ArrowUp, ArrowDown, Filter, Calendar, Ban, CheckCircle
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
import { userService, User } from "../services/user.service";
import { toast } from "sonner";

// Mock Data
const statsData = [
  { label: "Tổng Người Dùng", value: "12,543", change: "+12.5%", trend: "up", icon: Users, color: "from-blue-500 to-cyan-500" },
  { label: "BĐS Trong Hệ Thống", value: "8,234", change: "+8.2%", trend: "up", icon: Building2, color: "from-purple-500 to-pink-500" },
  { label: "Dự Đoán Hôm Nay", value: "1,247", change: "+23.1%", trend: "up", icon: Activity, color: "from-green-500 to-emerald-500" },
  { label: "Doanh Thu Tháng", value: "450M", change: "-3.2%", trend: "down", icon: DollarSign, color: "from-orange-500 to-red-500" },
];

const userGrowthData = [
  { month: "T1", users: 8200, active: 6500 },
  { month: "T2", users: 8800, active: 7100 },
  { month: "T3", users: 9500, active: 7800 },
  { month: "T4", users: 10200, active: 8400 },
  { month: "T5", users: 11000, active: 9100 },
  { month: "T6", users: 12543, active: 10200 },
];

const predictionData = [
  { day: "T2", predictions: 980 },
  { day: "T3", predictions: 1120 },
  { day: "T4", predictions: 890 },
  { day: "T5", predictions: 1350 },
  { day: "T6", predictions: 1180 },
  { day: "T7", predictions: 1450 },
  { day: "CN", predictions: 1247 },
];

const locationData = [
  { name: "Q1", value: 2400, color: "#3B82F6" },
  { name: "Q7", value: 1890, color: "#8B5CF6" },
  { name: "Bình Thạnh", value: 1650, color: "#06B6D4" },
  { name: "Thủ Đức", value: 1420, color: "#10B981" },
  { name: "Khác", value: 1874, color: "#F59E0B" },
];

const recentProperties = [
  { id: 1, title: "Căn Hộ Vinhomes Central Park", location: "Quận 1, TP.HCM", price: "5.2 tỷ", status: "Đang bán", views: 1234 },
  { id: 2, title: "Nhà Phố Thảo Điền", location: "Quận 2, TP.HCM", price: "12.5 tỷ", status: "Đang bán", views: 856 },
  { id: 3, title: "Biệt Thự Phú Mỹ Hưng", location: "Quận 7, TP.HCM", price: "25.0 tỷ", status: "Đã bán", views: 2341 },
  { id: 4, title: "Căn Hộ The Sun Avenue", location: "Bình Thạnh, TP.HCM", price: "3.8 tỷ", status: "Đang bán", views: 678 },
  { id: 5, title: "Đất Nền Nhà Bè", location: "Nhà Bè, TP.HCM", price: "4.5 tỷ", status: "Cho thuê", views: 445 },
];

const getRoleName = (role: number) => {
  switch (role) {
    case 1: return "Admin";
    case 2: return "Môi Giới";
    case 3: return "Người Dùng";
    default: return "Không xác định";
  }
};

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
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

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
              onClick={() => setActiveTab("predictions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === "predictions" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dự Đoán</span>
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
                  {activeTab === "predictions" && "Quản Lý Dự Đoán"}
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
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
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
                    <DropdownMenuItem className="text-red-600">Đăng Xuất</DropdownMenuItem>
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
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 1)}>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Đặt làm Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 2)}>
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Đặt làm Môi Giới
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 3)}>
                                    <Users className="w-4 h-4 mr-2" />
                                    Đặt làm Người Dùng
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
                  <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm BĐS
                  </Button>
                </div>

                <Card className="bg-white border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Tiêu Đề</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Vị Trí</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Giá</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Trạng Thái</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-foreground/70 uppercase">Lượt Xem</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-foreground/70 uppercase">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentProperties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{property.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-foreground/70">
                                <MapPin className="w-4 h-4" />
                                {property.location}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">{property.price}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={
                                property.status === "Đang bán" ? "default" :
                                property.status === "Đã bán" ? "secondary" : "outline"
                              }>
                                {property.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-foreground/70">
                                <Eye className="w-4 h-4" />
                                {property.views.toLocaleString()}
                              </div>
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
                    <div className="text-sm opacity-80 mb-2">Tổng Dự Đoán Hôm Nay</div>
                    <div className="text-4xl font-bold mb-1">1,247</div>
                    <div className="text-sm opacity-70">+23.1% so với hôm qua</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <div className="text-sm opacity-80 mb-2">Độ Chính Xác Trung Bình</div>
                    <div className="text-4xl font-bold mb-1">94.2%</div>
                    <div className="text-sm opacity-70">+1.5% so với tuần trước</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <div className="text-sm opacity-80 mb-2">Thời Gian Xử Lý TB</div>
                    <div className="text-4xl font-bold mb-1">1.2s</div>
                    <div className="text-sm opacity-70">-0.3s so với tuần trước</div>
                  </Card>
                </div>

                <Card className="p-6 bg-white border-border">
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Lịch Sử Dự Đoán Gần Đây
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-[#3B82F6]" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">Căn Hộ Vinhomes Central Park</div>
                            <div className="text-sm text-foreground/70">Quận 1, TP.HCM • 80m²</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">5.12 tỷ VND</div>
                          <div className="text-sm text-green-600">94% độ tin cậy</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
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
    </div>
  );
}
