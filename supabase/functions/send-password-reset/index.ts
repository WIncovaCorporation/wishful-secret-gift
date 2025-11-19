import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const allowedOrigins = [
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    console.log("Generating password reset link for:", email);

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate password recovery link using Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://d1e5732b-571d-479b-b2b4-be0895c674d9.lovableproject.com'}/update-password`,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      throw new Error(`Failed to generate recovery link: ${linkError.message}`);
    }

    if (!linkData.properties?.action_link) {
      throw new Error("Recovery link not generated");
    }

    const resetLink = linkData.properties.action_link;
    console.log("Recovery link generated successfully");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GiftApp <onboarding@resend.dev>",
        to: [email],
        subject: "Recupera tu contraseña - GiftApp",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Recupera tu contraseña</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎁 GiftApp</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: bold;">Recupera tu contraseña</h2>
                          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                            Recibimos una solicitud para restablecer la contraseña de tu cuenta de GiftApp.
                          </p>
                          <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                            Haz clic en el botón de abajo para crear una nueva contraseña:
                          </p>
                          
                          <!-- Button -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 10px 0 30px 0;">
                                <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(255, 107, 107, 0.3);">
                                  Restablecer Contraseña
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                            O copia y pega este enlace en tu navegador:
                          </p>
                          <p style="margin: 0 0 30px 0; padding: 12px; background-color: #f8f8f8; border-radius: 6px; color: #333333; font-size: 13px; word-break: break-all;">
                            ${resetLink}
                          </p>
                          
                          <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px; line-height: 1.6;">
                            <strong>Este enlace expirará en 1 hora.</strong>
                          </p>
                          <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                            Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #eeeeee;">
                          <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                            © 2025 GiftApp. Todos los derechos reservados.
                          </p>
                          <p style="margin: 0; color: #999999; font-size: 12px;">
                            La mejor forma de organizar tus regalos perfectos
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
