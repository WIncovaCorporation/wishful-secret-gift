import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const credentialsSchema = z.object({
  access_key: z.string().min(1, "Access Key es requerido"),
  secret_key: z.string().min(1, "Secret Key es requerido"),
  associate_tag: z.string().min(1, "Associate Tag es requerido"),
  marketplace: z.string().min(1, "Marketplace es requerido"),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

export default function AmazonCredentialsForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      marketplace: "US",
    },
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("amazon_credentials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasCredentials(true);
        setValue("access_key", data.access_key);
        setValue("secret_key", data.secret_key);
        setValue("associate_tag", data.associate_tag);
        setValue("marketplace", data.marketplace);
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  };

  const onSubmit = async (data: CredentialsFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      const credentialsData = {
        user_id: user.id,
        access_key: data.access_key,
        secret_key: data.secret_key,
        associate_tag: data.associate_tag,
        marketplace: data.marketplace,
      };

      const { error } = await supabase
        .from("amazon_credentials")
        .upsert([credentialsData], { onConflict: "user_id" });

      if (error) throw error;

      toast.success(hasCredentials ? "Credenciales actualizadas" : "Credenciales guardadas");
      setHasCredentials(true);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      toast.error(error.message || "Error al guardar credenciales");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Tus credenciales se almacenan de forma segura y cifrada. Solo tú tienes acceso a ellas.
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Necesitas una cuenta de Amazon Associates y acceso a Amazon Product Advertising API.{" "}
          <a
            href="https://affiliate-program.amazon.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Regístrate aquí
          </a>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="access_key">Access Key ID</Label>
          <Input
            id="access_key"
            type="text"
            {...register("access_key")}
            placeholder="AKIAIOSFODNN7EXAMPLE"
          />
          {errors.access_key && (
            <p className="text-sm text-destructive">{errors.access_key.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret_key">Secret Access Key</Label>
          <Input
            id="secret_key"
            type="password"
            {...register("secret_key")}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          />
          {errors.secret_key && (
            <p className="text-sm text-destructive">{errors.secret_key.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="associate_tag">Associate Tag</Label>
          <Input
            id="associate_tag"
            type="text"
            {...register("associate_tag")}
            placeholder="tutienda-20"
          />
          {errors.associate_tag && (
            <p className="text-sm text-destructive">{errors.associate_tag.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Este tag se agregará automáticamente a todos los enlaces generados
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketplace">Marketplace</Label>
          <Select
            defaultValue="US"
            onValueChange={(value) => setValue("marketplace", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">Estados Unidos (amazon.com)</SelectItem>
              <SelectItem value="MX">México (amazon.com.mx)</SelectItem>
              <SelectItem value="ES">España (amazon.es)</SelectItem>
              <SelectItem value="UK">Reino Unido (amazon.co.uk)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : hasCredentials ? "Actualizar Credenciales" : "Guardar Credenciales"}
        </Button>
      </form>
    </div>
  );
}
