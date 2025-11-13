import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Heart, Plus, List, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

interface AddToListDropdownProps {
  product: Product;
  isAdded: boolean;
  currentListId?: string;
  onSuccess?: () => void;
}

export function AddToListDropdown({ product, isAdded, currentListId, onSuccess }: AddToListDropdownProps) {
  const [lists, setLists] = useState<GiftList[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
        return;
      }

      const { data, error } = await supabase
        .from('gift_lists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error: any) {
      console.error('Error loading lists:', error);
      toast.error('Error al cargar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (listId: string, listName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentListId) {
        // Buscar el item actual
        const { data: currentItem } = await supabase
          .from('gift_items')
          .select('id')
          .eq('list_id', currentListId)
          .eq('reference_link', product.affiliate_link)
          .maybeSingle();

        if (currentItem) {
          if (currentListId === listId) {
            toast.info('El producto ya está en esa lista');
            setOpen(false);
            return;
          }

          // Mover a nueva lista
          const { error } = await supabase
            .from('gift_items')
            .update({ list_id: listId })
            .eq('id', currentItem.id);

          if (error) throw error;

          toast.success('¡Producto movido!', {
            description: `"${product.name}" ahora en "${listName}"`
          });
        }
      } else {
        // Agregar nuevo
        const { error } = await supabase
          .from('gift_items')
          .insert([{
            list_id: listId,
            name: product.name,
            category: product.category,
            notes: product.description,
            reference_link: product.affiliate_link,
            image_url: product.image_url,
            priority: 'medium',
          }]);

        if (error) throw error;

        toast.success('¡Agregado!', {
          description: `"${product.name}" en "${listName}"`
        });
      }

      onSuccess?.();
      setOpen(false);
    } catch (error: any) {
      console.error('Error managing list:', error);
      toast.error('Error al gestionar lista');
    }
  };

  const handleViewInList = () => {
    navigate('/lists');
    setOpen(false);
  };

  const handleCreateNewList = () => {
    // TODO: Abrir diálogo de crear lista
    toast.info('Función de crear lista en desarrollo');
    setOpen(false);
  };

  if (isAdded && currentListId) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="w-full gap-2"
          >
            <Heart className="w-4 h-4 fill-current" />
            En tu Lista
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Gestionar Producto
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewInList}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Ver en Mis Listas
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Mover a otra lista:
          </DropdownMenuLabel>

          {loading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando...
            </DropdownMenuItem>
          ) : lists.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No hay otras listas
            </DropdownMenuItem>
          ) : (
            lists
              .filter(list => list.id !== currentListId)
              .map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => handleAddToList(list.id, list.name)}
                  className="cursor-pointer"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {list.name}
                </DropdownMenuItem>
              ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateNewList}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Nueva Lista
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="w-full gap-2 text-base font-semibold"
        >
          <Heart className="w-5 h-5" />
          💾 Guardar en mi lista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <List className="w-4 h-4" />
          Selecciona una lista
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <DropdownMenuItem disabled>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cargando listas...
          </DropdownMenuItem>
        ) : lists.length === 0 ? (
          <>
            <DropdownMenuItem disabled className="text-muted-foreground text-sm">
              No tienes listas aún
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateNewList}>
              <Plus className="w-4 h-4 mr-2" />
              Crear tu primera lista
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onClick={() => handleAddToList(list.id, list.name)}
                className="cursor-pointer"
              >
                <Heart className="w-4 h-4 mr-2" />
                {list.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateNewList}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Nueva Lista
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
