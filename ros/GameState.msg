# Message for receiving information about the game
Header header

# which game
int8 game

# which state
int8 state

# user performance
string performance

# Games
int8 STORYTELLING = 0
int8 ROCKET_BARRIER = 1
int8 GALACTIC_TRAVELER = 2
int8 SPACESHIP_TIDYUP = 3
int8 ALIEN_CODES = 4


# States
int8 START = 0
int8 IN_PROGRESS = 1
int8 PAUSED = 2
int8 USER_TIMEOUT = 3
int8 END = 4
