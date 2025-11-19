import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink, Plus, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AddToListDropdown } from "./AddToListDropdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export interface ProductPreviewData {
  name: string;
  price: string;
  store: string;
  link: string;
  reason: string;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPreviewData;
}

export const ProductPreviewModal = ({ isOpen, onClose, product }: ProductPreviewModalProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { t } = useLanguage();

  const productForList = {
    id: `rec-${Date.now()}-${Math.random()}`,
    name: product.name,
    description: product.reason,
    category: "gift",
    price: parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0,
    image_url: "",
    affiliate_link: product.link,
  };

  const handleAddSuccess = () => {
    setIsAdded(true);
    toast.success("¡Producto agregado a tu lista!");
  };

  const handleBuyNow = async () => {
    setIsGeneratingLink(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-external-affiliate-link', {
        body: {
          product_url: product.link,
          store: product.store,
          product_name: product.name,
          price: product.price,
        }
      });

      if (error) throw error;

      console.log('Affiliate link generated:', data);

      // Abrir link con código de afiliado de Wincova
      window.open(data.affiliate_url, '_blank');
      
      toast.success("¡Redirigiendo a la tienda con tu enlace de afiliado!");
      onClose();
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      
      // Fallback: abrir link original
      window.open(product.link, '_blank');
      toast.error("Error al generar enlace, abriendo link directo");
      onClose();
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const storeColors: Record<string, string> = {
    Amazon: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Walmart: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Target: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Etsy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    eBay: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold leading-tight pr-8">
            {product.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vista previa del producto recomendado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Store and Price with Urgency Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${storeColors[product.store] || "bg-gray-100 text-gray-800"}`}>
              {product.store}
            </span>
            <span className="text-2xl font-bold text-primary">
              ${product.price} USD
            </span>
            {product.store.toLowerCase().includes('amazon') && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500 text-white font-semibold animate-pulse">
                🔥 Oferta por 24h
              </span>
            )}
            {product.store.toLowerCase().includes('wincova') && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500 text-white font-semibold">
                ✨ Envío Gratis
              </span>
            )}
          </div>

          {/* AI Recommendation Reason */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
              ¿Por qué te lo recomendamos?
            </h3>
            <p className="text-base leading-relaxed">
              {product.reason}
            </p>
          </div>

          {/* Social Proof Placeholder */}
          <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">✨ Producto popular</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Este producto ha sido recomendado por nuestro AI basado en tus preferencias y necesidades.
            </p>
          </div>

          {/* Affiliate Disclosure */}
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground border-l-2 border-primary/20">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <p>
              <strong className="text-foreground">{t("disclosure.smartBuying")}</strong>{" "}
              {t("disclosure.message")}{" "}
              <a 
                href="/how-it-works" 
                className="underline hover:text-foreground font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  window.location.href = '/how-it-works';
                }}
              >
                {t("disclosure.learnMore")}
              </a>
            </p>
          </div>

          {/* Call to Actions */}
          <div className="space-y-3 pt-2">
            {/* Primary CTA: Add to List */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                💡 Guárdalo para decidir después:
              </p>
              <AddToListDropdown
                product={productForList}
                isAdded={isAdded}
                onSuccess={handleAddSuccess}
              />
            </div>

            {/* Secondary CTA: Buy Now */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                🛒 ¿Listo para comprar ahora?
              </p>
              <Button
                onClick={handleBuyNow}
                disabled={isGeneratingLink}
                size="lg"
                className="w-full gap-2"
                variant="outline"
              >
                {isGeneratingLink ? (
                  <>
                    <Skeleton className="w-4 h-4 rounded-full" />
                    Generando enlace...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Comprar en {product.store}
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Se abrirá en una nueva pestaña. Al comprar, apoyas a Wincova 💚
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};