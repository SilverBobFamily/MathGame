# Mathemagic Backlog

Format: `- [ ] FEATURE_TITLE — acceptance: WHAT_MUST_BE_TRUE_TO_CALL_IT_DONE`
Order matters — top is next. Mark `[x]` to skip. Add new items anytime.

## Next up
- [x] Player Stats Page (#3) — acceptance: dedicated profile section shows total games played, win rate, avg winning/losing margin, longest win streak, most-played card, most-played release, and favorite deck
- [x] AI Difficulty Levels (#5) — acceptance: game setup offers Easy / Normal / Hard / Expert; Easy makes deliberate suboptimal plays; Normal is current behavior; Hard looks ahead for the highest-value play; Expert uses deeper search; difficulty label is visible throughout the game
- [x] Daily Quests (#7) — acceptance: 3 quests per player per day drawn from a pool of 20+ quest types; completing a quest awards XP; resets at midnight UTC; progress is visible on profile or home screen
- [ ] Daily Puzzle (#14) — acceptance: a curated board state is shown daily; player submits their predicted optimal card play; answer revealed with math breakdown and XP reward; same puzzle for all players each day, resets at midnight
- [ ] Campaign / Story Mode (#29) — acceptance: at least 10 scripted single-player encounters with named AI opponents, narrative blurbs, deck constraints, and XP + badge rewards; organized into at least 2 themed arcs; first arc is fully playable end-to-end

## Later
- [ ] Push / Email Notifications (#4) — acceptance: players opt in to browser push and/or email notifications when it's their turn in an async online game; configurable in settings
- [ ] Friends List (#12) — acceptance: players can search by username and send friend requests; accepted friends appear with online status; from the list you can challenge a friend to a game
- [ ] Advanced Math Operations — acceptance: at least 2 new operator types beyond ×/÷ are playable (e.g. squaring, square root, exponents, percentages); new operators appear on item or action cards; all new math is appropriate for ages 10–12; the score breakdown panel correctly explains each new operation
- [ ] Math Learning Focus — acceptance: the game has at least one dedicated mode or persistent feature that explicitly teaches math skills — e.g. step-by-step score reveal that names each operation, "predict the score" challenge before the final tally, or curriculum-aligned hints; feature is accessible without being disruptive to competitive play
- [ ] Alternative Art Packs — acceptance: players can browse and purchase alt-art unlocks for releases they own, using coins; each alt-art pack covers all cards in one release rendered in a distinct visual style (e.g. Mythology cards redrawn in a kid-with-crayon style); purchasing only changes card art, not stats; alt art is shown in hand, on field, and in the deck builder
- [ ] Win Streaks (#9) — acceptance: current consecutive-win streak and all-time best streak displayed on profile and post-game screen; streak milestones (3, 5, 10, 25) award achievements; flame icon beside username in online lobbies when streak ≥ 3
- [ ] Ranked Mode (#11) — acceptance: separate matchmaking queue with ELO ratings; rank displayed as a tier name + icon on profile and in lobbies; season end preserves highest rank as a badge; at least 5 rank tiers defined
- [ ] Deck Sharing / Community Decks (#13) — acceptance: any saved deck can be made public with a description; public decks are browseable by release and card type; any player can import a public deck with one click; admin-featured decks appear at the top

---

## Feature Ideas (Ranked by Priority)

Ranked by impact × effort ROI. Features that punch above their weight come first.

### Tier S — Build These First
*Foundation features. See Done section for what's already shipped.*

**3. Player Stats Page**
A dedicated profile section showing your lifetime game history in aggregate: total games played, win rate, average winning margin, average losing margin, longest win streak, most-played card, most-played release, and favorite deck. Charts could show your win rate over time or score distribution across games. This feature costs relatively little to build (all data already exists in the `games` table) but has an outsized effect on retention — players who can see their own numbers feel invested in improving them, and revisiting the stats page becomes a habit that keeps them in the app.

**4. Push / Email Notifications**
Since online games are asynchronous — you play your turn, then wait for your opponent — there's no natural signal to bring you back when it's your move. This feature adds a notification layer: when your opponent plays their card, you receive a push notification (browser/PWA) and optionally an email saying "Your turn in your game against [username]." Players opt in during onboarding or from settings, and can configure which events trigger notifications. Without this, async multiplayer quietly dies because players forget they have a game in progress; with it, games complete in hours instead of days.

**5. AI Difficulty Levels**
Currently the AI plays a single fixed strategy. Adding difficulty tiers — Easy, Normal, Hard, Expert — dramatically extends the solo game's lifespan. Easy AI makes deliberate mistakes (plays creatures on the wrong side, misses multiplier opportunities) to let beginners win occasionally. Normal is the current behavior. Hard looks one move ahead to find the highest-value play. Expert uses a simple minimax search to anticipate your likely response and plays accordingly. Each difficulty is clearly labeled in the game setup screen, and completing your first Hard win awards an achievement — giving players a ladder to climb.

---

### Tier A — High Impact, Build Soon
*Social hooks and daily engagement drivers.*

**7. Daily Quests**
Each day, players receive 3 randomly assigned quests from a pool — things like "play 5 Action cards," "win a game with only R2 cards in your deck," or "defeat an opponent by 20+ points." Completing a quest awards XP and contributes to a weekly progress bar. Quests reset at midnight UTC, and a streak bonus multiplies XP for players who complete at least one quest every day. The quest pool is large enough that repetition is rare, and quests are tiered by difficulty so there's always an easy one for casual players and a challenge one for engaged ones. This is the single biggest lever for daily active users — players log in to check their quests the way they check a morning puzzle.

**9. Win Streaks**
A simple running counter of consecutive wins displayed on your profile and in the post-game screen. Your current streak and all-time best streak are both tracked. A flame icon beside your username in online lobbies signals an active hot streak to opponents. Streak milestones (3, 5, 10, 25) trigger achievement unlocks and bonus XP awards. Breaking your streak resets the counter but surfaces your best-ever streak prominently so the loss doesn't feel permanent. This feature takes minimal engineering effort but exploits a powerful psychological mechanic — players will play one more game to protect a streak they've built, which is exactly the retention behavior you want.

**10. Advanced Math Operations**
The current card set uses addition/subtraction (Items) and multiplication/division (Actions). Introducing more complex operations opens a natural progression path for players who've mastered the basics — appropriate for ages 10–12. Candidates include squaring (a creature's value is raised to the power of 2), square root (replaces a value with its integer square root — works cleanly on perfect squares like 4, 9, 16, 25, 36), and percentage modifiers (increase or decrease a value by a given percent). These could arrive as new card subtypes within existing releases or as a distinct set of "Advanced" cards. The game engine and score-breakdown panel would need to handle and explain each new operation. The educational upside is significant: squaring and roots are core middle-school topics, and seeing them applied in a game context gives them concrete meaning.

**11. Ranked Mode**
A separate matchmaking queue distinct from casual play, with ELO ratings that go up on wins and down on losses. Your rank is displayed as a tier name and icon (e.g., Bronze Calculator → Silver Summoner → Gold Arithmancer → Platinum Prodigy → Diamond Grand Wizard) that appears on your profile and beside your name in ranked lobbies. The existing leaderboard surface already shows rankings; ranked mode gives those numbers real stakes. At the end of each season, your highest rank achieved is preserved as a badge, and you're soft-reset to a lower tier to keep competition fresh. Ranked mode gives the leaderboard meaning and gives competitive players a structured ladder to climb — essential for long-term engagement once you have enough active users to sustain queue times.

**12. Friends List**
Players can search for other users by username and send friend requests. Accepted friends appear on a friends list showing their online status (online, in a game, offline) and their current rank. From the friends list you can challenge a friend directly to a casual or ranked game, which sends them a notification. Optionally, you can see a friend-filtered leaderboard showing only your friends' ranks so competition feels personal. The social graph also powers future features like spectating friends' games and sharing decks. Adding friends is the most direct way to transform a game from a solo activity into a shared one — players who have friends on a platform retain at dramatically higher rates.

**13. Deck Sharing / Community Decks**
When saving a deck in the deck builder, players can choose to make it public and give it a description. Public decks appear in a community browse page searchable by release, card type composition, and player rating. Viewers can preview the full card list and import the deck directly into their own collection with one click. Featured decks curated by admins appear at the top. This extends the deck builder from a personal tool into a social content platform — experienced players become content creators, new players have proven decks to learn from, and the community develops a shared meta conversation about which decks are strong.

**14. Daily Puzzle**
Each day, a curated board state is presented: "Given this hand and this field configuration, what single card play maximizes your score?" Players submit their answer and see whether they found the optimal play, with a math breakdown explaining why it was correct. A global scoreboard shows how many players got it right and the average answer. The puzzle resets daily and completing it awards XP. This feature is uniquely well-suited to Mathemagic — the math-based scoring makes "optimal play" objectively calculable, which most card games can't claim. It also extends the tutorial's teaching mission into an ongoing daily habit, reinforcing math skills through repeated low-stakes practice.

**15. In-Game Chat (Emoji / Quick Phrases)**
During an online game, each player has access to a small palette of contextual reactions — a thumbs up, a surprised face, a "nice move" message, a "gg" — displayed as a speech bubble beside their avatar for a few seconds. No free-text input (avoiding moderation complexity), just a curated set of ~12 options that cover the emotional range of a game: excitement, acknowledgment, bluffing, friendly trash talk. These reactions appear in real time via Supabase Realtime alongside the existing game state sync. A mute button lets you disable your opponent's reactions if you find them distracting. This tiny feature makes online games feel like you're playing with a human rather than a ghost — the social warmth of knowing your opponent is reacting.

---

### Tier B — Solid Features, Do After Foundation
*Depth and variety once the core loop is solid.*

**16. Alternative Art Packs**
Players can unlock alternative art styles for cards they already own, purchased with coins from the in-game shop. Each alt-art pack covers all cards in one release, rendered in a completely different visual style — for example, the Mythology release redrawn in a kid-with-crayon style, or the Sports release done in a manga-inspired look. Purchasing an alt-art pack changes how those cards appear everywhere in the game (hand, field, deck builder, collection browser) but has no effect on card stats or gameplay. Players can own multiple alt-art styles for the same release and switch between them in settings. This gives coins a meaningful luxury-spend destination beyond packs, gives artists a creative showcase, and gives collectors a visible expression of personality — all without touching competitive integrity.

**17. Math Learning Focus**
A suite of features that make Mathemagic deliberately educational rather than incidentally so. Candidates include: a step-by-step score reveal that pauses on each operation and names it ("Item +8 means we add 8 to Medusa's base of 12, giving 20…"); a "predict the score" challenge before the final tally where players type their expected totals; a curriculum-alignment indicator on each card's detail page (e.g., "This card practices multiplication — Common Core 4.NBT.B.5"); and a classroom-friendly export of a student's game history as a printable math worksheet. These features can be toggled on by a teacher or parent without disrupting the normal game experience. The payoff is that Mathemagic becomes genuinely defensible as an educational tool — something a school can recommend, not just something kids play because it's fun.

**18. Game Replays**
After every completed game, both players can access a full move-by-move replay showing every card played in sequence, the board state after each play, and the running score at each step. The replay UI uses the same game board component as the live game, with a scrubber to jump to any turn and prev/next buttons to step through. Replays are stored alongside the game record in Supabase and are accessible from the "My Games" history page. Beyond nostalgia, replays are a genuine learning tool — seeing where a game turned is how players improve — and they're shareable as a URL, which opens a content and virality loop.

**19. Speed Mode (Turn Timer)**
An optional game variant where each player has a countdown timer per turn — configurable at game creation to 30, 60, or 90 seconds. When your timer runs out, the game automatically plays a random card from your hand. The timer is displayed prominently in the player's zone and pulses red in the final 10 seconds. Speed mode solves two problems: it prevents online games from stalling when an opponent goes inactive, and it creates a genuinely different play experience that rewards pattern recognition and gut instinct over deliberate calculation. It pairs naturally with ranked mode as a variant queue and adds tournament potential for timed formats.

**20. Card Collection Tracking**
The card browser gains a "collection" layer — cards you've played in a completed game are marked as "seen" with a subtle indicator. A progress bar on each release page shows how many of that release's 30 cards you've encountered. Completing a full release marks it with a gold seal. This transforms the card browser from a reference tool into a collectible checklist, borrowing the "gotta catch 'em all" compulsion that makes collecting so compelling. It costs nothing in terms of new game mechanics — you're simply logging which cards appear in games — but adds a persistent goal that keeps players playing more games to fill out their collection.

**21. New Releases**
The game already has a rich library of themed releases. Continuing to expand the card pool keeps the meta evolving, gives deck builders new options, and gives collectors new targets. Each new release follows the existing 30-card formula (14 Creature · 8 Item · 6 Action · 2 Event) and can introduce new Event effects to keep gameplay fresh. New themes with strong visual potential (e.g., Ancient Egypt, Fantasy/Dragons, Fairy Tales) or educational angles (e.g., Famous Scientists, World Capitals) pair naturally with the game's tone. The art generation and release pipeline is already well established, making new releases primarily a curation and content effort. Regular new releases are the most reliable long-term engagement lever — they give the whole community something to discuss and look forward to.

**22. Weekly Missions**
Longer-horizon challenges that span 7 days and require more sustained effort than daily quests — things like "win 10 games this week," "play 50 Event cards across all your games," or "complete 5 games using only a single release in your deck." Weekly missions award significantly more XP than daily quests and unlock cosmetic rewards on completion. They reset every Monday and you can have 1–2 active at a time. Weekly missions create a mid-term goal between the short dopamine loop of daily quests and the long grind of the leveling system — players who are lapsing mid-week feel pulled back by an incomplete weekly mission they don't want to abandon.

**23. Seasonal System**
Every 4–6 weeks, a new competitive season begins with a theme. At season start, ranked ratings are soft-reset, a new seasonal quest track activates, and a limited-time cosmetic reward (card back, avatar frame, title) is dangled at the end. At season end, your peak rank earns you a permanent seasonal badge. Seasons give the entire feature ecosystem a pulse — they create urgency around ranked play, make daily quests feel connected to a larger narrative, and give lapsed players a natural re-engagement hook ("a new season just started"). They're also low-effort to run once the infrastructure exists, since the main variable is the cosmetic reward and seasonal theme.

**24. Score Prediction Challenge**
At the end of each game, before the final score is revealed, both players are shown the full board state and asked to enter their predicted final scores for each side. Points are awarded for accuracy — exact match earns maximum bonus XP, within 5 earns partial, wildly wrong earns nothing. The reveal is then animated with a satisfying tick-up of the real score alongside your prediction. This feature is uniquely suited to Mathemagic because the scoring is deterministic and math-based — you can actually calculate the exact right answer if you're skilled. It doubles as a stealth math exercise and gives every game a fun interactive ending moment rather than just a result screen.

**25. Card Favorites / Wishlist**
A star icon on every card in the browser and on card detail modals lets players mark cards as favorites. The favorites list is accessible as a filter in the card browser and as a quick-reference panel in the deck builder. A secondary "wishlist" tab tracks cards you want to encounter (for collection completion purposes). These are small UX additions that make the card browser feel personalized rather than encyclopedic — players who can curate their own view of the card pool spend more time in the browser, and more time in the browser means more engagement with the game's depth.

**26. Deck Import / Export Codes**
Any saved deck can be exported as a short alphanumeric code that encodes the full card list. Pasting a code into the deck builder imports it, replacing the current deck. Codes are copy-pasteable and work across accounts, making it trivial to share decks in Discord, Reddit, or chat. This costs almost nothing to implement (a simple encoding/decoding of card IDs) but unlocks an entire content ecosystem — streamers share codes, community forums post deck lists, friends copy each other's builds. It's the lowest-effort feature with the highest potential virality of any item on this list.

**27. Animations & Sound Effects**
Card play animations (cards slide from hand onto the field with a satisfying thud), score tick-up sounds when points are counted, a win fanfare at game over, a subtle ambient loop during play, and distinct audio cues for each card type (a creature roar, an item chime, an action swoosh, an event thunderclap). Visual particle effects for dramatic events like ×100 or Banish. These are polish features that don't change any mechanic but dramatically change how the game *feels* — the difference between a functional prototype and a game you want to keep playing. Sound especially is underappreciated: games with audio feel more alive than silent ones even when nothing else changes.

---

### Tier C — Worth Building, More Effort or More Niche

**28. Draft Mode**
Instead of pre-building a deck, both players draft one simultaneously: a pool of ~40 random cards is generated, and players alternate picking one card at a time until each has 20, then set aside 4 as normal. Picks happen on a dedicated draft screen before the game begins. This format removes the deck-building barrier for new players (no curation required) while adding a new skill axis for experienced ones (evaluating cards in context rather than in isolation). It also naturally balances matchups since both players build from the same pool. Draft would function as its own game mode selectable at game creation, with a separate ranked queue eventually.

**29. Campaign / Story Mode**
A series of 30+ scripted single-player encounters, each with a named AI opponent, a themed narrative (e.g., battle the Minotaur in the Greek Mythology arc), a specific deck constraint (opponent plays only R1 cards, you must defeat them by 15+ points), and a story blurb before and after each match. Completing a chapter rewards XP and a badge. Campaigns are organized into "arcs" corresponding to each release theme, with a boss encounter at the end of each arc featuring a harder AI and a bigger reward. This is a significant content authoring commitment, but it solves a real problem: there's currently no sense of narrative progression for solo players, just endless games against a faceless AI.

**30. AI Move Explanations**
After the AI plays its card on Hard or Expert difficulty, a brief tooltip appears explaining the reasoning: "The AI played ×5 on Medusa (+8) to maximize your side's total — this moved your score from +18 to +48." On a learning difficulty setting, explanations appear after every move. This makes the AI a teaching tool rather than just an obstacle — players understand why they lost and can learn from it. The explanation logic is already implicit in the AI's decision-making code; this feature is largely about surfacing that reasoning in human-readable form. It's especially valuable for the educational audience and for casual players who want to improve without studying strategy guides.

**31. Card Synergies / Combos**
Some cards gain bonus effects when played alongside specific other cards — for example, a Creature called "Apollo" might have a rule: "If Zeus is on your side of the field, this card's value is doubled." Synergies are noted in the card's effect text, and the math breakdown panel highlights active synergies with a special color. This adds a deck-building dimension that doesn't exist today — currently any card can go in any deck with equal effectiveness, but synergies would reward players who build thematically coherent decks. It requires extending the card schema and game engine to evaluate synergy conditions, making it a meaningful technical lift, but the payoff is a dramatically deeper strategic layer.

**32. Meta Report**
A weekly auto-generated page (or admin-published post) showing aggregate statistics from all games played that week: most-played cards, highest win-rate cards, most common deck archetypes, average game score, longest win streaks, and top 10 players by games played. Data is presented in tables and simple charts. The meta report gives engaged players something to read and discuss between games, drives deck-building decisions, creates a community conversation about balance, and signals to players that the game has an active, thriving player base. It requires enough game volume to be statistically meaningful, which is why it's in Tier C rather than higher.

**33. Public Card Ratings & Comments**
On each card's detail page in the browser, players can rate the card 1–5 stars and leave a short strategy note (max 280 characters, no replies, light moderation via flagging). The average rating is displayed on the card. A "top comments" section shows the 3 highest-upvoted notes. This turns the card browser into a living community resource rather than a static database. New players learn strategy and experienced players contribute knowledge. The main cost is moderation infrastructure, which is why it's not higher — user-generated text content always carries a moderation burden that pure game features don't.

**34. Handicap Mode**
When creating a game, the stronger player (or either player by agreement) can choose to start with a negative score offset — e.g., "I'll start at −10" — to level the playing field for a parent/child game or a veteran vs. beginner matchup. The handicap is visible to both players throughout the game and factored into the final score calculation. A recommended handicap can be suggested by the system based on the ELO difference between players. Handicap mode makes the game genuinely playable across skill gaps, which matters especially for the family audience.

**35. Tournaments / Brackets**
An admin or player can create a tournament with a name, entry deadline, format (single elimination, double elimination, round robin), and bracket size (4, 8, or 16 players). Players register by joining via a code or open invite. Once the deadline passes, the bracket is auto-generated and seeded by rank. Each round's matches are played as normal online games, with results automatically advancing winners. The tournament bracket page is public and updates in real time. Tournaments create appointment gaming — everyone knows the bracket, everyone knows when they play — and generate the kind of community excitement that organic daily play never quite achieves.

**36. Spectator Mode**
Any online game in progress can be joined as a spectator via a shareable URL. Spectators see the full board state including both hands (since they're not playing) with a brief delay (e.g., 10 seconds) to prevent leaking information to a player who's also watching. The spectator count is visible to players. Spectator mode enables streaming, coaching, and community watch parties around tournament games. It requires relatively little new infrastructure on top of the existing Supabase Realtime game state sync — you're essentially creating a read-only subscriber to the same channel — but it transforms the game from a private 1-on-1 experience into a spectator sport.

**37. Sealed / Limited Format**
Each player is given a random pool of 30 cards drawn from the selected releases, then has 5 minutes to build the best 20-card deck from that pool (setting 4 aside as normal). Neither player chooses their pool in advance — it's randomly generated at game creation. This format emphasizes adaptability and card evaluation over deck-crafting expertise, leveling the playing field between deck-building veterans and newcomers. It also surfaces cards that rarely see play in optimized constructed decks, giving the full card pool more relevance. Sealed pairs naturally with draft as a sister format and would share much of the same UI infrastructure.

---

### Tier D — Ambitious, Do Later

**38. Battle Pass**
A seasonal track of 50 tiers, each rewarding a cosmetic item (card backs, board themes, avatar frames, XP boosts) when reached. Half the rewards are on the free track; the other half require purchasing the premium pass for a flat seasonal fee. XP earned from games, quests, and achievements all contribute to battle pass tier progression. The pass expires at season end — unused tiers are forfeited, creating urgency. This is the most monetization-forward feature on the list and carries real design risk: if the premium rewards feel necessary rather than optional, it damages the game's reputation as a fair competition. Done right (purely cosmetic, no power), it's a sustainable revenue stream; done wrong, it's the thing players complain about most.

**39. Card Rarity Tiers**
Cards are assigned rarity levels — Common, Uncommon, Rare, Legendary — affecting their visual treatment (border glow, foil shimmer for Legendary), their frequency in random/draft pools, and their prominence in the collection tracker. Rarity is purely cosmetic if all cards are equally accessible in deck building; it becomes a power consideration if rare cards have stronger effects. For Mathemagic, the cleanest implementation would assign rarity based on card strength (high-value creatures and ×100 events are Legendary) without restricting access — rarity signals power level, not exclusivity.

**40. Prestige System**
After reaching the maximum player level, players can "prestige" — resetting their XP to zero in exchange for a permanent prestige badge, a unique title, a special avatar frame, and a modest permanent XP multiplier for future progression. Players can prestige multiple times, with each prestige level adding a numeral to their badge (Prestige I, II, III, etc.). The prestige icon is displayed prominently beside their username everywhere in the app. This extends the leveling system's lifespan indefinitely for dedicated players and creates an aspirational status symbol that signals veteran status.

**41. Card Mastery**
Each card in the game tracks how many times you've played it across all your games. Reaching mastery thresholds (10, 50, 100 plays) unlocks increasingly elaborate visual treatments for that card when it appears in your hand or on the field — a subtle glow, then a border shimmer, then a foil effect at max mastery. A mastery page shows your top 10 most-played cards with their mastery level. This creates a "main" culture familiar from MOBAs and fighting games — players develop identity around specific cards they've mastered, making their collection feel personal rather than fungible.

**42. Card Backs / Board Themes / Avatar Frames**
Cosmetic customization that lets players personalize their game experience without affecting gameplay. Card backs replace the default card reverse face with themed designs. Board themes change the table texture, zone backgrounds, and divider styling. Avatar frames are decorative rings around your profile photo. All three are earned through achievements, seasons, or the battle pass — never random, never pay-to-win. The value here is personal expression and status signaling: a rare cosmetic tells other players you've been around and accomplished something, which reinforces prestige without touching the game's competitive integrity.

**43. Custom Player Titles**
Players can earn and equip a short text flair displayed under their username in games, lobbies, and on their profile — things like "The Multiplier," "Chaos Agent," "Sudden Death Survivor," "R3 Loyalist," or "1000 Games Played." Titles are earned through specific achievements (the tutorial rewards "Graduate," winning 50 ranked games earns "Ranked Veteran," completing every release's collection earns "Completionist"). The equipped title is always visible to opponents, making it a social status signal. A veteran with "Sudden Death Survivor ×3" has an instant story to tell.

**44. Blitz Weekend Tournament**
A recurring structured event: every Friday a bracket opens for registration, Saturday games are played, and Sunday results are published with a leaderboard. Registration is free, bracket size caps at 32, and seeding is by current ELO. The winning player earns a seasonal badge and a featured spot on the homepage. Unlike manually created tournaments, Blitz is automated — it runs the same way every weekend with no admin intervention once the system is set up. The regularity is the feature: players know every Saturday there's a real tournament happening, which creates appointment gaming and a weekly community rhythm. Requires enough active players to fill brackets consistently.

**45. Creator Decks / Featured Decks**
Admins can tag specific public decks as "Featured," making them appear at the top of the community deck browser with a special badge and the creator's name and avatar. A "Creator" designation can be applied to specific accounts (top-ranked players, community contributors) allowing them to publish to a curated creator feed. Featured decks include a short write-up from the creator explaining the strategy. This creates a content creator layer above the normal community — aspirational players to follow, builds to learn from, personalities to root for in tournaments.

**46. Card of the Day**
The home screen features a randomly selected (or admin-curated) card each day with its full art, stats, and a short community-sourced strategy tip. Players can click through to the card browser to see the full card, and a "play a game featuring this card" button pre-filters the deck builder to include it. The card of the day rotates at midnight and is the same for all players simultaneously, creating a shared daily touchpoint — players in the community discuss the featured card, share opinions about its strength, and some will build around it for the day.

**47. School / Classroom Mode**
A teacher creates a private lobby with a join code distributed to students. The classroom lobby shows a live leaderboard visible only to that class (no global stats), a teacher dashboard tracking each student's games played and scores, and an option to lock deck selection to a specific release. Games played in classroom mode award XP and appear in the student's regular profile. This is a genuinely different product surface — the teacher dashboard and class management layer are non-trivial to build — but the payoff is a B2B education market where schools adopt the game as a math practice tool, which is a qualitatively different growth vector than consumer virality.

**48. Shareable Game Summary Image**
At the end of every game, a dynamically generated recap image is available to download or share — showing the final score, both players' names, the MVP card (highest individual contributor to the winning score), a "key moment" highlight (the single card play that most changed the game's trajectory), and the Mathemagic logo. The image is sized for social media (1200×630 for Twitter/OG, square for Instagram). Players sharing these images after wins is a significant organic marketing channel — every share exposes the game to the winner's social graph with a concrete, interesting result.

**49. Twitch / Streaming Integration**
A public spectator URL for any in-progress game that non-players can open without logging in, optimized for screen capture with a clean "broadcast mode" layout (no menus, larger cards, animated score counter, player names prominently displayed). An optional stream overlay widget provides a transparent-background game state display that streamers can layer over their face cam in OBS. If a game is marked as "streamable" by the player, it appears on a public "Live Games" page. This feature is low priority until the game has an audience large enough to sustain streaming, but building it before that audience exists means you're ready when they arrive.

**50. Team Mode (2v2)**
Four players split into two teams of two, each pair sharing a score pool. Teammates alternate turns within a team. Each player has their own hand but can see their teammate's field contributions. Team chat is available between teammates. This mode requires significant game engine changes to support 4-player state, making it the most technically complex game mode on the list. The payoff is a genuinely new social dynamic — couples, siblings, and friend groups can play together rather than against each other.

**51. Mirror Match**
A novelty game mode where both players are dealt the same randomly-generated deck of 20 cards, set aside the same 4, and draw from identical remaining 16-card decks. Since both players have access to the same cards, the outcome is determined entirely by tactical card placement decisions. All deck-building advantage is eliminated. Mirror match is easy to implement (generate one deck, duplicate it) and creates a genuinely interesting format that competitive players enjoy as a pure skill test, but it's niche enough that it doesn't need to be prioritized early.

**52. Card Trading**
Players can offer one of their collected cards to another player in exchange for a card from that player's collection. Trade offers are sent via the friend system, accepted or declined, and completed atomically. A trading post page shows open offers. The obvious risk is abuse — botting to farm cards, manipulating new players into bad trades — which requires rate limiting, trade history transparency, and possibly a "fair trade" warning when values are significantly mismatched. When card ownership and rarity systems are fully in place, trading adds a social-economic layer that deepens community bonds, but it's the most complex feature on this list to implement safely.

**53. QR Code for Physical Cards**
Each card in the database has a unique QR code that, when scanned with a phone, opens the card's detail page in the browser and marks it as "collected" in your account. Physical card packs (printed via the existing printable export system) would include these codes on the card back or in a separate insert. This bridges the physical and digital products — someone who buys a physical card pack gets to add those cards to their digital collection too. It's a small feature in terms of code but it unlocks a physical product business model that's entirely separate from the digital game.

**54. Mobile App (PWA / Native)**
A Progressive Web App configuration (manifest.json, service worker, offline support) lets users "install" Mathemagic on their phone's home screen and play with a near-native experience. A full native app (React Native or Expo) goes further, enabling push notifications via APNs/FCM, a proper app store presence, and deeper OS integration. The web game is already mobile-responsive, so PWA is relatively low effort and provides immediate value. True native is a significant parallel codebase investment. Given that card games are naturally well-suited to mobile, this is eventually a high-priority feature — it's in Tier D only because the web experience should be fully polished first.

---

## Future Platform: iOS / Android via React Native Web

**Approach:** Migrate the UI layer to React Native Web — a single React Native codebase that compiles to both the existing Next.js web app and native iOS/Android apps via Expo. The pure-TypeScript game logic (`GameEngine.ts`, `ai.ts`, `deck.ts`) ports unchanged. All Supabase calls work identically. Only the UI layer needs to be rewritten: swap HTML elements for React Native primitives (`View`, `Text`, `Pressable`, `Image`, `FlatList`), replace inline CSS with `StyleSheet.create()`, and replace CSS-based layout with Flexbox via RN's layout system.

**Scope estimate:**
- Game logic + Supabase: 0 days (already portable)
- UI rewrite (all screens, GameBoard, cards): ~4–6 weeks
- Expo/EAS build setup + App Store submission: ~1 week
- Total: ~5–7 weeks of focused effort

**Why not Capacitor/Ionic:** Capacitor wraps the existing web app in a WebView — faster, but you get a web-feel app with no native performance gains. React Native Web produces genuinely native components, which matters for App Store quality standards and feel.

**Prerequisites:** Web experience should be fully polished and stable first. The rewrite is a significant parallel effort — do not start until the web version has real users and the feature set is reasonably complete.

---

## Done

- [x] Dark mode toggle — respects system preference, persists in localStorage, no flash on load
- [x] Sound effects toggle in settings — persists across sessions, default on
- [x] Card Ownership Model — all players start owning every card from R1–R5; custom deck builder only shows owned cards; card packs draw exclusively from unowned cards in active releases
- [x] XP / Leveling System (#2) — XP awarded after every completed game, level displayed on profile, tier titles unlock at milestones
- [x] Leaderboard (#6) — global rankings page, shows your own rank even outside top 50, filterable by time period
- [x] Card Packs — Coin Purchase (#8) — coins earned each game, pack shop with animated card reveal, same-release and random-release packs
- [x] Achievements / Badges (#10) — 20+ achievements defined, unlocked badges on profile grid, locked ones shown as silhouettes, XP awarded on unlock
- [x] Interactive Tutorial (#1) — scripted first game walks through all 4 card types, awards XP and Graduate badge on completion
