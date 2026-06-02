import { MapPin } from "lucide-react";
import { Card } from "./ui/card";

interface PropertyMapProps {
  address: string;
  district: string;
  city?: string;
}

export function PropertyMap({ address, district, city = "TP.HCM" }: PropertyMapProps) {
  const fullAddress = `${address}, ${district}, ${city}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // Google Maps embed URL
  const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4!2d${encodedAddress}!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDAnMTQuOCJOIDHCsDAwJzA0LjkiRQ!5e0!3m2!1sen!2s!4v1234567890&q=${encodedAddress}`;

  // Use search iframe instead (more reliable)
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <Card className="p-6 bg-white border-border">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Vị Trí BĐS
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-2 text-foreground/70">
          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
          <span>{fullAddress}</span>
        </div>

        <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-border">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Vị trí bất động sản"
            className="absolute inset-0"
          />
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline text-sm"
        >
          <MapPin className="w-4 h-4" />
          Mở trên Google Maps
        </a>
      </div>
    </Card>
  );
}
