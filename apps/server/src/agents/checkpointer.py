import json
import pickle
import base64
from typing import Optional, Sequence
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
)
from langgraph.checkpoint.serde.base import SerializerProtocol
from ..config import settings
import redis


class RedisCheckpointSaver(BaseCheckpointSaver):
    def __init__(self, redis_url: str = None):
        super().__init__(serde=JsonPlusSerializer())
        self.redis = redis.from_url(redis_url or settings.REDIS_URL, decode_responses=False)

    def get_tuple(self, config: dict) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"].get("thread_id")
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")

        key = f"lg:checkpoint:{thread_id}:{checkpoint_ns}"
        if checkpoint_id:
            data = self.redis.hget(key, checkpoint_id)
        else:
            # Get latest
            ids = self.redis.hkeys(key)
            if not ids:
                return None
            latest_id = sorted(ids, key=lambda x: x.decode() if isinstance(x, bytes) else x)[-1]
            data = self.redis.hget(key, latest_id)

        if not data:
            return None

        checkpoint, metadata, parent_config = pickle.loads(data)
        return CheckpointTuple(
            config=config,
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
            pending_writes=None,
        )

    def list(self, config: dict, *, filter: dict = None, before: dict = None, limit: Optional[int] = None) -> Sequence[CheckpointTuple]:
        thread_id = config["configurable"].get("thread_id")
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        key = f"lg:checkpoint:{thread_id}:{checkpoint_ns}"

        items = []
        for cid, data in self.redis.hscan_iter(key):
            checkpoint, metadata, parent_config = pickle.loads(data)
            items.append(
                CheckpointTuple(
                    config={"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": cid.decode() if isinstance(cid, bytes) else cid}},
                    checkpoint=checkpoint,
                    metadata=metadata,
                    parent_config=parent_config,
                    pending_writes=None,
                )
            )
        return sorted(items, key=lambda x: x.checkpoint["id"], reverse=True)[:limit]

    def put(self, config: dict, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: dict) -> dict:
        thread_id = config["configurable"].get("thread_id")
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        parent_config = config.get("configurable", {}).get("checkpoint_id")

        key = f"lg:checkpoint:{thread_id}:{checkpoint_ns}"
        data = pickle.dumps((checkpoint, metadata, parent_config))
        self.redis.hset(key, checkpoint_id, data)
        self.redis.expire(key, 86400 * 7)  # 7 days TTL
        return {"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": checkpoint_id}}

    def put_writes(self, config: dict, writes: list, task_id: str) -> None:
        pass


class JsonPlusSerializer(SerializerProtocol):
    def dumps(self, obj) -> bytes:
        return pickle.dumps(obj)

    def loads(self, data: bytes) -> any:
        return pickle.loads(data)

    def dumps_typed(self, obj) -> tuple[str, bytes]:
        return ("pickle", pickle.dumps(obj))

    def loads_typed(self, data: tuple[str, bytes]) -> any:
        return pickle.loads(data[1])
