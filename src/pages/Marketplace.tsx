import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ExternalLink, Star, ShoppingCart, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AddToListDropdown } from '@/components/AddToListDropdown';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  affiliate_link: string;
  rating: number;
  reviews_count: number;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [productListMap, setProductListMap] = useState<Map<string, string>>(new Map());
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'electronics', label: 'Electrónica' },
    { value: 'fashion', label: 'Moda' },
    { value: 'home', label: 'Hogar' },
    { value: 'books', label: 'Libros' },
    { value: 'sports', label: 'Deportes' },
  ];

  useEffect(() => {
    loadProducts();
    loadAddedProducts();
  }, [selectedCategory]);

  const loadAddedProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lists } = await supabase
        .from('gift_lists')
        .select('id')
        .eq('user_id', user.id);

      if (!lists || lists.length === 0) return;

      const { data: items } = await supabase
        .from('gift_items')
        .select('id, reference_link, list_id')
        .in('list_id', lists.map(l => l.id));

      if (!items) return;

      // Create map of product ID to list ID and set of added product IDs
      const productIds = new Set<string>();
      const listMap = new Map<string, string>();
      
      items.forEach(item => {
        if (item.reference_link) {
          const match = products.find(p => p.affiliate_link === item.reference_link);
          if (match?.id) {
            productIds.add(match.id);
            listMap.set(match.id, item.list_id);
          }
        }
      });

      setAddedProductIds(productIds);
      setProductListMap(listMap);
    } catch (error) {
      console.error('Error loading added products:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_products_by_category', {
        _category: selectedCategory === 'all' ? null : selectedCategory,
        _limit: 50,
        _offset: 0
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_affiliate_products', {
        _query: searchQuery,
        _limit: 50
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistSuccess = () => {
    loadAddedProducts(); // Reload to ensure sync
  };

  const handleProductClick = async (product: Product) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-affiliate-link', {
        body: { product_id: product.id }
      });

      if (error) throw error;

      // Abrir link de afiliado
      window.open(data.affiliate_url, '_blank', 'noopener,noreferrer');
      
      toast.success('¡Enlace generado!', {
        description: `Gracias por usar Givlyn. Ganamos ${(product.price * 0.04).toFixed(2)} USD si compras.`
      });
    } catch (error) {
      console.error('Error generating link:', error);
      // Fallback: abrir link directo
      window.open(product.affiliate_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Marketplace
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Encuentra el regalo perfecto</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Miles de productos recomendados para cada ocasión
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground">
              Intenta con otra búsqueda o categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isAdded = addedProductIds.has(product.id);
              
              return (
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
                      {isAdded && (
                        <Badge className="absolute top-2 left-2 bg-primary/90 gap-1">
                          <Heart className="w-3 h-3 fill-current" />
                          En tu lista
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-base mb-2 line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mb-3">
                      {product.description}
                    </CardDescription>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviews_count.toLocaleString()} reseñas)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <AddToListDropdown 
                        product={product}
                        isAdded={isAdded}
                        currentListId={productListMap.get(product.id)}
                        onSuccess={handleWishlistSuccess}
                      />
                      <Button 
                        className="w-full gap-2" 
                        onClick={() => handleProductClick(product)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver Producto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Apoya a Givlyn</h3>
              <p className="text-sm text-muted-foreground">
                Cuando compras a través de nuestros enlaces, ganamos una pequeña comisión sin costo adicional para ti. 
                ¡Gracias por apoyar el desarrollo de Givlyn!
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
