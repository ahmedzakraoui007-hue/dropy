# Activer un sous-domaine par boutique (`boutique.dropy.store`)

Le code est prêt : quand `NEXT_PUBLIC_STORE_ROOT_DOMAIN=dropy.store` est défini, chaque boutique est servie sur
`<adresse>.dropy.store` et l'ancienne adresse `dropy.store/<adresse>` redirige (301) vers le sous-domaine.

Vercel ne délivre un certificat HTTPS pour `*.dropy.store` que si le domaine utilise **ses** serveurs DNS.
Aujourd'hui le DNS est chez Hostinger, et les e-mails passent par Hostinger : il faut recopier les enregistrements
ci-dessous dans Vercel **avant** de changer les serveurs DNS, sinon les e-mails s'arrêtent.

## Étape 1 — Vercel : ajouter le domaine joker

Vercel → projet **dropy** → **Settings → Domains** → **Add** → `*.dropy.store` → choisir **Nameservers (recommandé)**.
Vercel affiche alors deux serveurs DNS (en général `ns1.vercel-dns.com` et `ns2.vercel-dns.com`).

## Étape 2 — Vercel : recopier les enregistrements DNS actuels

Vercel → **Domains** (menu du compte) → `dropy.store` → **DNS Records** → ajouter chaque ligne :

| Nom | Type | Valeur | Priorité |
|---|---|---|---|
| (vide / @) | MX | `mx1.hostinger.com` | 5 |
| (vide / @) | MX | `mx2.hostinger.com` | 10 |
| (vide / @) | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | |
| (vide / @) | TXT | `google-site-verification=EQ-zqyQq8shoWsSgqkJE8zFZPEupaa83xAJTyw84w3c` | |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com` | |
| `hostingermail-b._domainkey` | CNAME | `hostingermail-b.dkim.mail.hostinger.com` | |
| `hostingermail-c._domainkey` | CNAME | `hostingermail-c.dkim.mail.hostinger.com` | |
| `_dmarc` | TXT | `v=DMARC1; p=none` | |
| `autodiscover` | CNAME | `autodiscover.mail.hostinger.com` | |
| `autoconfig` | CNAME | `autoconfig.mail.hostinger.com` | |
| `send` | MX | `feedback-smtp.eu-west-1.amazonses.com` | 20 |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` | |
| `resend._domainkey` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa5ssdvhs3yR7d9czRpWybAns15KeiBqNPwZdlvU1sNBGMIXObcKz9L739pTKIN2woV2/XW91shbKAYALdqnZoDrWVdCuRbcYjeIaDxu9yxj9/vP86EUB3xz8ny7g3Q6sifbYKyP+6AUBGarvXXEPHwzcnR68Q/ULR0XAebC1r5wIDAQAB` | |
| `_vercel` | TXT | `vc-domain-verify=dropy.store,338c76547418237174d2` | |

Les enregistrements du site lui-même (`dropy.store`, `www`, `*`) sont créés automatiquement par Vercel.

## Étape 3 — Hostinger : changer les serveurs DNS

Hostinger → **Domaines** → `dropy.store` → **DNS / Serveurs de noms** → **Changer les serveurs de noms** →
remplacer `ns1.dns-parking.com` / `ns2.dns-parking.com` par les deux serveurs donnés par Vercel à l'étape 1.

La propagation prend de quelques minutes à 24 h. Vercel affiche « Valid Configuration » quand c'est fait.

## Étape 4 — Vercel : activer les sous-domaines

Vercel → projet **dropy** → **Settings → Environment Variables** → ajouter
`NEXT_PUBLIC_STORE_ROOT_DOMAIN` = `dropy.store` (Production), puis **Redeploy**.

## Vérifier

- `https://<adresse-boutique>.dropy.store` affiche la boutique, en HTTPS.
- `https://dropy.store/<adresse-boutique>` redirige vers le sous-domaine.
- Un e-mail envoyé à `ahmed@dropy.store` arrive toujours, et l'inscription envoie bien son e-mail de confirmation.

En cas de problème, supprimer la variable `NEXT_PUBLIC_STORE_ROOT_DOMAIN` et redéployer : les boutiques reviennent
à `dropy.store/<adresse>` sans autre changement.
