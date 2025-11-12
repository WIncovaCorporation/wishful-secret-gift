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
}

export function AddToWishlistDialog({ open, onOpenChange, product, onSuccess }: AddToWishlistDialogProps) {
  const [lists, setLists] = useState<GiftList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadLists();
    }
  }, [open]);

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
        setSelectedListId(data[0].id);
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('gift_lists')
        .insert([{ name: newListName, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lista creada!');
      setLists([...lists, { id: data.id, name: data.name }]);
      setSelectedListId(data.id);
      setShowNewListInput(false);
      setNewListName('');
    } catch (error: any) {
      toast.error('Error al crear lista');
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId) {
      toast.error('Selecciona una lista');
      return;
    }

    if (!product) return;

    setSaving(true);
    try {
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
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding to list:', error);
      toast.error('Error al agregar a lista');
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
            Agregar a Lista
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
                <Label>Selecciona una lista:</Label>
                <ScrollArea className="h-48 rounded-md border p-4">
                  <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                    {lists.map((list) => (
                      <div key={list.id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={list.id} id={list.id} />
                        <Label htmlFor={list.id} className="flex-1 cursor-pointer">
                          {list.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewListInput(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nueva Lista
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="newListName">
                  {lists.length === 0 ? 'Crea tu primera lista:' : 'Nombre de la nueva lista:'}
                </Label>
                <Input
                  id="newListName"
                  placeholder="Ej: Regalos de Navidad"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateList} className="flex-1">
                    Crear Lista
                  </Button>
                  {lists.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewListInput(false);
                        setNewListName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {lists.length > 0 && !showNewListInput && (
              <Button 
                className="w-full" 
                onClick={handleAddToList}
                disabled={saving || !selectedListId}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Agregar a Lista
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
