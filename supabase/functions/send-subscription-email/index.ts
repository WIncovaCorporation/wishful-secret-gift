import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Resend from "https://esm.sh/resend@3.2.0";

const allowedOrigins = [
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

interface SubscriptionEmailRequest {
  email: string;
  name?: string;
  type: "confirmed" | "payment_failed" | "cancelled" | "renewed";
  plan?: string;
  nextBillingDate?: string;
  amount?: number;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

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

    const resend = new Resend.Resend(resendApiKey);
    const { email, name, type, plan, nextBillingDate, amount }: SubscriptionEmailRequest = await req.json();

    let subject = "";
    let content = "";

    switch (type) {
      case "confirmed":
        subject = "✅ Suscripción confirmada - Givlyn Premium";
        content = `
          <p>Hola ${name || ""}!</p>
          <p>Tu suscripción a <strong>${plan}</strong> ha sido confirmada exitosamente.</p>
          <p><strong>Monto:</strong> $${amount} MXN</p>
          <p><strong>Próxima fecha de cobro:</strong> ${nextBillingDate}</p>
          <p>Ya puedes disfrutar de todas las funciones premium de Givlyn.</p>
          <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Ir al Dashboard</a>
        `;
        break;

      case "payment_failed":
        subject = "⚠️ Pago fallido - Givlyn";
        content = `
          <p>Hola ${name || ""}!</p>
          <p>Intentamos procesar tu pago de suscripción pero no fue exitoso.</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Monto:</strong> $${amount} MXN</p>
          <p>Por favor verifica tu método de pago y actualiza la información si es necesario.</p>
          <p>Si no actualizas tu información de pago, tu suscripción será cancelada automáticamente.</p>
          <a href="https://billing.stripe.com/p/login/test_placeholder" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Actualizar Método de Pago</a>
        `;
        break;

      case "cancelled":
        subject = "😢 Suscripción cancelada - Givlyn";
        content = `
          <p>Hola ${name || ""}!</p>
          <p>Tu suscripción a <strong>${plan}</strong> ha sido cancelada.</p>
          <p>Lamentamos verte partir. Tu cuenta ha sido revertida al plan gratuito con límites reducidos.</p>
          <p><strong>Plan Gratuito incluye:</strong></p>
          <ul>
            <li>Hasta 3 grupos</li>
            <li>Hasta 10 participantes por grupo</li>
            <li>2 listas de deseos</li>
          </ul>
          <p>Si cambias de opinión, siempre puedes volver a suscribirte.</p>
          <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/pricing" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Ver Planes Premium</a>
        `;
        break;

      case "renewed":
        subject = "✨ Suscripción renovada - Givlyn Premium";
        content = `
          <p>Hola ${name || ""}!</p>
          <p>Tu suscripción a <strong>${plan}</strong> ha sido renovada exitosamente.</p>
          <p><strong>Monto:</strong> $${amount} MXN</p>
          <p><strong>Próxima fecha de cobro:</strong> ${nextBillingDate}</p>
          <p>Gracias por seguir confiando en Givlyn.</p>
        `;
        break;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Givlyn Premium 👑</h1>
            </div>
            <div class="content">
              ${content}
              
              <p style="margin-top: 30px; color: #666; font-size: 12px;">Si tienes preguntas, contáctanos en support@givlyn.com</p>
              <p style="margin-top: 10px; color: #999; font-size: 11px;">Un producto de Wincova Corporation</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Wincova Corporation. Todos los derechos reservados.</p>
              <p style="font-size: 11px; color: #999; margin-top: 10px;">
                2615 Medical Center Parkway, Suite 1560, Murfreesboro, TN 37129
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: "Givlyn <hello@givlyn.com>",
      to: [email],
      subject: subject,
      html: emailHtml,
    });

    console.log(`Subscription email (${type}) sent successfully:`, result);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending subscription email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
