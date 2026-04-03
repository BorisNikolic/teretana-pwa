import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  const json = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  try {
    const body = await req.json().catch(() => ({}))
    const email = body.email
    if (!email) return json({ error: "Email required" }, 400)

    // supabase-js sends the user JWT as Authorization: Bearer <token>
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "No auth header" }, 401)

    // Create client with user's JWT to verify they're admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Use service role client but verify the user's JWT
    const adminClient = createClient(supabaseUrl, serviceKey)

    // Verify the JWT token manually
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !user) return json({ error: "Auth: " + (userError?.message || "no user") }, 401)

    // Check admin role
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") return json({ error: "Not admin" }, 403)

    // Invite the user
    const redirectTo = "https://borisnikolic.github.io/teretana-pwa/"
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (error) return json({ error: "Invite: " + error.message }, 400)

    return json({ success: true })
  } catch (e) {
    return json({ error: "Server: " + (e as Error).message }, 500)
  }
})
