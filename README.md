# 📋 Job Tracker — Déploiement Docker + Cloudflare Tunnel

## Prérequis
- Docker Desktop installé (WSL2 backend activé)
- Un compte Cloudflare gratuit
- Un domaine chez Cloudflare **OU** utiliser un sous-domaine via Cloudflare Zero Trust (gratuit)

---

## Étape 1 — Préparer les fichiers dans WSL

```bash
# Dans ton terminal WSL (DESKTOP-FRED ou CT-CKQHQ13)
cd ~
git clone <ton-repo> job-tracker   # OU copie les fichiers directement
cd job-tracker
```

---

## Étape 2 — Créer le tunnel Cloudflare

### 2a. Compte Cloudflare Zero Trust (gratuit, pas besoin de domaine propre)

1. Va sur https://one.dash.cloudflare.com
2. Connecte-toi / crée un compte gratuit
3. Dans le menu gauche : **Networks → Tunnels**
4. Clique **"Create a tunnel"**
5. Choisis **"Cloudflared"** → donne un nom ex: `job-tracker`
6. Sur l'écran suivant, choisis **"Docker"** → copie la commande, elle contient ton token :
   ```
   docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJ...LONGTOKENICI
   ```
7. **Copie uniquement le token** (la partie après `--token`)

### 2b. Configurer le Public Hostname dans Cloudflare

Toujours dans l'interface du tunnel :
- **Public Hostname** : 
  - Subdomain : `candidatures`
  - Domain : ton domaine (ex: `fred.workers.dev` ou ton propre domaine)
  - → URL finale : `https://candidatures.tondomain.com`
- **Service** :
  - Type : `HTTP`
  - URL : `job-tracker:80`  ← nom du container Docker, pas localhost !

---

## Étape 3 — Configurer le .env

```bash
# Dans le dossier job-tracker
nano .env
```

Remplace `ton_token_ici` par le token copié à l'étape 2a :
```
TUNNEL_TOKEN=eyJhIjoiM...TOKENCOMPLET
```

---

## Étape 4 — Lancer

```bash
# Build + démarrage en arrière-plan
docker compose up -d --build

# Vérifier que tout tourne
docker compose ps

# Voir les logs (optionnel)
docker compose logs -f
```

Ton app est maintenant accessible sur `https://candidatures.tondomain.com` 🎉

---

## Accès local (bonus)

Le port 3030 est aussi exposé localement :
```
http://localhost:3030
```

---

## Commandes utiles

```bash
# Arrêter
docker compose down

# Redémarrer après modif du code
docker compose up -d --build

# Voir les logs en live
docker compose logs -f cloudflared
docker compose logs -f job-tracker

# Mettre à jour l'image cloudflared
docker compose pull cloudflared
```

---

## Persistance des données

Les données sont sauvegardées dans le **localStorage** du navigateur.
Pour ne pas perdre tes candidatures :
- Utilise toujours le même navigateur sur le même appareil
- **Export JSON** depuis l'interface avant de vider le cache
- Réimporte avec **Import JSON** sur un autre appareil

---

## Structure du projet

```
job-tracker/
├── src/
│   ├── App.jsx          # Composant principal
│   └── main.jsx         # Entry point React
├── index.html           # HTML template
├── package.json         # Dépendances Node
├── vite.config.js       # Config Vite (build)
├── Dockerfile           # Multi-stage : build + nginx
├── nginx.conf           # Config Nginx SPA
├── docker-compose.yml   # App + Cloudflare Tunnel
├── .env                 # Token Cloudflare (ne pas committer)
└── .gitignore
```
