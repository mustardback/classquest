# ⚔️ ClassQuest

A gamified achievement tracker for elementary classrooms. Students become adventurers, earn badges by completing quests, and unlock power-ups along the way.

**Live App**: [classquest-app-c8dbe.web.app](https://classquest-app-c8dbe.web.app)

---

## Features

- 🏰 **Guild Hall** — Class-wide view showing all students as adventurer cards with levels and XP bars
- 🦸 **Hero Profiles** — Individual student pages with badge collections, XP progress, and active power-ups
- 🎖️ **Achievement System** — Teacher defines badges with XP values, categories, and optional power-ups
- ⚡ **Power-Ups** — Achievements can grant real-world rewards ("free letter in spelling bee", "+5 on next quiz")
- 🎨 **Avatar Builder** — Customizable chibi avatars with skin tone, hair, outfits, and accessories
- 🎉 **Celebrations** — Confetti animations when achievements are awarded
- 📢 **Live Ticker** — Real-time feed of recent achievements on the Guild Hall
- 🔐 **Teacher Auth** — Google sign-in or email/password to protect admin functions

---

## User Guide

### For Teachers

#### Getting Started
1. Visit the app URL
2. Click **🔐 Teacher Login** → Sign in with Google
3. Click **🗝️ Quest Master** to access the admin panel

#### Managing Students
1. Go to Quest Master → **👥 Students** tab
2. Click **+ Add Student**
3. Enter the student's name
4. Build their avatar (skin tone, hair, outfit, accessories)
5. Click **Save Adventurer**

#### Creating Achievements
1. Go to Quest Master → **🎖️ Achievements** tab
2. Click **+ Add Achievement**
3. Fill in:
   - **Name**: e.g. "Dragon's Quiz"
   - **Icon**: Pick an emoji (🐉, ⭐, 📚, etc.)
   - **Description**: What the student did to earn it
   - **XP Value**: How many experience points it's worth
   - **Category**: Academic, Behavior, Social, Effort, or Special
   - **Power-Up** (optional): A real-world reward, e.g. "+5 points on next quiz"
4. Click **Save Achievement**

#### Awarding Achievements
1. Go to Quest Master → **🎁 Award** tab
2. Select one or more students (or click "Select All")
3. Select the achievement to award
4. Click **⚔️ Award!**
5. Students receive XP and any associated power-ups

#### Using Power-Ups
When a student wants to redeem a power-up:
1. Click on the student's card in the Guild Hall
2. Find the power-up in their **⚡ Active Power-Ups** section
3. Click **✓ Use** to mark it as redeemed

#### Revoking Achievements
If an achievement was awarded by mistake:
1. Click on the student's card in the Guild Hall
2. Find the badge in their **🏆 Quest Log**
3. Click **✕ Revoke** — XP will be deducted automatically

#### Class Settings
1. Go to Quest Master → **⚙️ Settings** tab
2. Set your class name (displayed on the Guild Hall header)

---

### For Display (Smartboard/Projector)
- Open the Guild Hall view on a classroom screen
- It updates in real-time as achievements are awarded
- The ticker at the top shows recent achievements
- No login needed for the read-only view

---

### Leveling System

Students earn XP from achievements and level up automatically:

| Level | Title | XP Required |
|-------|-------|-------------|
| 0 | Villager | 0 |
| 1 | Apprentice | 100 |
| 2 | Scout | 250 |
| 3 | Knight | 500 |
| 4 | Hero | 1,000 |
| 5 | Legend | 2,000 |
| 6 | Mythic | 4,000 |

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google + Email/Password)
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions (auto-deploys on push to main)
- **Font**: Fredoka

---

## Development

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (already configured in `.firebaserc`)

### Local Development
```bash
# Clone the repo
git clone https://github.com/mustardback/classquest.git
cd classquest

# Serve locally
firebase serve --only hosting
```

### Deploying
Pushes to `main` auto-deploy via GitHub Actions. To deploy manually:
```bash
firebase deploy --only hosting
```

### Project Structure
```
classquest/
├── public/
│   ├── index.html      # Main app HTML
│   ├── style.css       # All styles
│   └── app.js          # Application logic + Firebase SDK
├── firebase.json       # Firebase hosting config
├── firestore.rules     # Database security rules
├── firestore.indexes.json
└── .github/workflows/  # Auto-deploy on push
```

---

## Security

- **Read access**: Public (anyone with the URL can view the Guild Hall and student profiles)
- **Write access**: Authenticated users only (teacher must be signed in)
- Power-up redemption and achievement revocation require teacher auth
- No student PII beyond first names — no emails, grades, or IDs stored

---

## License

MIT
