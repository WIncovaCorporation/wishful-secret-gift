import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(500),
  category: z.enum(['electronics', 'fashion', 'home', 'books', 'sports']),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Precio inválido'),
  image_url: z.string().url('URL inválida'),
  affiliate_link: z.string().url('URL inválida').refine(
    (url) => url.includes('amazon.com') || url.includes('amzn.to'),
    'Debe ser un enlace de Amazon'
  ),
  affiliate_network: z.string().default('amazon'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function ProductForm({ onSuccess, onCancel, initialData }: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      category: 'electronics',
      price: '',
      image_url: '',
      affiliate_link: '',
      affiliate_network: 'amazon',
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        image_url: data.image_url,
        affiliate_link: data.affiliate_link,
        affiliate_network: data.affiliate_network,
        owner_id: user.id,
        is_active: true,
        rating: 0,
        reviews_count: 0,
      };

      if (initialData?.id) {
        // Actualizar
        const { error } = await supabase
          .from('affiliate_products')
          .update(productData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        // Crear
        const { error } = await supabase
          .from('affiliate_products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Producto agregado');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="iPhone 15 Pro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del producto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="electronics">Electrónica</SelectItem>
                    <SelectItem value="fashion">Moda</SelectItem>
                    <SelectItem value="home">Hogar</SelectItem>
                    <SelectItem value="books">Libros</SelectItem>
                    <SelectItem value="sports">Deportes</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (USD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="99.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription>
                Usa una imagen del producto de alta calidad
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="affiliate_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enlace de Afiliado de Amazon</FormLabel>
              <FormControl>
                <Input placeholder="https://amazon.com/product?tag=tu-tag" {...field} />
              </FormControl>
              <FormDescription>
                Debe incluir TU tag de afiliado de Amazon
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Actualizar' : 'Agregar'} Producto
          </Button>
        </div>
      </form>
    </Form>
  );
}
