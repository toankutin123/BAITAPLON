import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";

import {
  TrendingUp, Search, Filter, Grid3x3, List, MapPin, Bed, Bath,
  Ruler, Heart, Phone, Eye, ArrowUpDown, ChevronDown, Building2,
  DollarSign, Home, Star, Plus
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { propertyService, Property } from "../services/property.service";

export function PropertiesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Sort
  const [sortBy, setSortBy] = useState("newest");

  // Filters
  const [filters, setFilters] = useState({
    district: "",
    property_type: "",
    min_price: "",
    max_price: "",
    min_area: "",
    max_area: "",
    bedrooms: "",
  });
  
  const { user } = useAuth();

  useEffect(() => {
    loadApprovedProperties();
  }, [currentPage, filters, sortBy]);

  useEffect(() => {
    loadSavedPropertyIds();
  }, []);

  const loadApprovedProperties = async () => {
    try {
      setLoading(true);
      const result = await propertyService.searchProperties({
        search: searchQuery || undefined,
        district: filters.district || undefined,
        property_type: filters.property_type || undefined,
        min_price: filters.min_price ? parseInt(filters.min_price) : undefined,
        max_price: filters.max_price ? parseInt(filters.max_price) : undefined,
        min_area: filters.min_area ? parseFloat(filters.min_area) : undefined,
        max_area: filters.max_area ? parseFloat(filters.max_area) : undefined,
        bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
        page: currentPage,
        limit: 12,
        sort_by: sortBy,
      });
      setProperties(result.properties || []);
      setTotalItems(result.total || 0);
      setTotalPages(Math.ceil((result.total || 0) / 12));
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadApprovedProperties();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      district: "",
      property_type: "",
      min_price: "",
      max_price: "",
      min_area: "",
      max_area: "",
      bedrooms: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const loadSavedPropertyIds = async () => {
    if (!user) return;
    try {
      const saved = await propertyService.getSavedProperties();
      if (Array.isArray(saved)) {
        setSavedPropertyIds(new Set(saved.map((p: Property) => p.id)));
      }
    } catch (error) {
      // Silent fail for saved properties - user may not be logged in
    }
  };

  const handleToggleSave = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu BĐS");
      return;
    }

    try {
      if (savedPropertyIds.has(propertyId)) {
        await propertyService.removeSavedProperty(propertyId);
        setSavedPropertyIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        toast.success("Đã xóa khỏi danh sách đã lưu");
      } else {
        await propertyService.saveProperty(propertyId);
        setSavedPropertyIds(prev => new Set(prev).add(propertyId));
        toast.success("Đã lưu BĐS");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu BĐS");
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const getPropertyTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      apartment: "Căn Hộ",
      house: "Nhà Phố",
      villa: "Biệt Thự",
      townhouse: "Nhà Liền Kề",
      land: "Đất Nền",
    };
    return typeMap[type] || type;
  };

  const getLocation = (p: Property) => {
    const parts = [p.district, p.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Không có địa chỉ";
  };

  const getImages = (p: Property): string[] => {
    if (Array.isArray(p.images)) return p.images;
    if (typeof p.images === "string") {
      try { return JSON.parse(p.images); } catch { return []; }
    }
    return [];
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

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dự Đoán AI
              </Button>
            </Link>
            <Link to="/market-analysis">
              <Button variant="outline" size="sm">
                Phân Tích Thị Trường
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-[#0F2557] to-[#1e3a8a] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">
            Tìm Bất Động Sản Mơ Ước
          </h1>
          <p className="text-white/80 mb-6">
            Hơn {properties.length} bất động sản đang chờ bạn khám phá
          </p>

          {/* Search Bar */}
          <Card className="p-4 bg-white">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                  <Input
                    placeholder="Tìm theo khu vực, dự án, tên đường..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              <Select value={filters.property_type} onValueChange={(value) => handleFilterChange("property_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại BĐS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Loại</SelectItem>
                  <SelectItem value="apartment">Căn Hộ</SelectItem>
                  <SelectItem value="house">Nhà Phố</SelectItem>
                  <SelectItem value="villa">Biệt Thự</SelectItem>
                  <SelectItem value="land">Đất Nền</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Tìm Kiếm
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters & Sort Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Bộ Lọc
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quận/Huyện</label>
                    <Select value={filters.district} onValueChange={(value) => handleFilterChange("district", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quận" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="Quận 1">Quận 1</SelectItem>
                        <SelectItem value="Quận 3">Quận 3</SelectItem>
                        <SelectItem value="Quận 7">Quận 7</SelectItem>
                        <SelectItem value="Quận Bình Thạnh">Quận Bình Thạnh</SelectItem>
                        <SelectItem value="Quận Tân Bình">Quận Tân Bình</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Khoảng Giá (VND)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Từ" 
                        type="number" 
                        value={filters.min_price}
                        onChange={(e) => setFilters(prev => ({ ...prev, min_price: e.target.value }))}
                      />
                      <Input 
                        placeholder="Đến" 
                        type="number" 
                        value={filters.max_price}
                        onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Diện Tích (m²)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Từ" 
                        type="number" 
                        value={filters.min_area}
                        onChange={(e) => setFilters(prev => ({ ...prev, min_area: e.target.value }))}
                      />
                      <Input 
                        placeholder="Đến" 
                        type="number" 
                        value={filters.max_area}
                        onChange={(e) => setFilters(prev => ({ ...prev, max_area: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Số Phòng Ngủ</label>
                    <Select value={filters.bedrooms} onValueChange={(value) => handleFilterChange("bedrooms", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>Xóa Lọc</Button>
                    <Button className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" onClick={handleSearch}>Áp Dụng</Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sắp Xếp
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setSortBy("newest"); setCurrentPage(1); }}>Mới Nhất</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("price_asc"); setCurrentPage(1); }}>Giá Thấp - Cao</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("price_desc"); setCurrentPage(1); }}>Giá Cao - Thấp</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("area_desc"); setCurrentPage(1); }}>Diện Tích Lớn Nhất</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("views"); setCurrentPage(1); }}>Xem Nhiều Nhất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="secondary" className="px-4 py-2">
              {totalItems} kết quả
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Properties Grid/List */}
        {loading ? (
          <div className="text-center py-12 text-foreground/70">Đang tải...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-foreground/70">Không có bất động sản nào được duyệt</div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => {
              const images = getImages(property);
              const imageUrl = images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";
              return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/properties/${property.id}`}>
                  <Card className="bg-white border-border overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 bg-white/90 hover:bg-white ${savedPropertyIds.has(property.id) ? "text-red-500" : ""}`}
                        onClick={(e) => handleToggleSave(property.id, e)}
                      >
                        <Heart className={`w-4 h-4 ${savedPropertyIds.has(property.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Badge variant="secondary" className="absolute bottom-3 left-3">
                        {property.status}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {getPropertyTypeName(property.property_type)}
                        </Badge>
                        {property.verified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            ✓ Đã Xác Minh
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-[#3B82F6] transition-colors">
                        {property.title}
                      </h3>

                      <div className="flex items-center gap-1 text-sm text-foreground/70 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{getLocation(property)}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center gap-1 text-sm text-foreground/70">
                            <Bed className="w-4 h-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center gap-1 text-sm text-foreground/70">
                            <Bath className="w-4 h-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-foreground/70">
                          <Ruler className="w-4 h-4" />
                          <span>{property.area}m²</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-foreground">
                            {formatPrice(property.price)}
                          </div>
                          <div className="text-xs text-foreground/60">
                            ≈ {(property.price / property.area / 1000000).toFixed(1)} tr/m²
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property, index) => {
              const images = getImages(property);
              const imageUrl = images.length > 0 ? images[0] : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";
              return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/properties/${property.id}`}>
                  <Card className="bg-white border-border overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="flex gap-6 p-6">
                      {/* Image */}
                      <div className="relative w-80 h-56 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={imageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getPropertyTypeName(property.property_type)}</Badge>
                            {property.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                ✓ Đã Xác Minh
                              </Badge>
                            )}
                            <Badge variant="secondary">{property.status}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={savedPropertyIds.has(property.id) ? "text-red-500" : ""}
                            onClick={(e) => handleToggleSave(property.id, e)}
                          >
                            <Heart className={`w-4 h-4 ${savedPropertyIds.has(property.id) ? "fill-current" : ""}`} />
                          </Button>
                        </div>

                        <h3 className="font-bold text-2xl text-foreground mb-2 group-hover:text-[#3B82F6] transition-colors">
                          {property.title}
                        </h3>

                        <div className="flex items-center gap-2 text-foreground/70 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{property.address}, {property.district}</span>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                          {property.bedrooms > 0 && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <Bed className="w-5 h-5" />
                              <span>{property.bedrooms} phòng ngủ</span>
                            </div>
                          )}
                          {property.bathrooms > 0 && (
                            <div className="flex items-center gap-2 text-foreground/70">
                              <Bath className="w-5 h-5" />
                              <span>{property.bathrooms} phòng tắm</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-foreground/70">
                            <Ruler className="w-5 h-5" />
                            <span>{property.area}m²</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                              {formatPrice(property.price)}
                            </div>
                            <div className="text-sm text-foreground/60">
                              ≈ {(property.price / property.area / 1000000).toFixed(1)} triệu/m²
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                              <Phone className="w-4 h-4 mr-2" />
                              Liên Hệ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Trước
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" : ""}
              >
                {page}
              </Button>
            );
          })}
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Sau
          </Button>
        </div>
        
        <div className="text-center text-sm text-foreground/60 mt-2">
          Hiển thị {(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, totalItems)} trong tổng số {totalItems} tin đăng
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F2557] text-white py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">EstateAI</span>
              </div>
              <p className="text-white/70 text-sm">
                Nền tảng bất động sản thông minh với AI
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Sản Phẩm</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/properties" className="hover:text-white transition-colors">Mua Bán BĐS</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dự Đoán AI</Link></li>
                <li><Link to="/market-analysis" className="hover:text-white transition-colors">Phân Tích Thị Trường</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Hỗ Trợ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Trung Tâm Trợ Giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hướng Dẫn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên Hệ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Liên Hệ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Email: support@estateai.vn</li>
                <li>Hotline: 1900 xxxx</li>
                <li>Địa chỉ: TP. Hồ Chí Minh</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
            © 2026 EstateAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
