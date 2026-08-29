import { Hono } from "hono";

// Supabase Auth handler for OAuth flow
// Users log in with their existing Supabase account via email OTP code
// After verification, we get their user_id and complete the OAuth authorization

const SUPABASE_URL = "https://qlwfcfypnoptsocdpxuv.supabase.co";

type Env = {
  OAUTH_PROVIDER: any;
  SUPABASE_ANON_KEY: string;
  COOKIE_ENCRYPTION_KEY: string;
  OAUTH_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

// /authorize — show email input form (step 1)
app.get("/authorize", async (c) => {
  // Parse the OAuth request using the provider's parser
  // This validates client_id, redirect_uri, PKCE, etc. and returns an AuthRequest
  const oauthReq = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  if (!oauthReq) {
    return c.json({ error: "Invalid OAuth request" }, 400);
  }

  // Store the parsed AuthRequest in KV
  const stateKey = crypto.randomUUID();
  await c.env.OAUTH_KV.put(
    `auth_state:${stateKey}`,
    JSON.stringify(oauthReq),
    { expirationTtl: 600 }
  );

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connect to Find My Flow</title>
      <style>
        body { font-family: -apple-system, sans-serif; background: #f5f5f0; margin: 0; padding: 2rem; }
        .container { max-width: 400px; margin: 4rem auto; text-align: center; }
        h2 { color: #1a1a1a; margin-bottom: 0.5rem; }
        p { color: #666; margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1rem; text-align: left; }
        label { display: block; font-size: 0.85rem; color: #444; margin-bottom: 0.3rem; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #5e17eb; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 0.5rem; }
        button:hover { background: #4c12c0; }
        button:disabled { background: #aaa; cursor: not-allowed; }
        .error { color: #e53e3e; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
        .success { color: #38a169; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
        .info { background: #f0edf9; border-radius: 8px; padding: 0.75rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: #5e17eb; }
        .hidden { display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🧠</div>
        <h2>Connect to Find My Flow</h2>
        <p>Log in with your Find My Flow account</p>
        <div class="info">Your AI assistant wants to track your progress, skills, and patterns.</div>

        <!-- Step 1: Email -->
        <div id="step1">
          <form id="emailForm">
            <input type="hidden" name="state" value="${stateKey}" />
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" id="emailInput" required placeholder="you@example.com" />
            </div>
            <div class="error" id="emailError"></div>
            <button type="submit" id="sendBtn">Send verification code</button>
          </form>
        </div>

        <!-- Step 2: Code -->
        <div id="step2" class="hidden">
          <div class="success" id="codeSent" style="display:block;">Code sent! Check your email.</div>
          <form id="codeForm">
            <div class="form-group">
              <label>Verification code</label>
              <input type="text" name="code" id="codeInput" required placeholder="123456" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" />
            </div>
            <div class="error" id="codeError"></div>
            <button type="submit" id="verifyBtn">Verify and Connect</button>
          </form>
        </div>
      </div>
      <script>
        const state = '${stateKey}';
        let email = '';

        document.getElementById('emailForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          email = document.getElementById('emailInput').value;
          const errorEl = document.getElementById('emailError');
          const btn = document.getElementById('sendBtn');
          btn.disabled = true;
          btn.textContent = 'Sending...';
          errorEl.style.display = 'none';

          try {
            const resp = await fetch('/send-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, state })
            });
            if (resp.ok) {
              document.getElementById('step1').classList.add('hidden');
              document.getElementById('step2').classList.remove('hidden');
            } else {
              const err = await resp.json().catch(() => ({}));
              errorEl.textContent = err.error || 'Failed to send code';
              errorEl.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Send verification code';
            }
          } catch {
            errorEl.textContent = 'Connection error';
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Send verification code';
          }
        });

        document.getElementById('codeForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const code = document.getElementById('codeInput').value;
          const errorEl = document.getElementById('codeError');
          const btn = document.getElementById('verifyBtn');
          btn.disabled = true;
          btn.textContent = 'Verifying...';
          errorEl.style.display = 'none';

          try {
            const resp = await fetch('/verify-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, code, state })
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.redirect) window.location.href = data.redirect;
            } else {
              const err = await resp.json().catch(() => ({}));
              errorEl.textContent = err.error + (err.debug ? ' | Debug: ' + JSON.stringify(err.debug) : '');
              errorEl.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Verify and Connect';
            }
          } catch {
            errorEl.textContent = 'Connection error';
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Verify and Connect';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// /send-code — send OTP code via Supabase
app.post("/send-code", async (c) => {
  const { email, state } = await c.req.json();

  // Verify state exists
  const oauthReqStr = await c.env.OAUTH_KV.get(`auth_state:${state}`);
  if (!oauthReqStr) {
    return c.json({ error: "Session expired. Please try again." }, 400);
  }

  // Send OTP via Supabase
  const otpResp = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: c.env.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email }),
  });

  if (!otpResp.ok) {
    const err = await otpResp.json().catch(() => ({}));
    return c.json(
      { error: (err as any).msg || "Failed to send code" },
      400
    );
  }

  // Store email with the state for verification step
  await c.env.OAUTH_KV.put(
    `auth_email:${state}`,
    email,
    { expirationTtl: 600 }
  );

  return c.json({ ok: true });
});

// /verify-code — verify OTP and complete authorization
app.post("/verify-code", async (c) => {
  const { email, code, state } = await c.req.json();

  // Retrieve the original OAuth request info
  const oauthReqStr = await c.env.OAUTH_KV.get(`auth_state:${state}`);
  if (!oauthReqStr) {
    return c.json({ error: "Session expired. Please try again." }, 400);
  }

  // Verify OTP with Supabase
  const otpVerifyResp = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: c.env.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      token: code,
      type: "email",
    }),
  });

  if (!otpVerifyResp.ok) {
    const errText = await otpVerifyResp.text().catch(() => "");
    let errMsg = "Invalid or expired code";
    try {
      const errObj = JSON.parse(errText);
      errMsg = errObj.msg || errObj.error_description || errMsg;
    } catch {}
    return c.json({ error: errMsg, debug: { status: otpVerifyResp.status, body: errText.substring(0, 200) } }, 401);
  }

  const authText = await otpVerifyResp.text();
  let authData: any;
  try {
    authData = JSON.parse(authText);
  } catch {
    return c.json({ error: "Unexpected response from auth server", debug: authText.substring(0, 200) }, 500);
  }

  const userId = authData.user?.id;
  const userEmail = authData.user?.email;

  if (!userId) {
    return c.json({ error: "Could not verify identity", debug: JSON.stringify(authData).substring(0, 300) }, 500);
  }

  // Generate an API key for this user (or retrieve existing one)
  let apiKey = "";
  try {
    // Check if user already has an active API key
    const existingKeyResp = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_api_keys?user_id=eq.${userId}&is_active=eq.true&select=key_prefix&limit=1`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${authData.access_token}`,
        },
      }
    );
    const existingKeys: any = await existingKeyResp.json().catch(() => []);

    if (existingKeys.length > 0) {
      // User has an existing key — we can't retrieve the raw key,
      // but we store the access_token from Supabase as the prop
      // The Worker will use the access_token to auth with Supabase MCP
      apiKey = authData.access_token;
    } else {
      // Use the Supabase access token directly
      apiKey = authData.access_token;
    }
  } catch (err) {
    // Fallback: use access token
    apiKey = authData.access_token;
  }

  // Clean up
  await c.env.OAUTH_KV.delete(`auth_state:${state}`);
  await c.env.OAUTH_KV.delete(`auth_email:${state}`);

  // Complete the OAuth authorization
  try {
    const oauthReq = JSON.parse(oauthReqStr);
    console.log("Completing authorization with params:", JSON.stringify(oauthReq));
    const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
      request: oauthReq,
      userId: userId,
      metadata: {
        label: userEmail,
      },
      scope: oauthReq.scope || "mcp:tools",
      props: {
        userId: userId,
        email: userEmail,
        accessToken: apiKey,
      },
    });

    return c.json({ redirect: redirectTo });
  } catch (err: any) {
    console.error("completeAuthorization error:", err?.message || err);
    return c.json(
      { error: `Authorization failed: ${err?.message || "Unknown error"}. Please try again.` },
      500
    );
  }
});

export const SupabaseAuthHandler = app;
