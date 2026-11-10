# 🏀 Basket Stats Pro

Application web mobile **Progressive Web App (PWA)** ultra-réactive conçue pour les parents afin de suivre au bord du terrain les statistiques de leurs enfants (matchs en direct et séances d'entraînement aux shoots), utilisable **100% hors-ligne**.

Les calculs et les exports sont **strictement conformes au modèle officiel** (21 colonnes A à U de la feuille de match).

---

## ✨ Fonctionnalités Clés

### 1. 🏀 Saisie Live du Match (Bord de terrain)
- **Ergonomie tactile mobile** : Gros boutons tactiles pour les pouces, retour haptique (vibrations) et bouton **Annuler (Undo)** en cas de fausse manipulation.
- **Temps de présence terrain** : Chronomètre intégré (bouton Play/Pause "En jeu / Sur le banc") avec ajustement rapide en minutes.
- **Métriques en direct** : Points, Quick Score, Catégorie de performance, Évaluation et Valeur Ajoutée mis à jour à chaque clic.
- **Sécurité anti-panne (Auto-save)** : Sauvegarde instantanée de chaque action dans la mémoire locale de l'appareil (zéro perte en cas de fermeture ou batterie faible).

### 2. 🎯 Entraînement : Suivi des Séances de Shoots (Shooting Tracker)
- **Ateliers configurables** : Lancers Francs, Tirs Mi-distance (corners, ailes, axe), 3 Points, Séries libres.
- **Saisie ultra-rapide au panier** : Deux boutons géants `RÉUSSI` (vert) et `RATÉ` (rouge).
- **Taux de réussite en temps réel (%)** avec jauge de couleur dynamique et compteur de tirs réussis d'affilée (Streak 🔥).
- **Historique des séances** : Suivi de l'évolution de l'adresse dans le temps.

### 3. 👥 Multi-Joueurs (Gestion de Fratries)
- Possibilité d'enregistrer plusieurs enfants (ex: *Quentin en U15*, *Lucas en U11*...).
- Sélecteur rapide en haut d'écran pour basculer d'un joueur à l'autre en un clic.
- Données, saisons et historiques strictement cloisonnés par joueur.

### 4. 📊 Bilan & Export Excel Officiel (.xlsx)
- Moyennes de la saison (Points/m, Quick Score/m, Temps de jeu/m, % victoires équipe).
- **Export Excel en 1 clic** : Génération directe d'un fichier `.xlsx` reprenant les **21 colonnes exactes (A à U)** de votre tableur de suivi (avec une feuille par saison).
- Sauvegarde et restauration complète au format JSON pour transférer ses données d'un téléphone à un autre.

---

## 📐 Les Formules du Modèle

| Colonne | Nom | Formule |
| :--- | :--- | :--- |
| **G** | **Points** | $(2PT \times 2) + (3PT \times 3) + FT$ |
| **F** | **% min** | $\text{Minutes Jouées} / \text{Durée Match (40 min)}$ |
| **H** | **% points** | $\text{Points Joueur} / \text{Score Équipe}$ |
| **I** | **Valeur Ajoutée** | $\text{ROUND}\left( \frac{\frac{\text{Points}}{\text{Score Équipe} / 5}}{\frac{\text{Minutes}}{40}} \times 100 \right)$ |
| **S** | **Efficiency** | $\text{Points} + \text{Reb(Tot)} + \text{AST} + \text{STL} + \text{DEF} - \text{PF}$ |
| **T** | **Quick Score** | $\text{Points} + \text{Reb(Tot)} + 2 \times (\text{AST} + \text{STL} + \text{DEF}) - \text{PF}$ |
| **U** | **Catégorie** | $\le 10$ 🔴 Faible \| $11\text{-}20$ 🟡 Moyen \| $21\text{-}30$ 🟢 Bon \| $31\text{-}40$ 🟢 Très bon \| $> 40$ ⭐ Excellent |

---

## 📲 Comment Installer l'Application sur Smartphone (PWA)

L'application ne nécessite aucun téléchargement sur l'App Store ou le Play Store :

### Sur iPhone (Safari)
1. Ouvrez le lien web de l'application dans **Safari**.
2. Appuyez sur le bouton **Partager** (icône rectangle avec une flèche vers le haut).
3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**.
4. L'application apparaît comme une vraie application sur votre écran d'accueil et fonctionne **100% hors-ligne** au gymnase !

### Sur Android (Chrome)
1. Ouvrez le lien web dans **Google Chrome**.
2. Appuyez sur le menu (les 3 petits points verticaux en haut à droite).
3. Sélectionnez **"Installer l'application"** (ou "Ajouter à l'écran d'accueil").

---

## 🛠️ Démarrage Local & Développement

Ce projet utilise [Bun](https://bun.sh/) et [Vite](https://vite.dev/) avec React et Tailwind CSS.

```bash
# 1. Cloner le dépôt
git clone https://github.com/tougai/basket-stats.git
cd basket-stats

# 2. Installer les dépendances
bun install

# 3. Lancer le serveur de développement local
bun run dev

# 4. Compiler pour la production
bun run build
```

---

## 🚀 Déploiement Gratuit sur GitHub Pages

Un fichier de workflow [GitHub Actions](.github/workflows/deploy.yml) est déjà configuré à la racine du projet :

1. Créez un dépôt public sur GitHub (ex: `basket-stats`).
2. Poussez votre code local :
   ```bash
   git init
   git add .
   git commit -m "feat: initial release v1"
   git branch -M main
   git remote add origin git@github.com:tougai/basket-stats.git
   git push -u origin main
   ```
3. Sur GitHub, rendez-vous dans **Settings** > **Pages** :
   - Sous **Build and deployment** > **Source**, sélectionnez **GitHub Actions**.
4. Votre application sera automatiquement accessible à l'adresse :  
   `https://tougai.github.io/basket-stats/`
