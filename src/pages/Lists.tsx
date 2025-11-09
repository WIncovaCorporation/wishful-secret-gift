import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      const { data, error } = await supabase.functions.invoke('suggest-gift', {
        body: { 
          context: aiContext,
          existingItems: currentList?.items || []
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
            setAiSuggestions([]);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Regalo</DialogTitle>
              <DialogDescription>Usa la IA o completa manualmente los detalles</DialogDescription>
            </DialogHeader>

            {/* AI Suggestions Section */}
            {!showSuggestions && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="ai-context" className="text-base font-semibold">¿Necesitas ideas?</Label>
                    <p className="text-sm text-muted-foreground mb-2">Describe para quién es el regalo, la ocasión, presupuesto, gustos...</p>
                    <Textarea
                      id="ai-context"
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      placeholder="Ej: Para mi hermana de 25 años, le encanta la tecnología y el fitness, presupuesto hasta $200"
                      rows={2}
                      className="mb-2"
                    />
                    <Button
                      type="button"
                      onClick={handleAISuggestions}
                      disabled={aiLoading || !aiContext.trim()}
                      className="w-full"
                      variant="default"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generando sugerencias...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generar Sugerencias con IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Show AI Suggestions */}
            {showSuggestions && aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Sugerencias de IA</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                    Volver
                  </Button>
                </div>
                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                  {aiSuggestions.map((suggestion, idx) => (
                    <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectSuggestion(suggestion)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold">{suggestion.name}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.notes}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span className="text-xs px-2 py-1 bg-primary/10 rounded">{suggestion.category}</span>
                              {suggestion.brand && <span className="text-xs px-2 py-1 bg-accent/10 rounded">{suggestion.brand}</span>}
                              <span className={`text-xs px-2 py-1 rounded ${
                                suggestion.priority === "high" ? "bg-destructive/20 text-destructive" :
                                suggestion.priority === "medium" ? "bg-accent/20" : "bg-muted"
                              }`}>
                                Prioridad: {suggestion.priority === "high" ? "Alta" : suggestion.priority === "medium" ? "Media" : "Baja"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Form */}
            {!showSuggestions && (
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="item-name">Nombre del Regalo *</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Ej: iPhone 15 Pro"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="item-category">Categoría *</Label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(GIFT_CATEGORIES).map(([mainCat, subCats]) => (
                          <div key={mainCat}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{mainCat}</div>
                            {subCats.map((subCat) => (
                              <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {smartOptions.needsColor && (
                    <div>
                      <Label htmlFor="item-color">Color</Label>
                      <Select value={newItem.color} onValueChange={(value) => setNewItem({ ...newItem, color: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un color" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_COLORS.map((color) => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {smartOptions.needsSize && (
                    <div>
                      <Label htmlFor="item-size">Talla/Medida</Label>
                      <Select value={newItem.size} onValueChange={(value) => setNewItem({ ...newItem, size: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona talla" />
                        </SelectTrigger>
                        <SelectContent>
                          {(smartOptions.sizeType === "shoe" ? SHOE_SIZES : CLOTHING_SIZES).map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {smartOptions.suggestedBrands.length > 0 && (
                    <div className="col-span-2">
                      <Label htmlFor="item-brand">Marca</Label>
                      <Select value={newItem.brand} onValueChange={(value) => setNewItem({ ...newItem, brand: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una marca" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {smartOptions.suggestedBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                          <SelectItem value="Otra">Otra marca...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="col-span-2">
                    <Label htmlFor="item-priority">Prioridad</Label>
                    <Select
                      value={newItem.priority}
                      onValueChange={(value) => setNewItem({ ...newItem, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="item-link">Enlace de Referencia</Label>
                    <Input
                      id="item-link"
                      type="url"
                      value={newItem.reference_link}
                      onChange={(e) => setNewItem({ ...newItem, reference_link: e.target.value })}
                      placeholder="https://amazon.com/producto"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="item-notes">Notas Adicionales</Label>
                    <Textarea
                      id="item-notes"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      placeholder="Cualquier detalle adicional que ayude..."
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Agregar Regalo</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Lists;