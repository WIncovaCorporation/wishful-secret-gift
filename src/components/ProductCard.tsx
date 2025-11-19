import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink } from "lucide-react";
import { AddToListDropdown } from "./AddToListDropdown";
import { useState } from "react";

export type ProductCardData = {
  name: string;
  price: string;
  store: string;
  link: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  reason?: string;
};

type ProductCardProps = {
  product: ProductCardData;
};

const storeColors: Record<string, string> = {
  Amazon: "bg-[#FF9900] text-white",
  Walmart: "bg-[#0071CE] text-white",
  Target: "bg-[#CC0000] text-white",
  "Best Buy": "bg-[#0046BE] text-white",
  eBay: "bg-[#E53238] text-white",
  Etsy: "bg-[#F1641E] text-white",
  default: "bg-primary text-primary-foreground",
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const storeColor = storeColors[product.store] || storeColors.default;

  // Format price to ensure it has $ sign
  const formatPrice = (price: string) => {
    const cleanPrice = price.replace(/[^0-9.]/g, "");
    return `$${cleanPrice}`;
  };

  // Generate placeholder image if no image provided
  const productImage = product.image || `https://placehold.co/150x150/e5e7eb/6b7280?text=${encodeURIComponent(product.name.slice(0, 20))}`;

  const handleAddSuccess = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Product Image - Centrada en móvil */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <img
            src={productImage}
            alt={product.name}
            className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 object-cover rounded-lg border border-border"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/150x150/e5e7eb/6b7280?text=${encodeURIComponent(product.name.slice(0, 20))}`;
            }}
          />
        </div>

        {/* Product Info - Apilada en móvil */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Product Name */}
          <h4 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
            {product.name}
          </h4>

          {/* Price */}
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {formatPrice(product.price)}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 text-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating!)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              {product.reviewCount && (
                <span className="text-muted-foreground">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Store Badge */}
          <div>
            <Badge className={`${storeColor} rounded-full text-xs`}>
              {product.store}
            </Badge>
          </div>

          {/* Reason */}
          {product.reason && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {product.reason}
            </p>
          )}

          {/* Action Buttons - Stack en móvil */}
          <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2">
            <Button
              variant="outline"
              size="touch"
              className="sm:size-sm flex-1"
              onClick={() => window.open(product.link, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en {product.store}
            </Button>
            
            <div className="flex-1">
              <AddToListDropdown
                product={{
                  id: "",
                  name: product.name,
                  description: product.reason || "",
                  category: "general",
                  price: parseFloat(product.price.replace(/[^0-9.]/g, "")),
                  image_url: productImage,
                  affiliate_link: product.link,
                }}
                isAdded={isAdded}
                onSuccess={handleAddSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
