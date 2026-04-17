import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  TrendingUp, ArrowLeft, Filter, TrendingDown, Building2,
  MapPin, Calendar, Download, RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const priceHistoryData = [
  { month: "T7/25", q1: 5800000000, q7: 4500000000, binhThanh: 3800000000 },
  { month: "T8/25", q1: 5950000000, q7: 4650000000, binhThanh: 3900000000 },
  { month: "T9/25", q1: 6100000000, q7: 4750000000, binhThanh: 3950000000 },
  { month: "T10/25", q1: 6250000000, q7: 4900000000, binhThanh: 4050000000 },
  { month: "T11/25", q1: 6400000000, q7: 5050000000, binhThanh: 4150000000 },
  { month: "T12/25", q1: 6550000000, q7: 5200000000, binhThanh: 4250000000 },
  { month: "T1/26", q1: 6700000000, q7: 5350000000, binhThanh: 4350000000 },
  { month: "T2/26", q1: 6850000000, q7: 5500000000, binhThanh: 4450000000 },
  { month: "T3/26", q1: 7000000000, q7: 5650000000, binhThanh: 4550000000 },
  { month: "T4/26", q1: 7150000000, q7: 5800000000, binhThanh: 4650000000 },
];

const propertyTypeData = [
  { type: "Chung Cư", average: 5200000000, count: 1250 },
  { type: "Nhà Phố", average: 7800000000, count: 680 },
  { type: "Căn Hộ Cao Cấp", average: 6200000000, count: 920 },
  { type: "Nhà Liền Kề", average: 8900000000, count: 340 },
  { type: "Biệt Thự", average: 12500000000, count: 150 },
];

const marketVolumeData = [
  { month: "T7", sales: 320 },
  { month: "T8", sales: 340 },
  { month: "T9", sales: 310 },
  { month: "T10", sales: 380 },
  { month: "T11", sales: 420 },
  { month: "T12", sales: 390 },
  { month: "T1", sales: 360 },
  { month: "T2", sales: 410 },
  { month: "T3", sales: 440 },
  { month: "T4", sales: 460 },
];

export function MarketAnalysisPage() {
  const [selectedCity, setSelectedCity] = useState("hcm");
  const [selectedTimeRange, setSelectedTimeRange] = useState("10m");

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

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dự Đoán AI
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Về Trang Chủ
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Phân Tích & Thông Tin Thị Trường
          </h1>
          <p className="text-foreground/70">
            Dữ liệu thời gian thực và xu hướng thị trường bất động sản
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8 bg-white border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-foreground/70" />
              <span className="font-medium text-foreground">Bộ Lọc:</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/50" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-48">
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

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground/50" />
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Loại BĐS</SelectItem>
                  <SelectItem value="apartment">Căn Hộ Chung Cư</SelectItem>
                  <SelectItem value="house">Nhà Phố</SelectItem>
                  <SelectItem value="villa">Biệt Thự</SelectItem>
                  <SelectItem value="townhouse">Nhà Liền Kề</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground/50" />
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Tháng Qua</SelectItem>
                  <SelectItem value="3m">3 Tháng Qua</SelectItem>
                  <SelectItem value="6m">6 Tháng Qua</SelectItem>
                  <SelectItem value="10m">10 Tháng Qua</SelectItem>
                  <SelectItem value="1y">1 Năm Qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm Mới
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Xuất File
              </Button>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Giá Trung Bình",
              value: "7.15 tỷ",
              change: "+12.3%",
              trend: "up",
              icon: TrendingUp,
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              label: "Giá Trung Vị",
              value: "5.65 tỷ",
              change: "+8.7%",
              trend: "up",
              icon: Building2,
              gradient: "from-purple-500 to-pink-500"
            },
            {
              label: "BĐS Đã Bán",
              value: "460",
              change: "+15.2%",
              trend: "up",
              icon: TrendingUp,
              gradient: "from-green-500 to-emerald-500"
            },
            {
              label: "Thời Gian Bán TB",
              value: "28 ngày",
              change: "-5.4%",
              trend: "down",
              icon: TrendingDown,
              gradient: "from-orange-500 to-red-500"
            }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white border-border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-foreground/70">
                  {metric.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Price Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6 bg-white border-border">
              <h3 className="text-xl font-bold text-foreground mb-6">
                Xu Hướng Giá Theo Khu Vực
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}tỷ`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${(value / 1000000000).toFixed(2)} tỷ VND`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="q1"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 3 }}
                    name="Quận 1"
                  />
                  <Line
                    type="monotone"
                    dataKey="q7"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 3 }}
                    name="Quận 7"
                  />
                  <Line
                    type="monotone"
                    dataKey="binhThanh"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={{ fill: '#06B6D4', r: 3 }}
                    name="Bình Thạnh"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Market Volume */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6 bg-white border-border">
              <h3 className="text-xl font-bold text-foreground mb-6">
                Khối Lượng Giao Dịch Hàng Tháng
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={marketVolumeData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
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
                    formatter={(value: number) => [`${value} giao dịch`, 'Số lượng']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                    name="Giao Dịch"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Property Type Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-6 bg-white border-border mb-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Giá Trung Bình Theo Loại Bất Động Sản
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypeData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="type" stroke="#64748B" fontSize={12} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}tỷ`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${(value / 1000000000).toFixed(2)} tỷ VND`, 'Giá TB']}
                />
                <Bar dataKey="average" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Thông Tin Thị Trường Từ AI
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Thị Trường Người Mua Đang Nổi Lên</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        Nguồn cung tăng 18% trong khi cầu ổn định. Cơ hội tốt để người mua
                        thương lượng giá tại Quận 1 và Quận 7.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Căn Hộ Tăng Giá Mạnh</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        Căn hộ chung cư tăng trưởng mạnh nhất +14.2% so với cùng kỳ, vượt các loại BĐS khác.
                        Được thúc đẩy bởi các dự án mới ven sông.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Khu Vực Nóng</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        Thủ Thiêm, Phú Mỹ Hưng và Nhà Bè đang có mức tăng giá cao nhất.
                        Thời gian bán trung bình giảm xuống còn 21 ngày tại các khu vực này.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Cảnh Báo Xu Hướng Mùa Vụ</h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        Mùa mua sắm xuân có hoạt động cao hơn 23% so với năm ngoái.
                        Dự kiến xu hướng tiếp tục đến tháng 6 và có thể chậm lại vào tháng 7.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-foreground/70 text-center">
                <strong className="text-foreground">Cập nhật lần cuối:</strong> 17 tháng 4, 2026 lúc 10:24 SA
                • Dữ liệu làm mới mỗi 24 giờ
              </p>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
