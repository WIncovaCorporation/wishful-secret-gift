import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Gift, Plus, Trash2, ExternalLink, Sparkles, Loader2, Search, X, ShoppingBag, Store, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { GIFT_CATEGORIES, COMMON_COLORS, CLOTHING_SIZES, SHOE_SIZES, POPULAR_BRANDS, getSmartOptions } from "@/lib/giftOptions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Footer from "@/components/Footer";
import { HelpTooltip } from "@/components/HelpTooltip";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import type { User } from "@supabase/supabase-js";

interface GiftList {
  id: string;
  name: string;
  event_id: string | null;
  created_at: string;
  items?: GiftItem[];
}

interface GiftItem {
  id: string;
  name: string;
  category: string;
  color?: string;
  size?: string;
  brand?: string;
  notes?: string;
  reference_link?: string;
  image_url?: string;
  priority: string;
  is_purchased: boolean;
}

const Lists = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isFree } = useUserRole();
  const { features, getLimit } = useSubscription();
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GiftList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [newList, setNewList] = useState({ name: "" });
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    color: "",
    size: "",
    brand: "",
    notes: "",
    reference_link: "",
    priority: "medium",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [smartOptions, setSmartOptions] = useState(getSmartOptions(""));
  const [mainCategory, setMainCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [foundProducts, setFoundProducts] = useState<any[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [urlMetadata, setUrlMetadata] = useState<any>(null);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [inputMode, setInputMode] = useState<'simple' | 'link' | 'search' | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const formScrollRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; type: "list" | "item" }>({ 
    open: false, 
    id: "", 
    type: "list" 
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadLists(session.user.id);
    setLoading(false);
  };

  const loadLists = async (userId: string) => {
    try {
      const { data: listsData, error: listsError } = await supabase
        .from("gift_lists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (listsError) throw listsError;

      if (listsData) {
        const listsWithItems = await Promise.all(
          listsData.map(async (list: any) => {
            const { data: items } = await supabase
              .from("gift_items")
              .select("*")
              .eq("list_id", list.id)
              .order("created_at", { ascending: false });

            return { ...list, items: items || [] };
          })
        );

        setLists(listsWithItems);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check limits for free users
    const listLimit = getLimit('wishlists');
    if (isFree() && lists.length >= listLimit) {
      setShowUpgradePrompt(true);
      setDialogOpen(false);
      toast.error(`Plan Free: máximo ${listLimit} listas. Actualiza para crear más.`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("gift_lists")
        .insert([{ name: newList.name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Lista creada exitosamente!");
      setDialogOpen(false);
      setNewList({ name: "" });
      await loadLists(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteList = async (listId: string) => {
    setDeleteConfirm({ open: true, id: listId, type: "list" });
  };

  const confirmDelete = async () => {
    if (!user) return;

    try {
      if (deleteConfirm.type === "list") {
        const { error } = await supabase
          .from("gift_lists")
          .delete()
          .eq("id", deleteConfirm.id);

        if (error) throw error;
        toast.success("Lista eliminada!");
      } else {
        const { error } = await supabase
          .from("gift_items")
          .delete()
          .eq("id", deleteConfirm.id);

        if (error) throw error;
        toast.success("Regalo eliminado!");
      }

      await loadLists(user.id);
      setDeleteConfirm({ open: false, id: "", type: "list" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;

    try {
      const itemData = {
        ...newItem,
        list_id: selectedList,
        image_url: urlMetadata?.image || null
      };

      const { error } = await supabase
        .from("gift_items")
        .insert([itemData]);

      if (error) throw error;

      toast.success("Regalo agregado!");
      setItemDialogOpen(false);
      setNewItem({
        name: "",
        category: "",
        color: "",
        size: "",
        brand: "",
        notes: "",
        reference_link: "",
        priority: "medium",
      });
      if (user) await loadLists(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeleteConfirm({ open: true, id: itemId, type: "item" });
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("gift_items")
        .update({ is_purchased: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(currentStatus ? "Marcado como pendiente" : "Marcado como comprado");
      await loadLists(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAISuggestions = async () => {
    if (!aiContext.trim()) {
      toast.error("Por favor describe qué tipo de regalo buscas");
      return;
    }

    setAiLoading(true);
    try {
      const currentList = lists.find(l => l.id === selectedList);
      const budgetValue = budget ? parseFloat(budget) : undefined;
      
      const { data, error } = await supabase.functions.invoke('suggest-gift', {
        body: { 
          context: aiContext,
          existingItems: currentList?.items || [],
          budget: budgetValue
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error("Error al conectar con el servicio de IA");
      }

      if (!data) {
        throw new Error("No se recibió respuesta del servicio");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error("No se generaron sugerencias. Intenta con una descripción más detallada.");
      }

      setAiSuggestions(data.suggestions);
      setShowSuggestions(true);
      toast.success("¡Sugerencias generadas!");
    } catch (error: any) {
      toast.error(error.message || "Error al generar sugerencias");
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setNewItem({
      name: suggestion.name,
      category: suggestion.category,
      color: suggestion.color || "",
      size: suggestion.size || "",
      brand: suggestion.brand || "",
      notes: suggestion.notes || "",
      reference_link: "",
      priority: suggestion.priority || "medium",
    });
    setSelectedCategory(suggestion.category);
    setSmartOptions(getSmartOptions(suggestion.category));
    setShowSuggestions(false);
    setAiContext("");
    toast.success("Sugerencia aplicada. Ajusta los detalles si lo deseas.");
  };

  const handleCategoryChange = (category: string) => {
    setNewItem({ ...newItem, category });
    setSelectedCategory(category);
    setSmartOptions(getSmartOptions(category));
    
    // Auto-scroll to show the new fields
    setTimeout(() => {
      categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleMainCategoryChange = (category: string) => {
    setMainCategory(category);
    setSelectedCategory("");
    setSearchQuery("");
    
    // Auto-scroll to show subcategories
    setTimeout(() => {
      formScrollRef.current?.scrollTo({ top: formScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const getFilteredSubcategories = () => {
    if (!mainCategory) return [];
    const subCats = GIFT_CATEGORIES[mainCategory as keyof typeof GIFT_CATEGORIES] || [];
    if (!searchQuery.trim()) return subCats;
    return subCats.filter(sub => 
      sub.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getAllCategories = () => {
    const allCats: { main: string; sub: string }[] = [];
    Object.entries(GIFT_CATEGORIES).forEach(([main, subs]) => {
      subs.forEach(sub => allCats.push({ main, sub }));
      if (subs.length === 0) allCats.push({ main, sub: main });
    });
    return allCats;
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const allCats = getAllCategories();
    return allCats.filter(cat => 
      cat.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.main.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSearchProducts = async () => {
    if (!aiContext.trim()) {
      toast.error("Por favor describe qué producto buscas");
      return;
    }

    setProductSearchLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            query: aiContext,
            store: selectedStore || undefined,
            budget: budget ? parseFloat(budget) : undefined
          })
        }
      );

      if (response.status === 402) {
        toast.error("⚠️ Créditos de IA agotados. Ve a Configuración → Workspace → Usage para recargar créditos.", {
          duration: 6000,
        });
        return;
      }

      if (response.status === 429) {
        toast.error("⏱️ Demasiadas solicitudes. Espera un momento e intenta de nuevo.", {
          duration: 4000,
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al buscar productos");
      }

      const data = await response.json();
      setFoundProducts(data.products || []);
      setShowProducts(true);
      toast.success(`¡Encontré ${data.products.length} productos reales!`);
    } catch (error: any) {
      toast.error(error.message || "Error al buscar productos");
      console.error(error);
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setNewItem({
      ...newItem,
      name: product.name,
      reference_link: product.url,
      notes: `${product.description} - Aprox. $${product.price} en ${product.store}`,
    });
    setShowProducts(false);
    toast.success("Producto seleccionado. Ajusta los detalles si lo deseas.");
  };

  const extractUrlMetadata = async (url: string) => {
    if (!url || url.trim() === '') {
      setUrlMetadata(null);
      return;
    }

    setIsExtractingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-url-metadata', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data?.metadata) {
        setUrlMetadata(data.metadata);
        
        // Auto-fill form fields if they're empty
        if (data.metadata.title && !newItem.name) {
          setNewItem(prev => ({ ...prev, name: data.metadata.title }));
        }
        if (data.metadata.price) {
          // Add price to notes since we don't have a price field
          const priceNote = `Precio: $${data.metadata.price} ${data.metadata.currency}`;
          if (!newItem.notes) {
            setNewItem(prev => ({ ...prev, notes: priceNote }));
          }
        }
        if (data.metadata.description && !newItem.notes) {
          setNewItem(prev => ({ ...prev, notes: data.metadata.description }));
        }
        
        toast.success("Información del producto extraída");
      }
    } catch (error: any) {
      console.error('Error extracting URL metadata:', error);
      toast.error("No se pudo extraer información del enlace");
      setUrlMetadata(null);
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleLinkChange = (value: string) => {
    setNewItem({ ...newItem, reference_link: value });
    
    // Debounce URL extraction
    if (value && value.startsWith('http')) {
      const timeoutId = setTimeout(() => {
        extractUrlMetadata(value);
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setUrlMetadata(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <LoadingSpinner message="Cargando tus listas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Mis Listas de Regalos
              <HelpTooltip content="Tu lista de deseos personal. Añade lo que quieres recibir como regalo y compártela con amigos/familia. Perfecta para grupos de intercambio donde otros puedan ver qué te gustaría recibir." />
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showUpgradePrompt && (
          <div className="mb-6">
            <UpgradePrompt
              title="¡Alcanzaste el límite de listas!"
              description={`Tu plan Free permite hasta ${getLimit('wishlists')} listas. Actualiza a Premium para listas ilimitadas.`}
              feature="unlimited_wishlists"
              onDismiss={() => setShowUpgradePrompt(false)}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-base font-medium">
              💝 Tu Lista de Deseos Personal
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
              Aquí guardas <strong>lo que TÚ quieres recibir</strong> como regalo. Añade productos con todos sus detalles (color, talla, marca). 
              Cuando estés en un grupo, la persona que te toque regalar podrá ver tu lista. 
              Marca como "Comprado" cuando ya tengas el artículo o ya no lo quieras.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Lista</DialogTitle>
                <DialogDescription>Dale un nombre a tu lista de regalos</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <Label htmlFor="list-name">Nombre de la Lista</Label>
                  <Input
                    id="list-name"
                    value={newList.name}
                    onChange={(e) => setNewList({ name: e.target.value })}
                    placeholder="Ej: Navidad 2024, Mi Cumpleaños"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Crear Lista</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <EmptyStateCard
            icon={Gift}
            title="¡Crea tu primera lista de deseos!"
            description="Las listas son tu espacio personal para guardar ideas de regalos que te gustaría recibir. Puedes crear listas para diferentes ocasiones (Navidad, cumpleaños, bodas) y compartirlas con amigos y familia. Cuando estés en un grupo de intercambio, la persona que te toque regalar podrá ver tu lista para saber exactamente qué te gustaría recibir. Añade productos con todos los detalles: color, talla, marca, enlaces, y usa nuestra IA para obtener sugerencias personalizadas."
            actionLabel="Crear Mi Primera Lista"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-6">
            {lists.map((list) => (
              <Card key={list.id} className="shadow-medium">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{list.name}</CardTitle>
                      <CardDescription>
                        {list.items?.length || 0} regalos en esta lista
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedList(list.id);
                          setItemDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Regalo
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {list.items && list.items.length > 0 ? (
                    <div className="space-y-3">
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-300 ${
                            item.is_purchased 
                              ? "bg-success/5 border-success/30" 
                              : "bg-card hover:bg-muted/50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <input
                              type="checkbox"
                              checked={item.is_purchased}
                              onChange={() => handleTogglePurchased(item.id, item.is_purchased)}
                              className="w-5 h-5 rounded border-border cursor-pointer accent-success"
                              title={item.is_purchased ? "Marcar como pendiente" : "Marcar como comprado"}
                            />
                            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                              {item.is_purchased ? "Comprado" : "Pendiente"}
                            </span>
                          </div>
                          
                          {/* Product Image */}
                          {item.image_url && item.reference_link && (
                            <a
                              href={item.reference_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-md border border-border hover:scale-105 transition-transform cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </a>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className={`font-semibold flex-1 ${
                                item.is_purchased ? "text-muted-foreground" : ""
                              }`}>
                                {item.name}
                              </h4>
                              {item.is_purchased && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium whitespace-nowrap">
                                  ✓ Comprado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            {item.color && <p className="text-sm">Color: {item.color}</p>}
                            {item.size && <p className="text-sm">Talla: {item.size}</p>}
                            {item.brand && <p className="text-sm">Marca: {item.brand}</p>}
                            {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                            {item.reference_link && (
                              <a
                                href={item.reference_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 mt-2 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-colors"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Ver en tienda
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 rounded text-xs text-center ${
                              item.priority === "high" ? "bg-destructive/20 text-destructive" :
                              item.priority === "medium" ? "bg-accent/20 text-accent-foreground" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {item.priority === "high" ? "Alta" : item.priority === "medium" ? "Media" : "Baja"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No hay regalos en esta lista. ¡Agrega el primero!
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={(open) => {
          setItemDialogOpen(open);
        if (!open) {
          setShowSuggestions(false);
          setAiContext("");
          setBudget("");
          setAiSuggestions([]);
          setMainCategory("");
          setSearchQuery("");
          setFoundProducts([]);
          setShowProducts(false);
          setUrlMetadata(null);
          setIsExtractingUrl(false);
          setSelectedCategory("");
          setInputMode(null);
          setSelectedStore("");
          setNewItem({
            name: "",
            category: "",
            color: "",
            size: "",
            brand: "",
            notes: "",
            reference_link: "",
            priority: "medium",
          });
        }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Agregar Regalo a Mi Lista</DialogTitle>
              <DialogDescription>Elige cómo quieres agregar tu regalo</DialogDescription>
            </DialogHeader>

            <div ref={formScrollRef} className="space-y-6 py-4 overflow-y-auto flex-1">
              
              {/* Step 1: Choose Input Mode - Always visible */}
              {!inputMode && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                    ¿Cómo quieres agregar tu regalo?
                  </Label>
                  
                  <div className="grid gap-3">
                    {/* Option 1: Simple Manual Entry */}
                    <button
                      type="button"
                      onClick={() => setInputMode('simple')}
                      className="group p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">✍️ Entrada Manual Simple</h3>
                          <p className="text-sm text-muted-foreground mt-1">Escribe rápido: "Camisa azul Nike" y listo. Agrega detalles opcionales después si quieres.</p>
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Link from Store */}
                    <button
                      type="button"
                      onClick={() => setInputMode('link')}
                      className="group p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">🔗 Pegar Link de Tienda</h3>
                          <p className="text-sm text-muted-foreground mt-1">Copia el enlace de Amazon, Target, o cualquier tienda. Extraemos precio, foto e info automáticamente.</p>
                        </div>
                      </div>
                    </button>

                    {/* Option 3: Search in Stores */}
                    <button
                      type="button"
                      onClick={() => setInputMode('search')}
                      className="group p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">🛍️ Buscar en Tiendas con IA</h3>
                          <p className="text-sm text-muted-foreground mt-1">Busca productos reales con enlaces directos. Elige tienda específica o busca en todas (Amazon, Target, Walmart, etc.).</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* SIMPLE MODE: Quick manual entry */}
              {inputMode === 'simple' && (
                <form onSubmit={handleAddItem} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setInputMode(null)}
                      className="gap-2"
                    >
                      ← Cambiar método
                    </Button>
                  </div>

                  <div className="space-y-4 p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border-2 border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm">Modo Rápido Activado</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Escribe solo el nombre y guarda. Todos los demás campos son opcionales.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="simple-name" className="text-base font-semibold flex items-center gap-2">
                        Describe tu regalo *
                      </Label>
                      <Input
                        id="simple-name"
                        placeholder="Ej: Camisa azul Nike, Laptop gaming, Perfume Chanel..."
                        value={newItem.name}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 200); // Security: limit length
                          setNewItem({ ...newItem, name: value });
                        }}
                        className="h-12 text-base"
                        required
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground">Escribe libremente. Puedes agregar color, marca, modelo, lo que quieras.</p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="add-details"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategory("Otros");
                          } else {
                            setSelectedCategory("");
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="add-details" className="text-sm cursor-pointer">
                        Quiero agregar más detalles (opcional)
                      </Label>
                    </div>

                    {selectedCategory && (
                      <div className="space-y-4 p-4 border-2 border-dashed border-border rounded-xl animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-semibold text-muted-foreground">Detalles opcionales</Label>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="simple-color" className="text-sm">Color</Label>
                            <Input
                              id="simple-color"
                              placeholder="Ej: Azul"
                              value={newItem.color}
                              onChange={(e) => setNewItem({ ...newItem, color: e.target.value.slice(0, 50) })}
                              maxLength={50}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="simple-size" className="text-sm">Talla/Tamaño</Label>
                            <Input
                              id="simple-size"
                              placeholder="Ej: M, 42"
                              value={newItem.size}
                              onChange={(e) => setNewItem({ ...newItem, size: e.target.value.slice(0, 20) })}
                              maxLength={20}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="simple-brand" className="text-sm">Marca</Label>
                          <Input
                            id="simple-brand"
                            placeholder="Ej: Nike, Samsung, Zara..."
                            value={newItem.brand}
                            onChange={(e) => setNewItem({ ...newItem, brand: e.target.value.slice(0, 50) })}
                            maxLength={50}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="simple-link" className="text-sm">Link de referencia</Label>
                          <Input
                            id="simple-link"
                            type="url"
                            placeholder="https://..."
                            value={newItem.reference_link}
                            onChange={(e) => setNewItem({ ...newItem, reference_link: e.target.value.slice(0, 500) })}
                            maxLength={500}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="simple-notes" className="text-sm">Notas adicionales</Label>
                          <Textarea
                            id="simple-notes"
                            placeholder="Cualquier detalle adicional..."
                            value={newItem.notes}
                            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value.slice(0, 500) })}
                            className="min-h-[80px] resize-none"
                            maxLength={500}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Agregar a Mi Lista
                  </Button>
                </form>
              )}

              {/* LINK MODE: Paste URL */}
              {inputMode === 'link' && (
                <form onSubmit={handleAddItem} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setInputMode(null)}
                      className="gap-2"
                    >
                      ← Cambiar método
                    </Button>
                  </div>

                  <div className="space-y-4 p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border-2 border-green-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-sm">Extracción Automática Activada</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Pega el enlace de cualquier tienda global: Amazon, Target, AliExpress, MercadoLibre, etc.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-url" className="text-base font-semibold flex items-center gap-2">
                        Enlace del producto *
                        {isExtractingUrl && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="link-url"
                          type="url"
                          placeholder="https://www.amazon.com/producto..."
                          value={newItem.reference_link}
                          onChange={(e) => {
                            const value = e.target.value.slice(0, 1000);
                            handleLinkChange(value);
                          }}
                          className="flex-1 h-12"
                          required
                          maxLength={1000}
                        />
                        {newItem.reference_link && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => extractUrlMetadata(newItem.reference_link)}
                            disabled={isExtractingUrl}
                          >
                            <RefreshCw className={cn("h-4 w-4", isExtractingUrl && "animate-spin")} />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ✓ Soportamos tiendas de todo el mundo: Amazon (.com, .es, .mx, etc), Target, Walmart, MercadoLibre, AliExpress, y más
                      </p>
                    </div>

                    {urlMetadata && (
                      <a 
                        href={newItem.reference_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 p-4 border-2 rounded-xl bg-gradient-to-br from-muted/30 to-background space-y-3 block hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex gap-4">
                          {urlMetadata.image && (
                            <div className="relative flex-shrink-0">
                              <img 
                                src={urlMetadata.image} 
                                alt={urlMetadata.title}
                                className="w-28 h-28 object-contain rounded-lg border bg-white group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-2">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{urlMetadata.title}</h4>
                            
                            {urlMetadata.price && (
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <p className="text-xl font-bold text-primary">
                                  ${urlMetadata.price} {urlMetadata.currency}
                                </p>
                                {urlMetadata.originalPrice && urlMetadata.originalPrice !== urlMetadata.price && (
                                  <>
                                    <p className="text-sm text-muted-foreground line-through">
                                      ${urlMetadata.originalPrice}
                                    </p>
                                    {urlMetadata.discountPercentage && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-xs font-bold">
                                        -{urlMetadata.discountPercentage}%
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {urlMetadata.rating && (
                              <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span className="font-semibold">{urlMetadata.rating}</span>
                                </div>
                                {urlMetadata.reviewCount && (
                                  <span className="text-muted-foreground">
                                    ({parseInt(urlMetadata.reviewCount).toLocaleString()} reseñas)
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-1 rounded-md bg-secondary">
                                {urlMetadata.siteName}
                              </span>
                              {urlMetadata.isPrime && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                  Prime
                                </span>
                              )}
                              {urlMetadata.inStock ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                                  ✓ Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-semibold">
                                  ⚠ Sin stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline font-medium">
                          <ExternalLink className="h-3 w-3" />
                          Clic para ver producto completo en tienda
                        </div>
                      </a>
                    )}

                    {urlMetadata && (
                      <div className="space-y-2">
                        <Label htmlFor="link-name" className="text-base font-semibold">
                          Nombre del producto *
                        </Label>
                        <Input
                          id="link-name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value.slice(0, 200) })}
                          className="h-11"
                          required
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">Puedes editar el nombre si lo deseas</p>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base" 
                    size="lg"
                    disabled={!newItem.reference_link || !newItem.name}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Agregar a Mi Lista
                  </Button>
                </form>
              )}

              {/* SEARCH MODE: Search in stores with AI */}
              {inputMode === 'search' && !showProducts && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setInputMode(null)}
                      className="gap-2"
                    >
                      ← Cambiar método
                    </Button>
                  </div>

                  <div className="space-y-4 p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border-2 border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-sm">Búsqueda Inteligente con IA</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Busca productos reales con precios y enlaces directos a tiendas globales.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="store-select" className="text-base font-semibold">
                        Tienda (opcional)
                      </Label>
                      <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger id="store-select" className="h-11">
                          <SelectValue placeholder="Todas las tiendas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">🌍 Todas las tiendas (Global)</SelectItem>
                          <SelectGroup>
                            <SelectLabel>🇺🇸 Estados Unidos</SelectLabel>
                            <SelectItem value="amazon-us">Amazon.com</SelectItem>
                            <SelectItem value="target">Target</SelectItem>
                            <SelectItem value="walmart">Walmart</SelectItem>
                            <SelectItem value="bestbuy">Best Buy</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>🇲🇽 México</SelectLabel>
                            <SelectItem value="amazon-mx">Amazon.com.mx</SelectItem>
                            <SelectItem value="mercadolibre-mx">MercadoLibre México</SelectItem>
                            <SelectItem value="liverpool">Liverpool</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>🇪🇸 España</SelectLabel>
                            <SelectItem value="amazon-es">Amazon.es</SelectItem>
                            <SelectItem value="elcorteingles">El Corte Inglés</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>🌐 Internacional</SelectLabel>
                            <SelectItem value="aliexpress">AliExpress</SelectItem>
                            <SelectItem value="ebay">eBay</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Deja en "Todas las tiendas" para buscar en múltiples marketplaces
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search-query" className="text-base font-semibold">
                        ¿Qué estás buscando? *
                      </Label>
                      <Textarea
                        id="search-query"
                        placeholder="Ej: Laptop gaming 16GB RAM, Zapatillas Nike running talla 42, Perfume Chanel mujer..."
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value.slice(0, 300))}
                        className="min-h-[100px] resize-none"
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sé específico: incluye marca, modelo, color, talla si los conoces
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget-search" className="text-sm">
                        Presupuesto máximo (opcional)
                      </Label>
                      <Input
                        id="budget-search"
                        type="number"
                        placeholder="USD"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        min="0"
                        max="999999"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleSearchProducts}
                      disabled={!aiContext.trim() || productSearchLoading}
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      {productSearchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Buscando productos reales...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Buscar Productos con IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {/* Product Search Results - works for all modes */}
              {showProducts && foundProducts.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowProducts(false);
                        setFoundProducts([]);
                      }}
                      className="gap-2"
                    >
                      ← Nueva búsqueda
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border-2 border-success/20">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-success" />
                      <h4 className="font-semibold text-base">Encontramos {foundProducts.length} productos reales</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Toca un producto para agregarlo a tu lista automáticamente</p>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {foundProducts.map((product, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-accent/50 transition-all duration-200 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">${product.price}</p>
                              <p className="text-xs text-muted-foreground">{product.currency || 'USD'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">{product.store}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary group-hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              Ver en tienda
                            </div>
                          </div>
                          {product.image_description && (
                            <p className="text-xs text-muted-foreground italic">
                              {product.image_description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </DialogContent>
        </Dialog>
      </main>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title={deleteConfirm.type === "list" ? "¿Eliminar lista?" : "¿Eliminar regalo?"}
        description={
          deleteConfirm.type === "list"
            ? "Esta acción no se puede deshacer. Se eliminarán todos los regalos de esta lista."
            : "Esta acción no se puede deshacer. El regalo será eliminado permanentemente."
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <Footer />
    </div>
  );
};

export default Lists;