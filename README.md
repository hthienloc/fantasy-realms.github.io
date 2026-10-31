# Fantasy Realms & Greek Legends – Score Calculator

Score calculator web application for **Fantasy Realms** and the standalone expansion **Fantasy Realms: Greek Legends**, optimized for fast scoring with a responsive sidebar and real-time calculation.

Live Demo:
- **Greek Legends**: [https://hthienloc.github.io/fantasy-realms.github.io/greek.html](https://hthienloc.github.io/fantasy-realms.github.io/greek.html)
- **Classic Fantasy Realms**: [https://hthienloc.github.io/fantasy-realms.github.io/index.html](https://hthienloc.github.io/fantasy-realms.github.io/index.html)

---

## Features (Greek Legends)

- **Search & Accordion Sidebar**: Fast filtering by card name, suit, or tag (Divine, Warrior, Aquatic, etc.).
- **Hand vs. Afterlife Separation**: Supports 7 hand cards and arbitrary afterlife cards with exact rulebook penalty scoring (`−10 pts` per card in afterlife).
- **1-Click Card Migration**: Easily move cards between Hand and Afterlife (`[☠ Afterlife]` / `[✋ Hand]`).
- **Full Scoring Engine**:
  - Implements the 5-step Endgame scoring order (masking bonuses, penalties, added tags, and Omega phase effects).
  - Handles auto-optimization for targeted cards (Athena, Moly, Charmed Bridle, Chiron, etc.).
- **URL Sharing**: Automatically synchronizes your current hand and afterlife in the URL query string (`?hand=...&afterlife=...`).

---

## Local Development & Running

No build tools required (pure HTML/CSS/JS).

### Run with Python:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000/greek.html` in your browser.

### Run with Node:
```bash
npx serve .
```

---

## License & Credits

- Game Design: Bruce Glassco, © WizKids / NECA LLC.
- Based on the community Fantasy Realms scoring app by Jimmy Praet.
