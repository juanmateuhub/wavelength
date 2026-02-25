from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from game import create_room, get_room, register_score, load_highscores

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connections: dict = {}

async def broadcast(room_code: str, message: dict):
    if room_code in connections:
        for ws in connections[room_code].values():
            try:
                await ws.send_text(json.dumps(message))
            except:
                pass

async def send_game_state(room_code: str):
    room = get_room(room_code)
    if not room:
        return
    await broadcast(room_code, {
        "type": "game_state",
        "state": room.state,
        "players": room.get_player_list(),
        "host_id": room.host_id,
    })

def all_active_guessed(room, room_code):
    owner_id = room.current_clue_owner_id
    active_pids = set(connections.get(room_code, {}).keys())
    guessers = [pid for pid in active_pids if pid in room.players and pid != owner_id]
    if not guessers:
        return False
    return all(room.players[pid].has_guessed for pid in guessers)

def count_active_guessers(room, room_code):
    owner_id = room.current_clue_owner_id
    active_pids = set(connections.get(room_code, {}).keys())
    total = sum(1 for pid in active_pids if pid in room.players and pid != owner_id)
    ready = sum(1 for pid in active_pids if pid in room.players and pid != owner_id and room.players[pid].has_guessed)
    return ready, total

@app.post("/create-room")
async def create_room_endpoint():
    room = create_room()
    return {"room_code": room.room_code}

@app.get("/room/{room_code}")
async def check_room(room_code: str):
    room = get_room(room_code)
    if not room:
        return {"exists": False}
    return {"exists": True, "players": room.get_player_list(), "state": room.state}

@app.get("/highscores")
async def get_highscores():
    return load_highscores()

@app.websocket("/ws/{room_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_id: str):
    await websocket.accept()

    room = get_room(room_code)
    if not room:
        await websocket.send_text(json.dumps({"type": "error", "message": "Sala no encontrada"}))
        await websocket.close()
        return

    if room_code not in connections:
        connections[room_code] = {}
    connections[room_code][player_id] = websocket

    await send_game_state(room_code)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "join":
                name = message.get("name", "Jugador")
                if player_id not in room.players:
                    room.add_player(player_id, name)
                    await broadcast(room_code, {"type": "player_joined", "name": name})
                await send_game_state(room_code)

            elif msg_type == "lobby_settings":
                if player_id == room.host_id:
                    await broadcast(room_code, {
                        "type": "lobby_settings",
                        "num_rounds": message.get("num_rounds", 3),
                        "mode": message.get("mode", "free"),
                    })

            elif msg_type == "start_round":
                if player_id == room.host_id and len(room.players) >= 2 and room.state in ["waiting", "finished"]:
                    num_rounds = message.get("num_rounds", 3)
                    mode = message.get("mode", "free")
                    room.start_round(num_rounds, mode)
                    for pid, ws in connections[room_code].items():
                        if pid in room.players:
                            writing_state = room.get_player_writing_state(pid)
                            if writing_state:
                                await ws.send_text(json.dumps({
                                    "type": "round_started",
                                    "state": room.state,
                                    "players": room.get_player_list(),
                                    "host_id": room.host_id,
                                    **writing_state,
                                }))

            elif msg_type == "submit_clue":
                room.submit_clue(
                    player_id,
                    message.get("phrase", ""),
                    message.get("left_adjective"),
                    message.get("right_adjective"),
                )
                player = room.players.get(player_id)
                if player and not player.all_clues_submitted():
                    writing_state = room.get_player_writing_state(player_id)
                    if writing_state:
                        await websocket.send_text(json.dumps({
                            "type": "next_writing",
                            "state": room.state,
                            **writing_state,
                        }))
                    await broadcast(room_code, {"type": "writing_progress", "players": room.get_player_list()})
                elif room.all_submitted_clues():
                    room.start_guessing_phase()
                    clue_info = room.get_current_clue_info()
                    await broadcast(room_code, {
                        "type": "guessing_started",
                        "state": room.state,
                        "clue": clue_info,
                        "players": room.get_player_list(),
                        "needle_position": room.last_needle_position,
                        "host_id": room.host_id,
                    })
                else:
                    await broadcast(room_code, {"type": "writing_progress", "players": room.get_player_list()})

            elif msg_type == "move_needle":
                position = message.get("position", 90)
                room.last_needle_position = position
                for pid, p in room.players.items():
                    if pid != room.current_clue_owner_id:
                        p.has_guessed = False
                ready_count, total_guessers = count_active_guessers(room, room_code)
                await broadcast(room_code, {
                    "type": "needle_moved",
                    "position": position,
                    "player_id": player_id,
                    "ready_count": ready_count,
                    "total_guessers": total_guessers,
                })

            elif msg_type == "cancel_guess":
                if player_id in room.players:
                    room.players[player_id].has_guessed = False
                ready_count, total_guessers = count_active_guessers(room, room_code)
                await broadcast(room_code, {
                    "type": "player_ready",
                    "player_id": player_id,
                    "is_ready": False,          # ← nuevo campo
                    "ready_count": ready_count,
                    "total_guessers": total_guessers,
                    "players": room.get_player_list(),
                })

            elif msg_type == "submit_guess":
                position = message.get("position", 90)
                room.submit_guess(player_id, position)
                ready_count, total_guessers = count_active_guessers(room, room_code)
                await broadcast(room_code, {
                    "type": "player_ready",
                    "player_id": player_id,
                    "is_ready": True,           # ← nuevo campo
                    "ready_count": ready_count,
                    "total_guessers": total_guessers,
                    "players": room.get_player_list(),
                })
                if all_active_guessed(room, room_code):
                    points_this_dial = room.calculate_points_current()
                    clue_info = room.get_current_clue_info()
                    owner_id = room.current_clue_owner_id
                    clue_index = room.current_clue_owner_clue_index
                    owner_target = room.players[owner_id].clues[clue_index].target_position
                    await broadcast(room_code, {
                        "type": "clue_reveal",
                        "target_position": owner_target,
                        "needle_position": room.last_needle_position,
                        "points_this_dial": points_this_dial,
                        "team_score": room.team_score,
                        "clue": clue_info,
                        "players": room.get_player_list(),
                        "host_id": room.host_id,
                    })

            elif msg_type == "next_clue":
                if player_id == room.host_id:
                    has_more = room.next_clue()
                    if has_more:
                        clue_info = room.get_current_clue_info()
                        await broadcast(room_code, {
                            "type": "guessing_started",
                            "state": room.state,
                            "clue": clue_info,
                            "players": room.get_player_list(),
                            "needle_position": room.last_needle_position,
                            "host_id": room.host_id,
                        })
                    else:
                        player_names = [p.name for p in room.players.values()]
                        total_dials = room.total_dials
                        top = register_score(total_dials, room.team_score, player_names)
                        await broadcast(room_code, {
                            "type": "game_finished",
                            "state": room.state,
                            "players": room.get_player_list(),
                            "team_score": room.team_score,
                            "total_dials": total_dials,
                            "leaderboard": top,
                            "host_id": room.host_id,
                        })

    except WebSocketDisconnect:
        if room_code in connections and player_id in connections[room_code]:
            del connections[room_code][player_id]
        room.remove_player(player_id)
        await broadcast(room_code, {"type": "player_left", "player_id": player_id})
        await send_game_state(room_code)