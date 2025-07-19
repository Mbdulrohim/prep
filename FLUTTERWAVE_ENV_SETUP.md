# Environment Variables for Flutterwave Integration

## Flutterwave Configuration

# Public key (safe to expose in client-side code)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-a8fabea2d377d97dccf31ed9766d643a-X

# Secret key (server-side only, keep secure)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-3a63d8465476b934adeb87961d3c7ab7-X

# Encryption key (server-side only, for webhook verification)
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTee296a174f9c

# Webhook secret hash (for webhook verification)
FLUTTERWAVE_SECRET_HASH=your-webhook-secret-hash

# App URL (for redirects and webhook callbacks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

## Notes:
1. The keys provided are test keys. Replace with live keys for production.
2. Never commit secret keys to version control.
3. Set FLUTTERWAVE_SECRET_HASH in your webhook settings on Flutterwave dashboard.
4. Make sure to update the webhook URL in Flutterwave dashboard to: https://yourdomain.com/api/webhook/flutterwave
