# Upstox Live API Setup & Production Guide

This guide covers configuring your real Upstox Developer account for live order execution in Auto Trade.

---

## 1. Upstox Developer Console Configuration

1. Visit [Upstox Developer Console](https://upstox.com/developer/).
2. Log in with your real Upstox credentials.
3. Create a New App:
   * **App Name**: Auto Trade
   * **Redirect URI**: 
     - Development: `https://localhost:5001/api/upstox/callback` (or `http://localhost:5000/api/upstox/callback`)
     - Production: `https://your-domain.com/api/upstox/callback`
   * **API Type**: Interactive & Order Placement (API v2)
4. Note down your:
   * **API Key** (`ApiKey`)
   * **API Secret** (`ApiSecret`)

---

## 2. Static Outbound IP Requirements (Production Trading)

For live automated and HFT order placement on Indian exchanges (NSE/BSE):
* Indian exchange regulations require registered public outbound IPs for direct algorithmic/live trading access.
* Upstox requires registering your server's static outbound IP address in the Upstox Developer App console.
* **Production Rule**: Deploy the Auto Trade backend on a cloud VPS (AWS EC2 with Elastic IP, Azure VM with Static Public IP, or DigitalOcean Droplet with Reserved IP).
* Never deploy production live trading on a residential/laptop internet connection where the outbound IP changes dynamically.

---

## 3. Secret Management & Token Security

1. In production, provide credentials via environment variables:
   * `Upstox__ApiKey`
   * `Upstox__ApiSecret`
   * `Upstox__RedirectUri`
   * `Upstox__EncryptionKey` (used by `AesTokenEncryptor` to encrypt tokens at rest)
2. Auto Trade automatically encrypts the live Upstox access token before persisting to the SQL Server `UpstoxConnection` table.
3. Frontend Web and Mobile clients never have access to the access token or client secret.
