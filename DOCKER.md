# Synergo - Guide Docker

Ce guide explique comment déployer Synergo avec Docker sur votre NAS ou serveur.

## Prérequis

- Docker installé sur votre machine
- Docker Compose (généralement inclus avec Docker)
- Accès en écriture aux dossiers de données

## Déploiement rapide

### 1. Préparer les dossiers de données

Créez les dossiers qui contiendront vos données persistantes :

```bash
# Sur votre NAS uGreen
mkdir -p /volume1/docker/synergo/data
mkdir -p /volume1/docker/synergo/resources
```

### 2. Configurer l'environnement

Copiez le fichier d'exemple et modifiez-le si nécessaire :

```bash
cp .env.example .env
```

Contenu par défaut du fichier `.env` :

```env
PORT=42001
DATA_PATH=/volume1/docker/synergo/data
RESOURCES_PATH=/volume1/docker/synergo/resources
```

### 3. Construire et démarrer

```bash
# Construire l'image et démarrer le conteneur
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Vérifier que le conteneur fonctionne
docker-compose ps
```

### 4. Accéder à l'application

Ouvrez votre navigateur et allez sur :

```
http://[IP-DE-VOTRE-NAS]:42001
```

## Commandes utiles

### Gestion du conteneur

```bash
# Démarrer le conteneur
docker-compose up -d

# Arrêter le conteneur
docker-compose down

# Redémarrer le conteneur
docker-compose restart

# Voir les logs en temps réel
docker-compose logs -f

# Voir l'état du conteneur
docker-compose ps
```

### Mise à jour de l'application

```bash
# Arrêter le conteneur actuel
docker-compose down

# Récupérer les dernières modifications (si vous avez cloné le repo)
git pull

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Sauvegarde des données

Vos données sont stockées dans les dossiers que vous avez configurés :
- Base de données : `/volume1/docker/synergo/data/synergo.db`
- Médias : `/volume1/docker/synergo/resources/`

Pour sauvegarder :

```bash
# Créer une archive de sauvegarde
tar -czvf synergo-backup-$(date +%Y%m%d).tar.gz \
  /volume1/docker/synergo/data \
  /volume1/docker/synergo/resources
```

## Structure des données

```
/volume1/docker/synergo/
├── data/
│   ├── synergo.db      # Base de données SQLite
│   ├── synergo.db-wal  # Fichier WAL (journal)
│   └── synergo.db-shm  # Fichier de mémoire partagée
└── resources/
    ├── video1.mp4      # Vos fichiers médias
    ├── photo1.jpg
    └── ...
```

## Résolution de problèmes

### Le conteneur ne démarre pas

1. Vérifiez les logs :
   ```bash
   docker-compose logs
   ```

2. Vérifiez que les dossiers existent et ont les bonnes permissions :
   ```bash
   ls -la /volume1/docker/synergo/
   ```

### Erreur de permission sur les fichiers

Si vous avez des erreurs de permission, assurez-vous que les dossiers sont accessibles :

```bash
chmod -R 755 /volume1/docker/synergo/data
chmod -R 755 /volume1/docker/synergo/resources
```

### Le port est déjà utilisé

Modifiez le port dans le fichier `.env` :

```env
PORT=42002
```

Puis redémarrez :

```bash
docker-compose down && docker-compose up -d
```

### Vérifier la santé du conteneur

```bash
# Vérifier le health check
docker inspect --format='{{.State.Health.Status}}' synergo

# Tester l'API manuellement
curl http://localhost:42001/api/health
```

## Migration depuis une installation existante

Si vous avez déjà une installation Synergo et souhaitez migrer vers Docker :

1. **Exporter vos données** depuis l'interface web (Paramètres > Exporter)

2. **Copier vos médias** dans le dossier resources :
   ```bash
   cp -r /chemin/vers/ancien/public/resources/* /volume1/docker/synergo/resources/
   ```

3. **Démarrer le conteneur Docker** (voir instructions ci-dessus)

4. **Importer vos données** depuis l'interface web (Paramètres > Importer)

## Configuration avancée

### Utiliser un reverse proxy (optionnel)

Si vous utilisez Nginx ou Traefik comme reverse proxy, vous pouvez modifier le `docker-compose.yml` pour ne pas exposer le port directement :

```yaml
services:
  synergo:
    # ... autres configurations ...
    # Commentez ou supprimez la section ports
    # ports:
    #   - "${PORT:-42001}:3001"
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
```

### Limiter les ressources

Ajoutez des limites de ressources dans `docker-compose.yml` :

```yaml
services:
  synergo:
    # ... autres configurations ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```
