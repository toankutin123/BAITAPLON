import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, ArrowLeft, Filter, TrendingDown, Building2,
  MapPin, Calendar, Download, RefreshCw, Activity, DollarSign
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { marketService, AveragePriceRecord } from "../services/market.service";
import { aiApi } from "../services/aiApi";

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

const cityNames: Record<string, string> = {
  hcm: "TP. Hồ Chí Minh",
  hanoi: "Hà Nội",
  danang: "Đà Nẵng",
  haiphong: "Hải Phòng",
  cantho: "Cần Thơ",
};

const formatMarketPrice = (value: number) =>
  value ? `${value.toFixed(2)} triệu/m²` : "-";

export function MarketAnalysisPage() {
  const [selectedCity, setSelectedCity] = useState("hanoi");
  const [selectedTimeRange, setSelectedTimeRange] = useState("10m");
  const [selectedPropertyType, setSelectedPropertyType] = useState("");
  const [averageData, setAverageData] = useState<AveragePriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAIInsights] = useState<string>("");
  const [aiLoading, setAILoading] = useState(true);
  const [aiError, setAIError] = useState<string | null>(null);

  // AI Dashboard data
  const [aiDashboard, setAIDashboard] = useState<any>(null);
  const [aiDashboardLoading, setAIDashboardLoading] = useState(false);

  // Reload data when filters change
  useEffect(() => {
    loadData();
    loadAIInsights();
  }, [selectedCity, selectedPropertyType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketService.getAveragePrices(selectedCity || undefined);
      setAverageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu thị trường");
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    setAILoading(true);
    setAIError(null);
    try {
      const insights = await marketService.getAIInsights(selectedCity);
      setAIInsights(insights);
    } catch (err) {
      setAIError(err instanceof Error ? err.message : "Lỗi tải thông tin AI");
    } finally {
      setAILoading(false);
    }
  };

  // Load AI Dashboard data
  useEffect(() => {
    const loadAIDashboard = async () => {
      setAIDashboardLoading(true);
      try {
        const cityMap: Record<string, string> = {
          hanoi: 'Hà Nội',
          hcm: 'Hồ Chí Minh',
          danang: 'Đà Nẵng',
          haiphong: 'Hải Phòng',
          cantho: 'Cần Thơ',
        };
        const cityName = cityMap[selectedCity] || 'Hà Nội';
        const data = await aiApi.getDashboard(cityName);
        setAIDashboard(data);
      } catch (err) {
        console.error('Error loading AI dashboard:', err);
      } finally {
        setAIDashboardLoading(false);
      }
    };

    loadAIDashboard();
  }, [selectedCity]);

  const filteredData = useMemo(
    () => averageData.filter((item) => item.province.toLowerCase() === selectedCity.toLowerCase()),
    [averageData, selectedCity]
  );

  const provinceAverageData = useMemo(() => {
    const provinceMap: Record<string, { province: string; average_price_per_m2: number; count: number }> = {};
    averageData.forEach((item) => {
      const key = item.province;
      if (!provinceMap[key]) {
        provinceMap[key] = {
          province: cityNames[key] || item.province,
          average_price_per_m2: 0,
          count: 0,
        };
      }
      provinceMap[key].average_price_per_m2 += item.avg_price_per_m2;
      provinceMap[key].count += 1;
    });
    return Object.values(provinceMap).map((item) => ({
      province: item.province,
      average_price_per_m2: item.count ? item.average_price_per_m2 / item.count : 0,
    }));
  }, [averageData]);

  const cityAverage = useMemo(() => {
    if (!filteredData.length) return 0;
    return filteredData.reduce((sum, item) => sum + item.avg_price_per_m2, 0) / filteredData.length;
  }, [filteredData]);

  const maxZoneRecord = useMemo(
    () => filteredData.reduce((prev, item) => (item.avg_price_per_m2 > prev.avg_price_per_m2 ? item : prev), filteredData[0] || { province: "", zone: "", avg_price_per_m2: 0 }),
    [filteredData]
  );

  const minZoneRecord = useMemo(
    () => filteredData.reduce((prev, item) => (item.avg_price_per_m2 < prev.avg_price_per_m2 ? item : prev), filteredData[0] || { province: "", zone: "", avg_price_per_m2: 0 }),
    [filteredData]
  );

  const metrics = [
    {
      label: "Giá Trung Bình",
      value: formatMarketPrice(cityAverage),
      change: filteredData.length ? "+0.0%" : "-",
      trend: filteredData.length ? "up" : "up",
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Khu Vực Cao Nhất",
      value: filteredData.length ? `${maxZoneRecord.zone} (${formatMarketPrice(maxZoneRecord.avg_price_per_m2)})` : "Không có dữ liệu",
      change: "+",
      trend: "up",
      icon: Building2,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Khu Vực Thấp Nhất",
      value: filteredData.length ? `${minZoneRecord.zone} (${formatMarketPrice(minZoneRecord.avg_price_per_m2)})` : "Không có dữ liệu",
      change: "-",
      trend: "down",
      icon: TrendingDown,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      label: "Số Khu Vực",
      value: filteredData.length.toString(),
      change: "",
      trend: "up",
      icon: MapPin,
      gradient: "from-orange-500 to-red-500",
    },
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

        {loading && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Đang tải dữ liệu thị trường...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Loại BĐS" />
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
              <Button variant="outline" size="sm" onClick={() => { loadData(); loadAIInsights(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm Mới
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                // Export data to CSV
                const csv = averageData.map(d => `${d.province},${d.zone},${d.avg_price_per_m2}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `market-analysis-${selectedCity}.csv`;
                a.click();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Xuất File
              </Button>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
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
                Giá Trung Bình Theo Khu Vực
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="zone" stroke="#64748B" fontSize={12} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(value) => `${value.toFixed(0)} triệu`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} triệu/m²`, 'Giá TB/m²']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_price_per_m2"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 3 }}
                    name="Giá trung bình"
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
              Giá Trung Bình Theo Tỉnh
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceAverageData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="province" stroke="#64748B" fontSize={12} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(0)} triệu`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} triệu/m²`, 'Giá TB/m²']}
                />
                <Bar dataKey="average_price_per_m2" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

// AI Dashboard Section
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  AI Analytics Dashboard
                </h3>
              </div>
              {aiDashboardLoading && (
                <span className="text-sm text-green-600">Đang tải...</span>
              )}
            </div>

            {aiDashboard && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Giá TB</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatMarketPrice(aiDashboard.avg_price)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">Tổng tin đăng</span>
                    </div>
                    <p className="text-xl font-bold">
                      {aiDashboard.total_listings?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">Sức khỏe thị trường</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {aiDashboard.market_health_score?.toFixed(0) || 0}/100
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Tin mới hôm nay</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">
                      {aiDashboard.new_listings_today || 0}
                    </p>
                  </div>
                </div>

                {/* District Rankings */}
                {aiDashboard.top_districts?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Top quận huyện theo giá
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aiDashboard.top_districts.slice(0, 6).map((district: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{district.district}</p>
                            <p className="text-xs text-gray-500">{district.listing_count} tin</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{formatMarketPrice(district.avg_price)}</p>
                            <p className={`text-xs ${district.price_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {district.price_change_pct >= 0 ? '+' : ''}{district.price_change_pct?.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rising/Declining Areas */}
                <div className="grid md:grid-cols-2 gap-4">
                  {aiDashboard.rising_areas?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        Khu vực tăng giá
                      </h4>
                      <div className="space-y-2">
                        {aiDashboard.rising_areas.slice(0, 5).map((area: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm">{area.area}</span>
                            <span className="text-sm font-medium text-green-600">
                              +{area.price_change_pct?.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiDashboard.declining_areas?.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        Khu vực giảm giá
                      </h4>
                      <div className="space-y-2">
                        {aiDashboard.declining_areas.slice(0, 5).map((area: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm">{area.area}</span>
                            <span className="text-sm font-medium text-red-600">
                              {area.price_change_pct?.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!aiDashboard && !aiDashboardLoading && (
              <p className="text-center text-gray-500 py-4">
                Kết nối API để xem dữ liệu AI Dashboard
              </p>
            )}
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

            <div className="space-y-4">
              {aiLoading && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-700">
                  Đang lấy thông tin AI...
                </div>
              )}

              {aiError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              {!aiLoading && !aiError && (
                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  {aiInsights.split("\n").filter((line) => line.trim()).map((line, index) => (
                    <p key={index} className="text-sm text-foreground/70 leading-relaxed mb-3">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-foreground/70 text-center">
                <strong className="text-foreground">Cập nhật lần cuối:</strong> {new Date().toLocaleString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                • Dữ liệu được cập nhật theo yêu cầu
              </p>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
