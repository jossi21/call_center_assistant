import threading
from typing import Dict, Optional

_lock = threading.Lock()
_streams: Dict[str, threading.Event] = {}


def register(stream_id: str) -> threading.Event:
    """Create and register a new stop-event for this stream_id."""
    event = threading.Event()
    with _lock:
        _streams[stream_id] = event
    return event


def request_stop(stream_id: str) -> bool:
    """Signal the stream to stop. Returns True if the stream_id was found."""
    with _lock:
        event = _streams.get(stream_id)
    if event is not None:
        event.set()
        return True
    return False


def unregister(stream_id: str) -> None:
    """Remove the stream_id once the stream has finished, to avoid leaking memory."""
    with _lock:
        _streams.pop(stream_id, None)


def get(stream_id: str) -> Optional[threading.Event]:
    with _lock:
        return _streams.get(stream_id)