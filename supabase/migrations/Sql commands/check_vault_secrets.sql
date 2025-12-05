-- Check what secrets exist in the vault
SELECT name, description
FROM vault.decrypted_secrets
ORDER BY name;
