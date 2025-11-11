import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
  features: string[];
  category: string;
}

export default function AmazonProductSearch({ onProductAdded }: { onProductAdded?: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }

    setLoading(true);
    setSearchPerformed(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-amazon-products", {
        body: { query },
      });

      if (error) throw error;

      if (data.requiresUpgrade) {
        toast.error(data.error, {
          action: {
            label: "Ver Planes",
            onClick: () => window.location.href = "/pricing",
          },
        });
        return;
      }

      if (data.needsSetup) {
        toast.error(data.error);
        return;
      }

      setProducts(data.products || []);
      
      if (data.products.length === 0) {
        toast.info("No se encontraron productos para esta búsqueda");
      } else {
        toast.success(`Se encontraron ${data.products.length} productos`);
      }
    } catch (error: any) {
      console.error("Error searching products:", error);
      toast.error(error.message || "Error al buscar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: AmazonProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const productData = {
        owner_id: user.id,
        name: product.title.substring(0, 200),
        description: product.features.join("\n").substring(0, 500),
        category: product.category,
        price: product.price,
        currency: product.currency,
        image_url: product.image_url,
        affiliate_link: product.product_url,
        product_url: product.product_url,
        affiliate_network: "amazon",
        is_active: true,
      };

      const { error } = await supabase.from("affiliate_products").insert(productData);

      if (error) throw error;

      toast.success("Producto agregado a tu inventario");
      onProductAdded?.();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Error al agregar producto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar productos en Amazon..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!loading && searchPerformed && products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron productos
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.asin}>
            <CardHeader>
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-48 object-contain rounded-md mb-4"
              />
              <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="font-bold">
                  {product.currency} {product.price}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddProduct(product)}
                  className="flex-1"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(product.product_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
