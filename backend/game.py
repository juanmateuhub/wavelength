import random
import json
import os
from datetime import date
from typing import Dict, List, Optional

ADJECTIVES_FILE = os.path.join(os.path.dirname(__file__), "adjectives.json")
HIGHSCORES_FILE = os.path.join(os.path.dirname(__file__), "highscores.json")

def load_adjectives() -> List[List[str]]:
    with open(ADJECTIVES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_highscores() -> dict:
    if not os.path.exists(HIGHSCORES_FILE):
        return {}
    with open(HIGHSCORES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_highscores(data: dict):
    with open(HIGHSCORES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def register_score(total_dials: int, score: int, player_names: List[str]) -> dict:
    highscores = load_highscores()
    key = str(total_dials)
    if key not in highscores:
        highscores[key] = []
    highscores[key].append({
        "score": score,
        "players": player_names,
        "date": date.today().isoformat(),
    })
    highscores[key].sort(key=lambda x: x["score"], reverse=True)
    highscores[key] = highscores[key][:5]
    save_highscores(highscores)
    return highscores[key]

class Clue:
    def __init__(self, target_position: int, left_adjective: str = None, right_adjective: str = None):
        self.target_position = target_position
        self.left_adjective = left_adjective
        self.right_adjective = right_adjective
        self.phrase: Optional[str] = None
        self.submitted = False

class Player:
    def __init__(self, player_id: str, name: str):
        self.id = player_id
        self.name = name
        self.clues: List[Clue] = []
        self.current_clue_index = 0
        self.current_guess: Optional[int] = None
        self.has_guessed = False

    def all_clues_submitted(self) -> bool:
        return all(c.submitted for c in self.clues)

    def current_clue(self) -> Optional[Clue]:
        if self.current_clue_index < len(self.clues):
            return self.clues[self.current_clue_index]
        return None

class GameRoom:
    def __init__(self, room_code: str):
        self.room_code = room_code
        self.players: Dict[str, Player] = {}
        self.host_id: Optional[str] = None
        self.state = "waiting"
        self.num_rounds = 3
        self.mode = "free"
        self.guessing_order: List[tuple] = []
        self.current_guess_index: int = 0
        self.last_needle_position: int = 90
        self.team_score: int = 0

    @property
    def total_dials(self) -> int:
        return self.num_rounds * len(self.players)

    @property
    def current_clue_owner_id(self) -> Optional[str]:
        if self.current_guess_index < len(self.guessing_order):
            return self.guessing_order[self.current_guess_index][0]
        return None

    @property
    def current_clue_owner_clue_index(self) -> Optional[int]:
        if self.current_guess_index < len(self.guessing_order):
            return self.guessing_order[self.current_guess_index][1]
        return None

    def add_player(self, player_id: str, name: str) -> Player:
        player = Player(player_id, name)
        self.players[player_id] = player
        if self.host_id is None:
            self.host_id = player_id
        return player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]
        if self.host_id == player_id and self.players:
            self.host_id = next(iter(self.players))

    def get_player_list(self):
        return [{"id": p.id, "name": p.name} for p in self.players.values()]

    def start_round(self, num_rounds: int = 3, mode: str = "free"):
        self.state = "writing"
        self.num_rounds = num_rounds
        self.mode = mode
        self.guessing_order = []
        self.current_guess_index = 0
        self.last_needle_position = 90
        self.team_score = 0

        adjectives = load_adjectives() if mode == "battery" else []
        used_pairs = []

        for player in self.players.values():
            player.clues = []
            player.current_clue_index = 0
            player.current_guess = None
            player.has_guessed = False
            for _ in range(num_rounds):
                # Rango ampliado para que el 4 pueda estar en los extremos
                position = random.randint(5, 175)
                if mode == "battery" and adjectives:
                    available = [p for p in adjectives if p not in used_pairs]
                    if not available:
                        available = adjectives
                        used_pairs = []
                    pair = random.choice(available)
                    used_pairs.append(pair)
                    clue = Clue(position, pair[0], pair[1])
                else:
                    clue = Clue(position)
                player.clues.append(clue)

    def submit_clue(self, player_id: str, phrase: str, left_adj: str = None, right_adj: str = None):
        if player_id not in self.players:
            return
        player = self.players[player_id]
        clue = player.current_clue()
        if clue and not clue.submitted:
            clue.phrase = phrase
            if left_adj:
                clue.left_adjective = left_adj
            if right_adj:
                clue.right_adjective = right_adj
            clue.submitted = True
            player.current_clue_index += 1

    def all_submitted_clues(self) -> bool:
        return all(p.all_clues_submitted() for p in self.players.values())

    def start_guessing_phase(self):
        self.state = "guessing"
        all_clues = []
        for pid, player in self.players.items():
            for i in range(len(player.clues)):
                all_clues.append((pid, i))
        random.shuffle(all_clues)
        self.guessing_order = all_clues
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
        return all(p.has_guessed for pid, p in self.players.items() if pid != owner_id)

    def calculate_points_current(self) -> int:
        owner_id = self.current_clue_owner_id
        clue_index = self.current_clue_owner_clue_index
        if not owner_id or clue_index is None:
            return 0
        target = self.players[owner_id].clues[clue_index].target_position
        guesses = [
            p.current_guess for pid, p in self.players.items()
            if pid != owner_id and p.current_guess is not None
        ]
        if not guesses:
            return 0
        avg_guess = sum(guesses) / len(guesses)
        diff = abs(avg_guess - target)
        if diff <= 5: points = 4
        elif diff <= 11: points = 3
        elif diff <= 19: points = 2
        else: points = 0
        self.team_score += points
        return points

    def next_clue(self) -> bool:
        self.current_guess_index += 1
        self.last_needle_position = 90
        self._reset_guesses()
        if self.current_guess_index >= len(self.guessing_order):
            self.state = "finished"
            return False
        return True

    def get_current_clue_info(self):
        owner_id = self.current_clue_owner_id
        clue_index = self.current_clue_owner_clue_index
        if not owner_id or clue_index is None:
            return None
        owner = self.players[owner_id]
        clue = owner.clues[clue_index]
        return {
            "owner_id": owner_id,
            "owner_name": owner.name,
            "phrase": clue.phrase,
            "left_adjective": clue.left_adjective,
            "right_adjective": clue.right_adjective,
            "clue_number": self.current_guess_index + 1,
            "total_clues": len(self.guessing_order),
        }

    def get_player_writing_state(self, player_id: str):
        if player_id not in self.players:
            return None
        player = self.players[player_id]
        clue = player.current_clue()
        if not clue:
            return None
        return {
            "target_position": clue.target_position,
            "left_adjective": clue.left_adjective,
            "right_adjective": clue.right_adjective,
            "clue_number": player.current_clue_index + 1,
            "total_clues": self.num_rounds,
            "mode": self.mode,
        }


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