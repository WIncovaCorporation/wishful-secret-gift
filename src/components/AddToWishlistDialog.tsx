import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  affiliate_link: string;
}

interface GiftList {
  id: string;
  name: string;
}

interface AddToWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
  currentListId?: string;
}

export function AddToWishlistDialog({ open, onOpenChange, product, onSuccess, currentListId }: AddToWishlistDialogProps) {
  const [lists, setLists] = useState<GiftList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const isMovingToAnotherList = !!currentListId;

  useEffect(() => {
    if (open) {
      loadLists();
      if (currentListId && product) {
        loadCurrentItem();
      }
    }
  }, [open, currentListId, product]);

  const loadCurrentItem = async () => {
    if (!currentListId || !product) return;
    
    try {
      const { data } = await supabase
        .from('gift_items')
        .select('id')
        .eq('list_id', currentListId)
        .eq('reference_link', product.affiliate_link)
        .single();
      
      if (data) {
        setCurrentItemId(data.id);
      }
    } catch (error) {
      console.error('Error loading current item:', error);
    }
  };

  const loadLists = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        onOpenChange(false);
        return;
      }

      const { data, error } = await supabase
        .from('gift_lists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLists(data || []);
      if (data && data.length > 0) {
        // Si estamos moviendo, preseleccionar la lista actual
        setSelectedListId(currentListId || data[0].id);
      } else {
        setShowNewListInput(true);
      }
    } catch (error: any) {
      console.error('Error loading lists:', error);
      toast.error('Error al cargar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Ingresa un nombre para la lista');
      return;
    }

    if (!product) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Crear la lista
      const { data: listData, error: listError } = await supabase
        .from('gift_lists')
        .insert([{ name: newListName, user_id: user.id }])
        .select()
        .single();

      if (listError) throw listError;

      // Agregar el producto automáticamente a la nueva lista
      const { error: itemError } = await supabase
        .from('gift_items')
        .insert([{
          list_id: listData.id,
          name: product.name,
          category: product.category,
          notes: product.description,
          reference_link: product.affiliate_link,
          image_url: product.image_url,
          priority: 'medium',
        }]);

      if (itemError) throw itemError;

      toast.success('¡Lista creada y producto agregado!', {
        description: `"${product.name}" en "${newListName}"`
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating list:', error);
      toast.error('Error al crear lista');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId) {
      toast.error('Selecciona una lista');
      return;
    }

    if (!product) return;

    // Si ya está en la misma lista, no hacer nada
    if (currentListId === selectedListId) {
      toast.info('El producto ya está en esa lista');
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      if (isMovingToAnotherList && currentItemId) {
        // Mover: actualizar el list_id del item existente
        const { error } = await supabase
          .from('gift_items')
          .update({ list_id: selectedListId })
          .eq('id', currentItemId);

        if (error) throw error;

        const selectedList = lists.find(l => l.id === selectedListId);
        toast.success('¡Producto movido!', {
          description: `"${product.name}" ahora en "${selectedList?.name}"`
        });
      } else {
        // Agregar nuevo
        const { error } = await supabase
          .from('gift_items')
          .insert([{
            list_id: selectedListId,
            name: product.name,
            category: product.category,
            notes: product.description,
            reference_link: product.affiliate_link,
            image_url: product.image_url,
            priority: 'medium',
          }]);

        if (error) throw error;

        const selectedList = lists.find(l => l.id === selectedListId);
        toast.success('¡Agregado a tu lista!', {
          description: `"${product.name}" en "${selectedList?.name}"`
        });
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error managing list item:', error);
      toast.error(isMovingToAnotherList ? 'Error al mover producto' : 'Error al agregar a lista');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            {isMovingToAnotherList ? 'Cambiar de Lista' : 'Agregar a Lista'}
          </DialogTitle>
          <DialogDescription>
            {product.name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {lists.length > 0 && !showNewListInput ? (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    {isMovingToAnotherList ? 'Selecciona la nueva lista:' : 'Selecciona una lista existente:'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isMovingToAnotherList 
                      ? 'Mueve este producto a otra lista' 
                      : 'Elige dónde guardar este producto'}
                  </p>
                </div>
                <ScrollArea className="h-48 rounded-md border p-4 bg-muted/20">
                  <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                    {lists.map((list) => {
                      const isCurrent = list.id === currentListId;
                      return (
                        <div key={list.id} className="flex items-center space-x-3 py-3 px-2 rounded-md hover:bg-accent transition-colors">
                          <RadioGroupItem value={list.id} id={list.id} />
                          <Label htmlFor={list.id} className="flex-1 cursor-pointer font-medium">
                            {list.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-primary">(actual)</span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </ScrollArea>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowNewListInput(true)}
                >
                  <Plus className="w-4 h-4" />
                  Crear Nueva Lista
                </Button>

                <Button 
                  className="w-full" 
                  onClick={handleAddToList}
                  disabled={saving || !selectedListId || (currentListId === selectedListId)}
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isMovingToAnotherList ? 'Moviendo...' : 'Agregando...'}
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      {isMovingToAnotherList ? 'Mover a Lista Seleccionada' : 'Agregar a Lista Seleccionada'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newListName" className="text-base font-semibold">
                    {lists.length === 0 ? 'Crea tu primera lista de deseos:' : 'Crear nueva lista:'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {lists.length === 0 
                      ? 'El producto se agregará automáticamente' 
                      : 'El producto se agregará automáticamente a esta nueva lista'}
                  </p>
                </div>
                <Input
                  id="newListName"
                  placeholder="Ej: Regalos de Navidad 2025"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !saving && handleCreateList()}
                  disabled={saving}
                  className="text-base"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateList} 
                    className="flex-1"
                    disabled={saving || !newListName.trim()}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear y Agregar Producto
                      </>
                    )}
                  </Button>
                  {lists.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewListInput(false);
                        setNewListName('');
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
