import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import { toast } from "sonner";

export interface ProductCardData {
  name: string;
  price: string;
  store: string;
  link: string;
  reason?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
}


export const ProductCard = ({ product }: ProductCardProps) => {
  const handleAddToList = () => {
    toast.success(`"${product.name}" guardado`, {
      description: 'Añadido a tus ideas de regalo',
      duration: 2000,
    });
  };

  // Store color mapping
  const storeColors: Record<string, string> = {
    amazon: "bg-orange-500",
    walmart: "bg-blue-500",
    target: "bg-red-500",
    etsy: "bg-orange-600",
    ebay: "bg-blue-600",
  };

  const storeColor = storeColors[product.store.toLowerCase()] || "bg-primary";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 space-y-2">
        {/* Header: Name + Price */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight flex-1 line-clamp-2">
            {product.name}
          </h4>
          <span className="text-primary font-bold text-lg whitespace-nowrap">
            ${product.price}
          </span>
        </div>

        {/* Store Badge */}
        <Badge className={`${storeColor} text-white text-xs`}>
          {product.store}
        </Badge>

        {/* Reason */}
        {product.reason && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            ✨ {product.reason}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => window.open(product.link, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver en {product.store}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleAddToList}
          >
            <Heart className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
