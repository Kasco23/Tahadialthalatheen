# ToDos

## General Information

- This is a video call based football quiz game where two players compete against each other in a series of quiz segments to earn points with the host controlling the flow of the game.
- The game consists of multiple segments, each with its own unique rules and scoring system and powerups.
- There is a big element of voice call interaction between the host and players, as well as between the players themselves. So not everything must be done automatically, some actions require the host to manually control them.
- Find necessary packages and libraries and components when needed.
- Don't overuse emojis in the code or comments. make them minimal in the fronetend.
- Right now the Quiz page is used for testing i.e. using fake players.
- Fix lint errors and warnings as you go.
- Check off completed ToDos.

## Question Manager

- [ ] Remove "Created" or "Creation Date" or any mention of it from the database or the frontend.

## Quiz Page

### Fundemental Changes

- [ ] Each Segment should start in order, and a segment can't start until the previous one is completed.
- [ ] Each Segment should have it's own powerup buttons, they will be mentioned below.
- [ ] The host should be able to see the current question and all of its answers immediately without having to press "Show Answers".
- [ ] The players may not see the answers at any point.
- [ ] Alongside the Flag and Logo of a player, their profile picture should also be shown. (On the left). so each player banner/contaionor will have 3 images: Flag, Logo, Profile Picture and then their Name and amount of points.
- [ ] Questions are not shown to players until the host presses "Show Question".
- [ ] There are no multiple choice quetions at all. Either a list question (like WDYK) or open answer question (like Name the Player that won ...) (Like Auct); technicaly both are list questions, or only one answer (Bell, UPDW, and Remo).
- [ ] Fix the question counter in the quiz pager. Right now it shows 0 for all questions even though there are questions for the segments.
- [ ] at the top of the Quiz Page, show the session_code instead of the session_id.
- [ ] Find a way for a consistent Role retrieval for both host and players during all session activities.

### Segemnts

#### Segment 1: What do you know? (WDYK)

- This segment has a long list of answers. It tests players to see how many answers they can guess from the long list. Players either finish the list or one of them strikes out (three strikes).
- The host can add or remove strikes (in case of accidental strike click), players may not have this option, they can only see the strike count and obviously the points.
- [ ] Remove all powerups from this segment except for "Pass" button. This button is used to skip a turn without getting a strike. A "Pass" can only be used by a player once they have 2 strikes and provided the other player has not used their pass in their last turn. So if Player 1 (Home) has 2 strikes and Player 2 (Away) has 2 strikes and has not used their pass in their last turn, Home can use their pass to skip their turn without getting a third strike, but Away may not use their Pass immediately after because Home just used theirs.
- [ ] Players are awarded a point after winning the round. A segment may have multiple rounds. If a player wins the round without reciving any strikes, they are awarded a bonus point.
- [ ] The round ends when either all answers are guessed or one player receives three strikes. Then the host may press "Next Round" to start the next round.
- [ ] After all rounds are completed, the host may press "End Segment" to end the segment and move to the next one. And of course the question is not shown to the players until the host presses "Show Question".
- [ ] Give the Host the option to select/unselect an answer to show that it has been answered correctly. If a player answers an already answered question, they receive a strike.

#### Segment 2: Auction (AUCT)

- This segment has a long list of answers. It tests players to see how many answers they can guess from the long list. Players bid the amount of answers they think they can get from the list. The player who bids the highest gets to play that round and try to get their bid amount of answers correct.
- There are no strikes in this segment.
- Points are rewarded based on intervals of 10. So answers between 1 and 19 are worth 1 point, answers between 20 and 29 are worth 2 points, and so on.
- Players must answer at least half of their bid amount correctly, if they don't, the other player is awarded 1 point.
- Players only have 3 seconds to answers. The host starts the timer by pressing "Start Timer" button. If the player fails to answer within the time limit, their answer is considered wrong and other player may be awarded a point if applicable.
- There is a "Pass" button here but serves a different purpose. Here the "Pass" button is used to withdraw from the bidding process. So if a player feels that the other player's bid is too high, they may press "Pass" to withdraw from bidding and allow the other player to play the round. This resets after each round (question completion)
- [ ] Remove all powerups from this segment except for "Al-Habeed" button. This button can only be activated at a bid amount of 30 or more. So if player Home already bid 34, then player Away must bid at least 35, upon clicking the "Al-Habeed" button, a popup will appear showing what is the current required minimum bid amount (which is 35 in this case) and the player may enter their new bid amount which must be at least 35. If the player enters a valid bid amount, the other player may not bid anymore and the round starts with the player who used the "Al-Habeed" button.
- [ ] Add the "Pass" or "Withdraw" button as mentioned above.
- [ ] After all rounds are completed, the host may press "End Segment" to end the segment and move to the next one. And of course the question is not shown to the players until the host presses "Show Question".

#### Segment 3: Bell (Bell)

- This segment only allows one correct answer.
- There is a common bell button for both players. The first player to press the bell gets to answer the question.
- If the player answers correctly, they are awarded 1 points. If they answer incorrectly, the other player gets to answer. If the second player answers incorrectly as well, no points are awarded and the round ends.
- The powerup button is called "Bellegoal", this allows its user to answer the question while the other is not allowed to answer even if the other player answers incorrectly.
- Powerup can only be used before either player presses the bell.
- Powerup can only be used once by each player during the entire segment.
- [ ] Give the Host the option to mark the answer as correct or incorrect after a player answers.
- [ ] Remove all powerups from this segment except for "Bellegoal" button.
- [ ] Add the shared Bell button for both players.
- [ ] The should be a banner on the page showing which player pressed the bell first.
- [ ] Upon pressing the bell, a 30 second timer starts automatically for the player who pressed the bell to answer. If the player fails to answer within the time limit, their answer is considered wrong and the other player may get to answer if applicable. if the other player also fails to answer correctly, the round ends.
- [ ] After all rounds are completed, the host may press "End Segment" to end the segment and move to the next one. And of course the question is not shown to the players

#### Segment 4: Upside-Down (UPDW)

- This segment only allows one correct answer.
- It is very similar to the Bell segment, but with harder questions and a different powerup.
- The powerup button is called "Slippy-G". This locks the question for the other player, so only the player who used the powerup may answer the question. A correct answer awards the player 2 points instead of 1 and removes 2 points from the other player. An incorrect answer ends the round with no points awarded.
- Powerup can only be used before either player presses the bell.
- Powerup can only be used once by each player during the entire segment.
- [ ] Give the Host the option to mark the answer as correct or incorrect after a player answers.
- [ ] Remove all powerups from this segment except for "Slippy-G" button.
- [ ] Add the shared Bell button for both players.
- [ ] The should be a banner on the page showing which player pressed the bell first.
- [ ] Upon pressing the bell, a 30 second timer starts automatically for the player who pressed the bell to answer. If the player fails to answer within the time limit, their answer is considered wrong and the other player may get to answer if applicable. if the other player also fails to answer correctly, the round ends.
- [ ] After all rounds are completed, the host may press "End Segment" to end the segment and move to the next one. And of course the question is not shown to the players until the host presses "Show Question".

#### Segment 5: Remontada (Remo)

- This segment only allows one correct answer.
- This is the last segement of the game.
- It is a completly different format to the previous two segments.
- Career paths of: Retired players, Active players, Current Managers are shown to both players.
- Each team in the career path is shown by the host clicking "Show Next Team" button.
- Players have 2 chances to guess the right answer.
- No bells needed here. Players may speak out their answer at any time after the host starts showing the career path.
- If a player answers correctly before all teams are shown, they are awarded 2 points, if they answer correctly after all teams are shown, they are awarded 1 point.
- If a player answers incorrectly , they lose one chance. If both players use up their two chances without answering correctly, the round ends with no points awarded.
- The host may press who answered correctly, and if all teams have not been shown yet, then player gets 2 points, otherwise 1 point.
- The host may also press "Incorrect Answer" button to indicate that a player answered incorrectly and lose one chance.
- [ ] Remove all powerups from this segment.
- [ ] Add the "Show Next Team" button for the host to reveal the career path step by step.
- [ ] After all rounds are completed, the host may press "End Session" to end the segment and move to the final score screen.
