import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const allowedOrigins = [
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    group_id: string;
    giver_id: string;
    receiver_id: string;
    message: string;
    created_at: string;
  };
  schema: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    const { record } = payload;

    // Get receiver's profile and email
    const { data: receiverData, error: receiverError } = await supabaseClient
      .from('profiles')
      .select('display_name, user_id')
      .eq('user_id', record.receiver_id)
      .single();

    if (receiverError) {
      console.error('Error fetching receiver profile:', receiverError);
      throw receiverError;
    }

    // Get receiver's email from auth.users (using service role key)
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(
      record.receiver_id
    );

    if (userError || !user?.email) {
      console.error('Error fetching receiver email:', userError);
      throw new Error('Could not fetch receiver email');
    }

    // Get group name and notification mode
    const { data: groupData, error: groupError } = await supabaseClient
      .from('groups')
      .select('name, notification_mode')
      .eq('id', record.group_id)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      throw groupError;
    }

    const groupName = groupData?.name || 'Amigo Secreto';
    const notificationMode = groupData?.notification_mode || 'private';

    // Get recipients based on notification mode
    let recipients: string[] = [];
    
    if (notificationMode === 'group') {
      // Get all group members
      const { data: memberData, error: memberError } = await supabaseClient
        .from('group_members')
        .select('user_id')
        .eq('group_id', record.group_id);

      if (memberError) {
        console.error('Error fetching group members:', memberError);
        throw memberError;
      }

      // Get emails for all members
      const memberIds = memberData?.map((m: any) => m.user_id) || [];
      for (const memberId of memberIds) {
        const { data: { user: memberUser }, error: memberUserError } = await supabaseClient.auth.admin.getUserById(memberId);
        if (!memberUserError && memberUser?.email) {
          recipients.push(memberUser.email);
        }
      }
    } else {
      // Only notify receiver (private mode)
      recipients = [user.email];
    }

    // Send email notification using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Customize email content based on notification mode
    const emailSubject = notificationMode === 'group' 
      ? `🎁 ¡Nuevo mensaje anónimo en "${groupName}"!`
      : `🎁 Mensaje de tu Amigo Secreto en "${groupName}"`;
    
    const emailGreeting = notificationMode === 'group'
      ? `<h2 style="margin-top: 0; color: #667eea;">¡Hola!</h2>
         <p>Hay un nuevo mensaje anónimo en el grupo <strong>"${groupName}"</strong>.</p>`
      : `<h2 style="margin-top: 0; color: #667eea;">¡Hola ${receiverData.display_name}!</h2>
         <p>Tu <strong>Amigo Secreto</strong> del grupo <strong>"${groupName}"</strong> te ha enviado un mensaje anónimo.</p>`;

    const messagePreview = notificationMode === 'group'
      ? `<p style="color: #718096; font-size: 14px; font-style: italic;">
           "Un amigo secreto está compartiendo algo especial... 🎁"
         </p>`
      : `<div class="message-box">
           <strong>💬 Mensaje:</strong>
           <p style="margin: 8px 0 0 0;">"${record.message}"</p>
         </div>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              padding: 30px;
              color: white;
            }
            .content {
              background: white;
              border-radius: 8px;
              padding: 24px;
              margin-top: 20px;
              color: #333;
            }
            .message-box {
              background: #f7fafc;
              border-left: 4px solid #667eea;
              padding: 16px;
              margin: 16px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 16px;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              margin-top: 24px;
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
            }
            .emoji {
              font-size: 48px;
              text-align: center;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="margin: 0; font-size: 24px;">🎁 Mensaje de tu Amigo Secreto</h1>
            
            <div class="content">
              <div class="emoji">🎅</div>
              
              ${emailGreeting}
              
              ${messagePreview}
              
              <p style="color: #718096; font-size: 14px;">
                <strong>💡 Tip:</strong> ${notificationMode === 'group' ? 'Revisa tu chat anónimo para ver si tienes mensajes nuevos.' : 'Tu Amigo Secreto quiere asegurarse de darte el regalo perfecto. Responde sus preguntas para ayudarle a elegir algo que realmente te guste.'}
              </p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://giftapp.lovable.app'}/dashboard" class="button">
                  Ver Mensaje y Responder
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              
              <p style="font-size: 13px; color: #718096;">
                <strong>🔒 Privacidad garantizada:</strong> No sabrás quién te envió este mensaje hasta el día del intercambio. 
                La magia del Amigo Secreto está en la sorpresa. 🎁
              </p>
            </div>
            
            <div class="footer">
              <p>Givlyn - Haciendo que regalar sea mágico otra vez ✨</p>
              <p style="margin-top: 8px; font-size: 11px;">
                Un producto de Wincova Corporation<br />
                2615 Medical Center Parkway, Suite 1560, Murfreesboro, TN 37129
              </p>
              <p style="margin-top: 8px;">
                Este es un mensaje automático. Por favor no respondas a este email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'GiftApp <notifications@resend.dev>',
        to: recipients,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        emailId: emailResult.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in notify-anonymous-message function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
