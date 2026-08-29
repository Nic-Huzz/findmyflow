// Run: node scripts/register-oauth-client.js YOUR_SERVICE_ROLE_KEY
const key = process.argv[2]
if (!key) { console.log('Usage: node scripts/register-oauth-client.js YOUR_SERVICE_ROLE_KEY'); process.exit(1) }

fetch('https://qlwfcfypnoptsocdpxuv.supabase.co/auth/v1/admin/oauth/clients', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + key,
    'apikey': key,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Claude',
    redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
    client_type: 'public',
    token_endpoint_auth_method: 'none',
  }),
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(e => console.error(e))
