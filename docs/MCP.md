# Serveur MCP Dropy : créer sa boutique avec Claude

Chaque vendeur peut connecter Claude Desktop (ou tout client MCP) à **sa** boutique et lui demander de la
construire ou de la modifier.

## Connexion (côté vendeur)

1. Ma boutique → **Paramètres** → **Connecter Claude (MCP)** → **Créer une clé de connexion**.
   La clé n'est affichée qu'une fois ; seule son empreinte SHA-256 est stockée (`seller_mcp_tokens`).
2. Claude Desktop → **Paramètres → Connecteurs → Ajouter un connecteur personnalisé** →
   `https://dropy.store/api/mcp/<clé>`.
   Ou, dans `claude_desktop_config.json` :

   ```json
   {
     "mcpServers": {
       "dropy": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://dropy.store/api/mcp", "--header", "Authorization: Bearer <clé>"]
       }
     }
   }
   ```

3. Une clé se révoque depuis la même carte. 5 clés maximum par vendeur.

## Technique

- `POST /api/mcp` (clé dans `Authorization: Bearer`) ou `POST /api/mcp/<clé>` : MCP en HTTP (JSON-RPC 2.0,
  réponses JSON, notifications → 202). Versions de protocole : 2025-06-18, 2025-03-26, 2024-11-05.
- La clé n'agit que sur la boutique de son propriétaire (vendeur approuvé). 120 requêtes / minute / IP.
- Code : `src/lib/mcp-server.ts`.

## Outils

| Outil | Rôle |
|---|---|
| `get_store` / `update_store` | Infos, description, SEO, WhatsApp, livraison, offres par quantité, couleurs |
| `list_themes` / `apply_theme` | Thèmes ; `replace_home` remplace la page d'accueil |
| `list_section_types` | Types de sections et leurs réglages |
| `list_pages` / `get_page` / `update_page` / `create_page` / `delete_page` | Pages et sections |
| `search_catalog` / `import_product` | Catalogue fournisseurs (prix > prix fournisseur) |
| `list_products` / `update_product` | Produits de la boutique |
| `set_online` | Mise en ligne (au moins un produit actif) |
| `list_orders` | Dernières commandes (lecture seule) |

Les entrées sont validées : types de section autorisés uniquement, 30 sections et 150 Ko maximum par page,
couleurs `#RRGGBB`, prix au-dessus du coût fournisseur.
