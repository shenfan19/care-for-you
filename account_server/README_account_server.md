# Account and cloud save server

A small reference server for the optional account and cloud save. The game works fully without it. When `account.server_url` is empty, no account screens appear.

## What it does

- Sign in with an email code. No passwords are stored.
- Sign-up requires the user to confirm they are of age and agree to the privacy note. The time, the policy version and the age confirmation are stored with the account.
- The save is encrypted on the player's device with a passphrase the player chooses, using PBKDF2 and AES-GCM. The server stores ciphertext only. A lost passphrase cannot be recovered.
- The server stores the hash of the email, never the email, a consent record and one encrypted save.
- The player can delete the account and all cloud data at any time.

## Run it

```
cd account_server
PORT=8787 DATA_DIR=./data ORIGIN=https://your-frontend-domain MAIL_WEBHOOK=https://your-mail-service node server.js
```

- `MAIL_WEBHOOK` receives a JSON `{ to, subject, text }` for each login code. Connect it to any mail provider. Without it the server refuses to send codes. `DEV=1` prints the code to the console instead, for local trials only.
- There are no dependencies. Node 18 or newer.
- Put it behind HTTPS. A small DigitalOcean droplet is enough. The session table and rate limits are in memory, so a restart signs everyone out.
- Point the game at it in Settings, Advanced: `account.enabled = true` and `account.server_url`.

## Before you open it to the public

This page is not legal advice. Before running it for real users:

- Finish the data protection impact assessment and write the privacy notice. See the privacy design document.
- Decide where the server runs. Users in different regions can have different rules on where their data may be stored and what consent is needed.
- Set up the breach response process, including who is contacted and within what time.
- Check the mail provider's terms and retention.
- The login rate limit and size limits here are basic. Add monitoring and backups of the data folder.

Tests: `node frontend/tests/account_test.js`.
