import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  plan: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - email not sent");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const resend = new Resend(resendApiKey);
    const { email, name, plan }: WelcomeEmailRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a GiftApp! 🎁</h1>
            </div>
            <div class="content">
              <p>Hola ${name || ""}!</p>
              <p>Gracias por unirte a GiftApp. Estamos emocionados de tenerte con nosotros.</p>
              <p><strong>Tu plan actual:</strong> ${plan === "free" ? "Gratuito" : plan === "premium_individual" ? "Premium Individual" : "Premium Business"}</p>
              
              ${plan === "free" ? `
                <p>Con tu plan gratuito puedes:</p>
                <ul>
                  <li>Crear hasta 3 grupos</li>
                  <li>Hasta 10 participantes por grupo</li>
                  <li>2 listas de deseos</li>
                </ul>
                <p>¿Quieres más? Actualiza a Premium para acceso ilimitado.</p>
                <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/pricing" class="button">Ver Planes Premium</a>
              ` : `
                <p>¡Disfruta de todas las funciones premium!</p>
                <ul>
                  <li>Grupos ilimitados</li>
                  <li>Participantes ilimitados</li>
                  <li>Listas de deseos ilimitadas</li>
                  <li>Sugerencias con IA</li>
                </ul>
                <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/dashboard" class="button">Ir al Dashboard</a>
              `}
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Felices regalos!<br>El equipo de GiftApp</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GiftApp. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: "GiftApp <onboarding@resend.dev>",
      to: [email],
      subject: plan === "free" ? "¡Bienvenido a GiftApp! 🎁" : "¡Bienvenido a GiftApp Premium! 👑",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
