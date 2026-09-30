"""Lecture questions: live quizzes like Kahoot.

A teacher starts a quiz and gets a 6-digit game code; students in their class join with the code
and answer on their own devices at the same time. Faster right answers earn more points.

POST /api/live                 teacher: start a game {title, questions}      -> {pin}
POST /api/live/{pin}/join      student: join the game                         -> state
GET  /api/live/{pin}           everyone: current state (poll about once a second)
POST /api/live/{pin}/answer    student: {choice}
POST /api/live/{pin}/next      teacher: lobby -> question -> results -> leaderboard -> next question … -> end
POST /api/live/{pin}/end       teacher: stop the game

Games live in memory: they are short, and a restart of the server ends them. Results are saved
when a game ends ("pragmalab.liveResults:<student>"), so classes can see who did best.
"""

import json
import secrets
import threading
import time
from dataclasses import dataclass, field
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from pragmalab_server import db
from pragmalab_server.deps import Session, full_session
from pragmalab_server.people import class_of_student, class_of_teacher

router = APIRouter(prefix="/api/live", tags=["live"])

MAX_PLAYERS = 60
GAME_TTL_S = 3 * 3600  # games are cleared after 3 hours


class QuestionIn(BaseModel):
    text: str = Field(min_length=1, max_length=200)
    options: list[str] = Field(min_length=2, max_length=4)
    answer: int = Field(ge=0, le=3)
    seconds: int = Field(default=20, ge=5, le=120)


class StartIn(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    questions: list[QuestionIn] = Field(min_length=1, max_length=50)


class AnswerIn(BaseModel):
    choice: int = Field(ge=0, le=3)


Phase = Literal["lobby", "question", "reveal", "board", "end"]


@dataclass
class Player:
    id: str
    name: str
    score: int = 0
    last_points: int = 0
    last_correct: bool | None = None
    answers: dict[int, tuple[int, float]] = field(default_factory=dict)  # question -> (choice, seconds taken)


@dataclass
class Game:
    pin: str
    host: str
    class_code: str
    title: str
    questions: list[QuestionIn]
    created: float = field(default_factory=time.time)
    phase: Phase = "lobby"
    index: int = -1
    started_at: float = 0.0  # when the current question appeared
    players: dict[str, Player] = field(default_factory=dict)
    recorded: bool = False


_games: dict[str, Game] = {}
_lock = threading.Lock()


def _now_ms() -> int:
    return int(time.time() * 1000)


def _cleanup() -> None:
    old = [p for p, g in _games.items() if time.time() - g.created > GAME_TTL_S]
    for p in old:
        del _games[p]


def _game(pin: str) -> Game:
    g = _games.get(pin)
    if not g:
        raise HTTPException(404, "We can’t find a game with this code. Check the code on your teacher’s screen.")
    return g


def _q(g: Game) -> QuestionIn:
    return g.questions[g.index]


def _tick(g: Game) -> None:
    """A question ends by itself when time is up or everyone has answered."""
    if g.phase != "question":
        return
    q = _q(g)
    everyone = g.players and all(g.index in p.answers for p in g.players.values())
    if time.time() >= g.started_at + q.seconds or everyone:
        g.phase = "reveal"


def _record(g: Game) -> None:
    """When a game ends, each student's result is saved ("pragmalab.liveResults:<student>") for class rankings."""
    if g.recorded or not g.players:
        return
    g.recorded = True
    ranking = _ranking(g)
    now = time.time()
    with db.tx() as conn:
        for place, p in enumerate(ranking, start=1):
            key = f"pragmalab.liveResults:{p.id}"
            row = conn.execute("SELECT value FROM kv WHERE key = ?", (key,)).fetchone()
            try:
                old = json.loads(row["value"]) if row and row["value"] else []
            except ValueError:
                old = []
            right = sum(1 for i, (choice, _) in p.answers.items() if choice == g.questions[i].answer)
            entry = {
                "id": f"{g.pin}-{int(g.created)}",
                "title": g.title,
                "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
                "score": p.score,
                "rank": place,
                "players": len(ranking),
                "right": right,
                "questions": len(g.questions),
            }
            value = json.dumps([entry, *[e for e in old if e.get("id") != entry["id"]]][:100], ensure_ascii=False, separators=(",", ":"))
            conn.execute(
                "INSERT INTO kv(key, value, version, updated_at) VALUES(?, ?, ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, version = excluded.version, updated_at = excluded.updated_at",
                (key, value, db.next_version(conn), now),
            )


def _ranking(g: Game) -> list[Player]:
    return sorted(g.players.values(), key=lambda p: (-p.score, p.name.lower()))


def _state(g: Game, viewer: str, is_host: bool) -> dict:
    _tick(g)
    ranking = _ranking(g)
    out: dict = {
        "pin": g.pin,
        "title": g.title,
        "phase": g.phase,
        "index": g.index,
        "total": len(g.questions),
        "players": len(g.players),
        "now": _now_ms(),
    }
    if g.phase in ("question", "reveal"):
        q = _q(g)
        out["question"] = {"text": q.text, "options": q.options, "seconds": q.seconds}
        out["endsAt"] = int((g.started_at + q.seconds) * 1000)
        out["answered"] = sum(1 for p in g.players.values() if g.index in p.answers)
    if g.phase == "reveal":
        q = _q(g)
        counts = [0] * len(q.options)
        for p in g.players.values():
            if g.index in p.answers:
                counts[p.answers[g.index][0]] += 1
        out["correct"] = q.answer
        out["counts"] = counts
    if g.phase in ("board", "end", "reveal") or is_host:
        top = ranking if is_host else ranking[:5]
        out["leaderboard"] = [{"id": p.id, "name": p.name, "score": p.score, "lastPoints": p.last_points} for p in top]
    if is_host and g.phase == "lobby":
        out["names"] = [p.name for p in g.players.values()]
    me = g.players.get(viewer)
    if me:
        out["me"] = {
            "name": me.name,
            "score": me.score,
            "rank": ranking.index(me) + 1,
            "answered": g.index in me.answers,
            "lastPoints": me.last_points,
            "lastCorrect": me.last_correct,
        }
    out["host"] = is_host
    return out


# ------------------------------------------------------------ endpoints

@router.post("")
def start(body: StartIn, s: Session = Depends(full_session)) -> dict:
    if s.user["role"] != "teacher":
        raise HTTPException(403, "Only teachers can start a game.")
    for q in body.questions:
        if q.answer >= len(q.options) or any(not o.strip() for o in q.options):
            raise HTTPException(422, f"Check the question “{q.text[:40]}”: every answer needs text and one must be right.")
    room = class_of_teacher(s.user["id"])
    if not room:
        raise HTTPException(409, "Create your class first (Team page).")
    with _lock:
        _cleanup()
        # one game per teacher at a time
        for p, g in list(_games.items()):
            if g.host.lower() == s.user["id"].lower():
                del _games[p]
        pin = f"{secrets.randbelow(900000) + 100000}"
        while pin in _games:
            pin = f"{secrets.randbelow(900000) + 100000}"
        _games[pin] = Game(pin=pin, host=s.user["id"], class_code=room["code"], title=body.title.strip(), questions=body.questions)
        return {"pin": pin}


@router.post("/{pin}/join")
def join(pin: str, s: Session = Depends(full_session)) -> dict:
    with _lock:
        g = _game(pin)
        uid = s.user["id"]
        if uid.lower() == g.host.lower():
            return _state(g, uid, True)
        room = class_of_student(uid)
        if not room or room["code"] != g.class_code:
            raise HTTPException(403, "This game is for another class. Ask your teacher for your class’s code.")
        if uid not in g.players:
            if g.phase == "end":
                raise HTTPException(409, "This game has finished.")
            if len(g.players) >= MAX_PLAYERS:
                raise HTTPException(409, "This game is full.")
            g.players[uid] = Player(id=uid, name=s.user["name"])
        return _state(g, uid, False)


@router.get("/{pin}")
def state(pin: str, s: Session = Depends(full_session)) -> dict:
    with _lock:
        g = _game(pin)
        uid = s.user["id"]
        return _state(g, uid, uid.lower() == g.host.lower())


@router.post("/{pin}/answer")
def answer(pin: str, body: AnswerIn, s: Session = Depends(full_session)) -> dict:
    with _lock:
        g = _game(pin)
        _tick(g)
        p = g.players.get(s.user["id"])
        if not p:
            raise HTTPException(403, "Join the game first.")
        if g.phase != "question":
            raise HTTPException(409, "Too late – this question is closed.")
        if g.index in p.answers:
            return _state(g, p.id, False)
        q = _q(g)
        if body.choice >= len(q.options):
            raise HTTPException(422, "That answer doesn’t exist.")
        taken = max(0.0, time.time() - g.started_at)
        p.answers[g.index] = (body.choice, taken)
        right = body.choice == q.answer
        # like Kahoot: a right answer is worth 500–1000 points – the faster, the more
        p.last_points = round(1000 * (1 - min(taken, q.seconds) / (2 * q.seconds))) if right else 0
        p.last_correct = right
        p.score += p.last_points
        _tick(g)
        return _state(g, p.id, False)


@router.post("/{pin}/next")
def next_step(pin: str, s: Session = Depends(full_session)) -> dict:
    with _lock:
        g = _game(pin)
        if s.user["id"].lower() != g.host.lower():
            raise HTTPException(403, "Only the teacher can move the game on.")
        _tick(g)
        if g.phase == "question":
            g.phase = "reveal"  # end the question early
        elif g.phase == "reveal":
            g.phase = "board"
        elif g.phase in ("lobby", "board"):
            if g.index + 1 >= len(g.questions):
                g.phase = "end"
                _record(g)
            else:
                g.index += 1
                g.phase = "question"
                g.started_at = time.time()
                for p in g.players.values():
                    p.last_points = 0
                    p.last_correct = None
        return _state(g, s.user["id"], True)


@router.post("/{pin}/end")
def end(pin: str, s: Session = Depends(full_session)) -> dict:
    with _lock:
        g = _game(pin)
        if s.user["id"].lower() != g.host.lower():
            raise HTTPException(403, "Only the teacher can end the game.")
        g.phase = "end"
        if g.index >= 0:  # only games that got going count
            _record(g)
        return _state(g, s.user["id"], True)
