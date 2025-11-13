import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { AddToListDropdown } from "./AddToListDropdown";
import { useState } from "react";
import { ProductPreviewModal } from "./ProductPreviewModal";

export interface RecommendedProduct {
  name: string;
  price: string;
  store: string;
  link: string;
  reason: string;
}

interface ProductRecommendationProps {
  product: RecommendedProduct;
}

export const ProductRecommendation = ({ product }: ProductRecommendationProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Convert to format compatible with AddToListDropdown
  const productForList = {
    id: `rec-${Date.now()}-${Math.random()}`,
    name: product.name,
    description: product.reason,
    category: "gift",
    price: parseFloat(product.price.split("-")[0]) || 0,
    image_url: "",
    affiliate_link: product.link,
  };

  const handleAddSuccess = () => {
    setIsAdded(true);
  };

  const handleViewDetails = () => {
    setShowPreview(true);
  };

  const storeColors: Record<string, string> = {
    Amazon: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Walmart: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Target: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Etsy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    eBay: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <Card className="p-4 space-y-3 border-2 hover:border-primary/50 transition-colors bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base leading-tight cursor-pointer hover:text-primary transition-colors" onClick={handleViewDetails}>
              {product.name}
            </h4>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${storeColors[product.store] || "bg-gray-100 text-gray-800"}`}>
              {product.store}
            </span>
            <span className="text-sm font-bold text-primary">
              ${product.price} USD
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-snug">
            {product.reason}
          </p>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
        <span className="font-medium">💡 Tip:</span>
        <span>Guárdalo primero y luego ve a la tienda</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Botón principal: Agregar a lista */}
        <div className="col-span-2">
          <AddToListDropdown
            product={productForList}
            isAdded={isAdded}
            onSuccess={handleAddSuccess}
          />
        </div>
        
        {/* Botón secundario: Ver más info y comprar */}
        <Button
          variant="outline"
          size="default"
          onClick={handleViewDetails}
          className="gap-2 col-span-2 border-2 hover:border-primary/50"
        >
          <ExternalLink className="w-4 h-4" />
          Ver detalles y comprar
        </Button>
      </div>

      <ProductPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        product={product}
      />
    </Card>
  );
};
