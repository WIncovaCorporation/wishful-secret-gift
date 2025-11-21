import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink, Star, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  affiliate_link: string;
  rating: number;
  reviews_count: number;
}

interface ProductSuggestionsProps {
  category?: string;
  searchQuery?: string;
  limit?: number;
}

export function ProductSuggestions({ 
  category, 
  searchQuery, 
  limit = 4 
}: ProductSuggestionsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);

  useEffect(() => {
    loadSuggestions();
    loadAIUsage();
  }, [category, searchQuery]);

  const loadAIUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usage } = await supabase
        .from('ai_usage_tracking')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('feature_type', 'gift_suggestion')
        .maybeSingle();

      const usageCount = usage?.usage_count || 0;
      setAiRemaining(Math.max(0, 10 - usageCount));
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      let data = null;

      if (searchQuery) {
        // Buscar por query
        const { data: searchResults, error } = await supabase.rpc('search_affiliate_products', {
          _query: searchQuery,
          _limit: limit
        });
        if (error) throw error;
        data = searchResults;
      } else {
        // Obtener por categoría
        const { data: categoryResults, error } = await supabase.rpc('get_products_by_category', {
          _category: category || null,
          _limit: limit,
          _offset: 0
        });
        if (error) throw error;
        data = categoryResults;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading product suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: Product) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-affiliate-link', {
        body: { product_id: product.id }
      });

      if (error) throw error;

      window.open(data.affiliate_url, '_blank', 'noopener,noreferrer');
      
      toast.success('¡Enlace generado!', {
        description: 'Gracias por usar nuestras recomendaciones'
      });
    } catch (error) {
      console.error('Error generating link:', error);
      window.open(product.affiliate_link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Sugerencias de Productos</h3>
        </div>
        
        {aiRemaining !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            <span>Sugerencias IA: <span className={`font-semibold ${aiRemaining === 0 ? 'text-destructive' : 'text-primary'}`}>{aiRemaining}/10</span></span>
          </div>
        )}
      </div>

      {aiRemaining === 0 && (
        <Alert variant="destructive">
          <AlertTitle>Límite de IA alcanzado</AlertTitle>
          <AlertDescription>
            Has usado tus 10 sugerencias de IA hoy. Se restablecerá mañana.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <Badge className="absolute top-2 right-2 bg-background/90">
                  ${product.price}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <CardTitle className="text-sm mb-1 line-clamp-1">
                {product.name}
              </CardTitle>
              
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{product.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({product.reviews_count})
                </span>
              </div>

              <Button 
                size="sm"
                className="w-full gap-1" 
                onClick={() => handleProductClick(product)}
              >
                <ExternalLink className="w-3 h-3" />
                Ver
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
