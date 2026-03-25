const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE_URL = "https://api.igdb.com/v4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required secret: ${key}`);
  return value;
};

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const clientId = getEnv("IGDB_TWITCH_CLIENT_ID");
  const clientSecret = getEnv("IGDB_TWITCH_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitch token request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + (payload.expires_in ?? 0) * 1000;

  if (!cachedToken) throw new Error("Twitch token response missing access_token");
  return cachedToken;
};

const ALLOWED_ENDPOINTS = new Set(["games", "game_time_to_beats"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { endpoint, query } = await req.json();

    if (typeof endpoint !== "string" || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid payload. Expected { endpoint, query }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Endpoint not allowed: ${endpoint}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = getEnv("IGDB_TWITCH_CLIENT_ID");
    const token = await getAccessToken();

    const igdbResponse = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body: query,
    });

    const text = await igdbResponse.text();

    if (!igdbResponse.ok) {
      return new Response(
        JSON.stringify({ error: `IGDB request failed (${igdbResponse.status})`, details: text }),
        { status: igdbResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
