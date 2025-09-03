# Updated Logic and elements for simple supabase setup


## Recap

<p>As you know I do not want anything advanced like keeping track of host history or resue profile.<br>
We are making the project simple again then we will upgrade once the core functionalities are working.</p>



### Elements: 
- Host name 
- Host password 
- Session ID 
- Current phase
- Player names
- Roles
- Video presence.

### Pages:
 
1. Homepage 
2. Join (As Host, As Player)
3. Lobby (for participans on phone)
4. Setup (creator on pc)
5. Quiz

`Also I am still unsure about the name "Setup". What do you think is more suitable? I will refer to it as setup in this prompt so you know what I am talking about. but might change it after.`

---

## New information:

### Segments: There are 5 Segments.
 
- List Schema: Full Name; Codename; Default amount of questions; Powerup Button Name; Turn Bell (one button, who clicks first answers, name shown on screen for clarity)

1. What Do You Know; *WDYK* ; 4; none; none
2. Auction; AUCT ; 2; *Al-Habeed* (Locks question for the player who clicks it, other player is not allowed to answer this question at all, required answers amount: at least 40, or more the player chooses a higher amount); none
3. Bell; BELL; 10; *Bellegoal* (Gets to answer first, if answered wrong the question goes to the other player); yes
4. Upside-down (UPDW); 10; *Slippy-G* (Locks question for one player, correct answer adds to point to the player and removes 2 from the other player. wrong question has no effect on points. other player doesn't get to answer this question); yes.
5. Remontada; REMO; 4; none; yes

` I will be using the codename to let you know which segment I refer to in this conversation.`
` Each player gets to use each segment's powerup button only once.`

### Segements rules:

1. WDYK: 
	- The question is open ended until the answers run out or a player gets 3 strikes (mistakes).
	- Player with 3 strikes loses the question. Other player receives points based on point system ( either 1 or 2 )
	- No powerup button
	- Point system:
		- If answers run out, player with the least strikes receives 1 point. 
		- if both had the same amount of strikes they both receive 1 point.
		- If a player (or both) do not have any strikes then the player(s) get 2 points.
	
	- Default Max points possible for each player: 2 x amount of questions (default 4 questions). which means default max points = 8 points
	- Minimum points possible(combined total): 1 x amount of questions (default 4 questions) = 4 points
		- 0 points combined is not possible
		- 0 points for a player is possible

2. AUCT:
	- By far the hardest round to answer + to keep track of.
	- Players bid back and forth on who might know the most amount of questions until one withdraws.
	- Exp: Player A says 20, player b says 22, player A says 30, player B withdraws from bid.
	- Point system: 1-19 answers (1 point), then each 10 interval is an extra point ( 20-29, 30-39, so on). Provided the player answers the amount correctly. 
		- Going over the bid amount doesn't grand extra points. 
		- Penalty: not getting the bid amount will give the other player a point (2 points if the player doesn't answer half of the bid amount).
		- No default max points as this round is very volatile and random.
		- 0 points combined (and for a player) is possible
3. BELL:
	- Simple who answers first questions
	- Powerup button doesn't affect points, reserves first turn only.
	- Max 1 try for each player per question
	- Point system: 1 point for each correct quesition
		- Default Max points: 1 x quesitions amount; 10
		- 0 points combined (and for a player) is possible
4. UPDW:
	- Simialr to BELL, but much harder questions
	- Powerup button does affect points *when answered correctly* and locks question compleltly (only 1 player).
	- Default Max points possible (without powerup): 1 points x 10 questions = 10 points
	- Default Max points possible (with succeful powerup):  ( 1 points x 9 questions = 9 points ) + (2 points x 1 quesion = 2 points ) = 11 Total point
	- In this round a player can lose points!
		- Minimum points possible for a player = -2
		- 0 points combined (and for a player) is possible
		- -2 points points combined (and for a player) is possible
5. REMO:
	- The host reads out a career path.
	- Possible career paths:
		- Active player
		- Retired Player
		- Active Manager
		- Retired Manager
	- The career clubs will be told in order
	- Each player has max 2 guesses ( 2 turn button clicks )
	- Point system:
		- 1 point for a correct answer once the career path is fully said/shown
		- 2 points if correct answer before the path finishes
		- Default Max points possible: 2 x 4 = 8 points
		- 0 points combined (and for a player) is possible
 

### Game State: 

1. pre-quiz
2. Active Session
3. Post-quiz
4. Concluded 
- TBC: Paused, Canceled
- Open to more suggestions.

### Phases:

1. Setup
2. Lobby
3. Full Lobby
4. In-Progress x/5 (0/5, 1/5, 2/5, 3/5, 4/5, 5/5)
5. Tie-Breaker (when needed))
6. Results
7. Review

### Phase and Game State rules:

- **Phases** and **Game State** are intertwined. 

1. **pre-quiz**
	- After the session is created the phase default is **Setup** or **Configuration**. (still have not decided on name, open to suggestions)
	- After the host creates the daily room the phase changes to **Lobby**.
	- Once all participants join; **Full Lobby**.
2. **Active Session**
	- Host starts quiz; **In-Progress segemnt order/5** (0/5, 1/5, 2/5, 3/5, 4/5, 5/5).
	- If the quiz finishes then we will have an extra **UPDW** quesition for phase **Tie Breaker**.
3. **Post-quiz**
	- After all question have been answered, the phase is **Results**, this shows who is the winner (Name and points compared to the other player).
	- After that we can show how many points, wrong, correct questions each player had in total and for each segment in a 2 column table summary (Player A Name Column, Player B Name Column", this phase is **Review**. 
	- The players can talk and laugh and discuss here and the session stays active until everyone leave or the host ends the session.
4. **Concluded**
	- Ending the session does not change phase. but it changes game state to concluded.
 
 
### Participant flows:

<p>Flows for after "pre-quiz" Game State will be configured later</p>

1. Host *Pc* or Controller (or whatever name we decide to choose):  
	- In homepage, the participant clicks **Create Session**
	- Gets prompted to create a Password
	- Then gets redirected to Setup page. 
	- There he is shown a component for the quiz segments and default amount of question. He can change the amount of questions for each segment there. 
	- He creates the Daily room (doesn't join it).
	- He sees the state of the lobby:
		- Information regarding Participants (Name, Role, Connected [yes,no] 
		- daily room and Video (Room name, url, etc). 
		- Session ID, Password, Phase. 
	- Start quiz (redircts all to Quiz page).
	`I am not sure what else there should be in that page. Maybe Add questions and answers? other functions? End session? suggest what I can add to that page.`
	
2. Players *Phone*: 
	- In homepage, the participant clicks Join Session 
	- Gets redirected to page Join with two options (Host, Player).
	- Clicks **Player**
	- Still on the same page but an interface opens
	- This interface prompts player to type their name, then choose a Flag (more info later), and a Team logo (more info later).
	- The interface also shows their role (playerA if first, playerB if second)
	- Player confirms
	- Redirects to Lobby.
	- with suitable role *Player1* or *Player2*. 
	- Sees Daily Room status (if cotroller created ine or not) as "Ready" and "Not Ready".
	- When *Ready* then they click **Join Call**
	- Player's name is used for daily.
	- Flag and logo should be displayed in/near the player'S video when possible.
	- awaits for others to join/quiz to start.
	
3. Host *Phone*: 
	- In homepage, the participant clicks Join Session 
	- Gets redirected to page Join with two options (Host, Player).
	- Clicks **Host**
	- Participant enters session id and host password (or just Password)
	- Joins Lobby, with role *Host* and the Host Name (shown as just Name) that they entered. 
	- Sees Daily Room status (if cotroller created ine or not) as "Ready" and "Not Ready".
	- When *Ready* then they click **Join Call**
	- Hosts's name is used for daily.
	- awaits for others to join/quiz to start.

---
	
### Considirations:
- Any element name is subject to change for efficinecy and avoiding confusion
- Flows and logic might change as the project grows
- I require your assistance with naming things
- I am considering adding my own segemnts/rounds later
