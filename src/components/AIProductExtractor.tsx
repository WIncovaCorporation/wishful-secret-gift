import { useState, useCallback } from 'react';
import { Upload, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExtractedProduct {
  title: string;
  price?: number;
  description?: string;
  url?: string;
  category: string;
  image_url?: string;
}

interface AIProductExtractorProps {
  onProductExtracted: (product: ExtractedProduct) => void;
  onCancel?: () => void;
}

export function AIProductExtractor({ onProductExtracted, onCancel }: AIProductExtractorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      setPreviewImage(base64);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('extract-product-from-image', {
        body: { imageBase64: base64 }
      });

      if (error) throw error;

      if (data?.product) {
        toast.success('¡Producto extraído exitosamente! 🎉');
        onProductExtracted(data.product);
      } else {
        throw new Error('No se pudo extraer información del producto');
      }
    } catch (error: any) {
      console.error('Error extracting product:', error);
      const errorMessage = error?.message || 'Error al procesar la imagen';
      
      if (errorMessage.includes('Límite de solicitudes')) {
        toast.error('Límite de solicitudes excedido. Intenta de nuevo en unos momentos.', { duration: 5000 });
      } else if (errorMessage.includes('Créditos insuficientes')) {
        toast.error('Créditos de IA insuficientes. Contacta soporte.', { duration: 5000 });
      } else {
        toast.error('No se pudo extraer información. Intenta con otra imagen o agrégalo manualmente.');
      }
      setPreviewImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      toast.error('Por favor sube una imagen válida');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Extrae info desde capturas o fotos</p>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "w-full min-h-[200px] border-2 border-dashed rounded-lg transition-all",
              "flex flex-col items-center justify-center gap-4 p-8",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              isProcessing && "opacity-50 pointer-events-none"
            )}
          >
            {isProcessing ? (
              <>
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="max-h-32 rounded-lg mb-4" />
                )}
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Extrayendo información...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">
                    Arrastra una imagen aquí o haz clic para subir
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Captura de pantalla, foto del producto, o imagen de la tienda
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessing}
                />
                <Button asChild variant="outline" disabled={isProcessing}>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    Seleccionar Imagen
                  </label>
                </Button>
              </>
            )}
          </div>

          <div className="w-full flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p className="mb-2">💡 <strong>Tip:</strong> Funciona mejor con capturas de pantalla que muestren:</p>
            <ul className="text-left inline-block space-y-1">
              <li>• Nombre del producto claramente visible</li>
              <li>• Precio del producto</li>
              <li>• Imagen del producto</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}