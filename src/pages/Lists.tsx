import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Gift, Plus, Trash2, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { GIFT_CATEGORIES, COMMON_COLORS, CLOTHING_SIZES, SHOE_SIZES, POPULAR_BRANDS, getSmartOptions } from "@/lib/giftOptions";
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
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GiftList[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from("gift_lists")
        .delete()
        .eq("id", listId);

      if (error) throw error;

      toast.success("Lista eliminada!");
      await loadLists(user.id);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from("gift_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Regalo eliminado!");
      await loadLists(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
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

      if (error) throw error;

      setAiSuggestions(data.suggestions || []);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
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
            <h1 className="text-2xl font-bold">Mis Listas de Regalos</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">Gestiona tus listas de deseos</p>
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
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tienes listas aún</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera lista de regalos</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Lista
              </Button>
            </CardContent>
          </Card>
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
                          className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.is_purchased}
                            onChange={() => handleTogglePurchased(item.id, item.is_purchased)}
                            className="mt-1 w-5 h-5 rounded border-border"
                          />
                          <div className="flex-1">
                            <h4 className={`font-semibold ${item.is_purchased ? "line-through text-muted-foreground" : ""}`}>
                              {item.name}
                            </h4>
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
                                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                Ver enlace <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
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
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Regalo a Mi Lista</DialogTitle>
              <DialogDescription>Busca con IA, selecciona por categoría o completa manualmente</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
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

              {/* Manual Form - Progressive Disclosure */}
              {!showSuggestions && (
                <form onSubmit={handleAddItem} className="space-y-6">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground font-medium">o completa manualmente</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Step 1: Category First */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-semibold flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                      ¿Qué tipo de regalo buscas? *
                    </Label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger id="category" className="h-11">
                        <SelectValue placeholder="Elige una categoría" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[320px]">
                        {Object.entries(GIFT_CATEGORIES).map(([mainCat, subCats]) => (
                          <SelectGroup key={mainCat}>
                            <SelectLabel className="text-primary font-semibold">{mainCat}</SelectLabel>
                            {subCats.length > 0 ? (
                              subCats.map((subCat) => (
                                <SelectItem key={subCat} value={subCat} className="pl-6">
                                  {subCat}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={mainCat}>{mainCat}</SelectItem>
                            )}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Name appears after category */}
                  {selectedCategory && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
                        required
                      />
                    </div>
                  )}

                  {/* Step 3: Smart fields appear based on category */}
                  {selectedCategory && newItem.name && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
                        Detalles específicos (opcional)
                      </Label>
                      
                      <div className="grid grid-cols-2 gap-4 pl-8">
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
                        <div className="space-y-2 pl-8">
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

                      <div className="space-y-2 pl-8">
                        <Label htmlFor="priority" className="text-sm font-medium">¿Qué tan importante es?</Label>
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

                      <div className="space-y-2 pl-8">
                        <Label htmlFor="url" className="text-sm font-medium">Enlace de referencia</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://amazon.com/producto"
                          value={newItem.reference_link}
                          onChange={(e) => setNewItem({ ...newItem, reference_link: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Link al producto para que otros sepan exactamente cuál es</p>
                      </div>

                      <div className="space-y-2 pl-8">
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
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 shadow-lg" 
                    size="lg"
                    disabled={!selectedCategory || !newItem.name}
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
    </div>
  );
};

export default Lists;