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
      const { error } = await supabase
        .from("gift_items")
        .insert([{ ...newItem, list_id: selectedList }]);

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
    if (!selectedCategory) {
      toast.error("Primero selecciona una categoría");
      return;
    }

    setProductSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: { 
          category: selectedCategory,
          color: newItem.color || undefined,
          size: newItem.size || undefined,
          brand: newItem.brand || undefined,
          budget: budget ? parseFloat(budget) : undefined
        }
      });

      if (error) throw error;

      setFoundProducts(data.products || []);
      setShowProducts(true);
      toast.success(`¡Encontré ${data.products.length} opciones reales!`);
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
              <DialogDescription>Busca con IA, selecciona por categoría o completa manualmente</DialogDescription>
            </DialogHeader>

            <div ref={formScrollRef} className="space-y-6 py-4 overflow-y-auto flex-1">
              {/* AI-Powered Smart Search Section */}
              {!showSuggestions && (
                <div className="space-y-4 p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">¿Qué te gustaría recibir?</h3>
                      <p className="text-xs text-muted-foreground">Describe el regalo y la IA te dará opciones personalizadas</p>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Ej: unos auriculares inalámbricos para el gym, una camisa casual azul, un libro de cocina italiana..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Presupuesto (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input
                        type="number"
                        placeholder="50"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="pl-8 pr-16"
                        min="0"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">USD</span>
                    </div>
                    {budget && (
                      <p className="text-xs text-primary/80 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        La IA buscará opciones de hasta ${budget}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleAISuggestions}
                    disabled={aiLoading || !aiContext.trim()}
                    className="w-full shadow-lg"
                    size="lg"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Buscando opciones perfectas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generar Ideas con IA
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* AI Suggestions Display */}
              {showSuggestions && aiSuggestions.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">Ideas personalizadas para ti</h4>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                      Buscar de nuevo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Toca una opción para auto-completar el formulario</p>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-accent/50 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-base group-hover:text-primary transition-colors">{suggestion.name}</p>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                suggestion.priority === "high" ? "bg-destructive/15 text-destructive" :
                                suggestion.priority === "medium" ? "bg-primary/15 text-primary" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {suggestion.priority === "high" ? "Alta" : suggestion.priority === "medium" ? "Media" : "Baja"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.notes}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium">
                                {suggestion.category}
                              </span>
                              {suggestion.brand && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                  {suggestion.brand}
                                </span>
                              )}
                              {suggestion.color && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent/30 text-xs font-medium">
                                  {suggestion.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Search Results */}
              {showProducts && foundProducts.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">Productos reales encontrados</h4>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowProducts(false)}>
                      Volver al formulario
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Toca un producto para agregarlo a tu lista</p>
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
                              <p className="text-xs text-muted-foreground">USD</p>
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

              {/* Manual Form - Progressive Disclosure */}
              {!showSuggestions && !showProducts && (
                <form onSubmit={handleAddItem} className="space-y-6">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground font-medium">o completa manualmente</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Step 1: Smart Category Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                      ¿Qué tipo de regalo buscas? *
                    </Label>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Busca directamente: camisa, laptop, juego..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          // Auto-scroll when user types to show results
                          if (e.target.value.trim()) {
                            setTimeout(() => {
                              formScrollRef.current?.scrollTo({ top: formScrollRef.current.scrollHeight, behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                        className="pl-10 pr-10 h-11"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() && getSearchResults().length > 0 && (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-primary/30 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Search className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-primary">Resultados para "{searchQuery}":</p>
                        </div>
                        {getSearchResults().slice(0, 10).map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleCategoryChange(result.sub);
                              setMainCategory(result.main);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/15 transition-all border-2 border-transparent hover:border-primary/40 bg-card"
                          >
                            <p className="font-semibold text-base">{result.sub}</p>
                            <p className="text-xs text-muted-foreground mt-1">Categoría: {result.main}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results message */}
                    {searchQuery.trim() && getSearchResults().length === 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg border text-center">
                        <p className="text-sm text-muted-foreground">
                          No se encontraron resultados para "{searchQuery}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Intenta con otro término o elige una categoría abajo
                        </p>
                      </div>
                    )}

                    {/* Main Categories (only show if no search) */}
                    {!searchQuery.trim() && !mainCategory && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">O elige una categoría principal:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.keys(GIFT_CATEGORIES).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleMainCategoryChange(cat)}
                              className="p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left font-medium"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subcategories (when main category is selected) */}
                    {mainCategory && !searchQuery.trim() && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Elige en {mainCategory}:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMainCategory("")}
                          >
                            ← Cambiar categoría
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                          {getFilteredSubcategories().map((subCat) => (
                            <button
                              key={subCat}
                              type="button"
                              onClick={() => handleCategoryChange(subCat)}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                selectedCategory === subCat
                                  ? "border-primary bg-primary/10 font-semibold"
                                  : "border-border hover:border-primary/50 hover:bg-accent/50"
                              }`}
                            >
                              {subCat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Category Display */}
                    {selectedCategory && (
                      <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Categoría seleccionada:</p>
                          <p className="font-semibold text-primary">{selectedCategory}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory("");
                            setMainCategory("");
                          }}
                        >
                          Cambiar
                        </Button>
                      </div>
                    )}

                    {/* AI Product Search Button */}
                    {selectedCategory && (
                      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <ShoppingBag className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">¿Quieres ver opciones reales en tiendas?</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                La IA buscará productos reales con enlaces directos
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleSearchProducts}
                            disabled={productSearchLoading}
                            variant="default"
                            className="w-full shadow-lg"
                            size="default"
                          >
                            {productSearchLoading ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Buscando en tiendas online...
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                Buscar Productos Reales con IA
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Name and details appear after category */}
                  {selectedCategory && (
                    <div ref={categoryRef} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                          Especifica el regalo *
                        </Label>
                        <Input
                          id="name"
                          placeholder={`Ej: ${
                            selectedCategory === "Smartphone" ? "iPhone 15 Pro 256GB" :
                            selectedCategory === "Camisa" ? "Camisa de vestir slim fit" :
                            selectedCategory === "Laptop" ? "MacBook Air M2 13 pulgadas" :
                            selectedCategory === "Zapatos" ? "Nike Air Max 90" :
                            "Modelo o descripción específica"
                          }`}
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          className="h-11"
                        />
                      </div>

                      {/* Link field - Show BEFORE category details for better UX */}
                      <div className="space-y-2">
                        <Label htmlFor="url" className="text-sm font-medium flex items-center gap-2">
                          Enlace de referencia
                          {isExtractingUrl && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="url"
                            type="url"
                            placeholder="https://amazon.com/producto..."
                            value={newItem.reference_link}
                            onChange={(e) => handleLinkChange(e.target.value)}
                            className="flex-1"
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
                          Pega el enlace del producto y extraeremos la información automáticamente
                        </p>
                        
                        {urlMetadata && (
                          <a 
                            href={newItem.reference_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-3 p-4 border rounded-lg bg-gradient-to-br from-muted/30 to-background space-y-3 block hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer group"
                          >
                            <div className="flex gap-4">
                              {urlMetadata.image && (
                                <div className="relative flex-shrink-0">
                                  <img 
                                    src={urlMetadata.image} 
                                    alt={urlMetadata.title}
                                    className="w-24 h-24 object-contain rounded border bg-white group-hover:scale-105 transition-transform duration-200"
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
                                    <p className="text-lg font-bold text-primary">
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
                                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-secondary/50">
                                    {urlMetadata.siteName}
                                  </span>
                                  {urlMetadata.isPrime && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M2.5 5.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                                      </svg>
                                      Prime
                                    </span>
                                  )}
                                  {urlMetadata.inStock ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                                      ✓ Disponible
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-semibold">
                                      ⚠ Sin stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline font-medium">
                              <ExternalLink className="h-3 w-3" />
                              Ver producto completo en tienda
                            </div>
                          </a>
                        )}
                      </div>

                      {/* Smart fields - Color, Size, Brand */}
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-muted-foreground">Detalles adicionales (opcional)</Label>
                      
                        <div className="grid grid-cols-2 gap-4">
                          {smartOptions.needsColor && (
                            <div className="space-y-2">
                              <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                              <Select value={newItem.color} onValueChange={(value) => setNewItem({ ...newItem, color: value })}>
                                <SelectTrigger id="color">
                                  <SelectValue placeholder="Elige color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {COMMON_COLORS.map((color) => (
                                    <SelectItem key={color} value={color}>
                                      {color}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {smartOptions.needsSize && (
                            <div className="space-y-2">
                              <Label htmlFor="size" className="text-sm font-medium">Talla/Medida</Label>
                              <Select value={newItem.size} onValueChange={(value) => setNewItem({ ...newItem, size: value })}>
                                <SelectTrigger id="size">
                                  <SelectValue placeholder="Elige talla" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(smartOptions.sizeType === "shoe" ? SHOE_SIZES : CLOTHING_SIZES).map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {smartOptions.suggestedBrands.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="brand" className="text-sm font-medium">Marca preferida</Label>
                            <Select value={newItem.brand} onValueChange={(value) => setNewItem({ ...newItem, brand: value })}>
                              <SelectTrigger id="brand">
                                <SelectValue placeholder="Selecciona una marca" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {smartOptions.suggestedBrands.map((brand) => (
                                  <SelectItem key={brand} value={brand}>
                                    {brand}
                                  </SelectItem>
                                ))}
                                <SelectItem value="Otra">Otra marca</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="priority" className="text-sm font-medium">Prioridad</Label>
                          <Select value={newItem.priority} onValueChange={(value: any) => setNewItem({ ...newItem, priority: value })}>
                            <SelectTrigger id="priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">🔥 Alta prioridad</SelectItem>
                              <SelectItem value="medium">⭐ Prioridad media</SelectItem>
                              <SelectItem value="low">💭 Baja prioridad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">Notas adicionales</Label>
                          <Textarea
                            id="notes"
                            placeholder="Ej: Prefiero el modelo más reciente, necesito que sea compatible con iPhone..."
                            value={newItem.notes}
                            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 shadow-lg" 
                    size="lg"
                    disabled={!selectedCategory || !newItem.name.trim()}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Agregar a Mi Lista
                  </Button>
                </form>
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