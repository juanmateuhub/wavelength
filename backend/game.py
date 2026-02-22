import random
from typing import Dict, List, Optional

class Player:
    def __init__(self, player_id: str, name: str):
        self.id = player_id
        self.name = name
        self.score = 0
        self.target_position: Optional[int] = None
        self.phrase: Optional[str] = None
        self.left_adjective: Optional[str] = None
        self.right_adjective: Optional[str] = None
        self.has_submitted_clue = False
        self.current_guess: Optional[int] = None
        self.has_guessed = False

class GameRoom:
    def __init__(self, room_code: str):
        self.room_code = room_code
        self.players: Dict[str, Player] = {}
        self.state = "waiting"
        self.guessing_order: List[str] = []
        self.current_guess_index: int = 0
        self.last_needle_position: int = 90

    @property
    def current_clue_owner_id(self) -> Optional[str]:
        if self.current_guess_index < len(self.guessing_order):
            return self.guessing_order[self.current_guess_index]
        return None

    def add_player(self, player_id: str, name: str) -> Player:
        player = Player(player_id, name)
        self.players[player_id] = player
        return player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]

    def get_player_list(self):
        return [{"id": p.id, "name": p.name, "score": p.score} for p in self.players.values()]

    def start_round(self):
        self.state = "writing"
        self.guessing_order = []
        self.current_guess_index = 0
        self.last_needle_position = 90
        for player in self.players.values():
            player.target_position = random.randint(20, 160)
            player.phrase = None
            player.left_adjective = None
            player.right_adjective = None
            player.has_submitted_clue = False
            player.current_guess = None
            player.has_guessed = False

    def submit_clue(self, player_id: str, phrase: str, left_adj: str, right_adj: str):
        if player_id in self.players:
            p = self.players[player_id]
            p.phrase = phrase
            p.left_adjective = left_adj
            p.right_adjective = right_adj
            p.has_submitted_clue = True

    def all_submitted_clues(self) -> bool:
        return all(p.has_submitted_clue for p in self.players.values())

    def start_guessing_phase(self):
        self.state = "guessing"
        self.guessing_order = list(self.players.keys())
        random.shuffle(self.guessing_order)
        self.current_guess_index = 0
        self.last_needle_position = 90
        self._reset_guesses()

    def _reset_guesses(self):
        for p in self.players.values():
            p.current_guess = None
            p.has_guessed = False

    def submit_guess(self, player_id: str, position: int):
        owner_id = self.current_clue_owner_id
        if player_id != owner_id and player_id in self.players:
            self.players[player_id].current_guess = position
            self.players[player_id].has_guessed = True

    def all_guessed_current(self) -> bool:
        owner_id = self.current_clue_owner_id
        return all(
            p.has_guessed
            for pid, p in self.players.items()
            if pid != owner_id
        )

    def calculate_scores_current(self) -> Dict[str, int]:
        scores = {}
        owner_id = self.current_clue_owner_id
        if not owner_id:
            return scores
        target = self.players[owner_id].target_position
        for pid, player in self.players.items():
            if pid == owner_id or player.current_guess is None:
                continue
            diff = abs(player.current_guess - target)
            if diff <= 10:
                points = 4
            elif diff <= 20:
                points = 3
            elif diff <= 35:
                points = 2
            else:
                points = 0
            player.score += points
            scores[pid] = points
        return scores

    def next_clue(self) -> bool:
        self.current_guess_index += 1
        self.last_needle_position = 90
        self._reset_guesses()
        if self.current_guess_index >= len(self.guessing_order):
            self.state = "finished"
            return False
        return True


rooms: Dict[str, GameRoom] = {}

def create_room() -> GameRoom:
    code = str(random.randint(1000, 9999))
    while code in rooms:
        code = str(random.randint(1000, 9999))
    room = GameRoom(code)
    rooms[code] = room
    return room

def get_room(code: str) -> Optional[GameRoom]:
    return rooms.get(code)