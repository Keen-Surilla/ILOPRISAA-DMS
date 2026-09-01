import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL")!; // e.g. http://localhost:5173 or your deployed domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token parameter" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Verify caller is authenticated with user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: corsHeaders,
      });
    }


    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: invite, error: inviteError } = await adminClient
      .from("invites")
      .select("id, email, role, status, expires_at, invited_by, institution_id")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      console.error("Invite lookup error:", inviteError);
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (invite.invited_by !== user.id) {
      return new Response(JSON.stringify({ error: "You did not create this invite" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (invite.status !== "pending") {
      return new Response(JSON.stringify({ error: `Invite is already ${invite.status}` }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invite has expired" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    const { error: sendError } = await adminClient.auth.admin.inviteUserByEmail(invite.email, {
      data: {
        role: invite.role,
        institution_id: invite.institution_id,
      },
      redirectTo: `${SITE_URL}/accept-invite?token=${token}`,
    });

    if (sendError) {
      console.error("Email send error:", sendError);
      return new Response(JSON.stringify({ error: `Failed to send email: ${sendError.message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Send invite email error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});