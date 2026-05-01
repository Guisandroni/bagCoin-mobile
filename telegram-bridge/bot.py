"""
Telegram Bridge Service
Polls Telegram API for updates and forwards them to the backend.
"""

import json
import logging
import os
import time

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("telegram-bridge")

# ── Configuration ────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://app:8000")
API_KEY = os.environ.get("API_KEY", "")
LAST_UPDATE_FILE = "/app/last_update.txt"

# Base URL for Telegram Bot API calls
API_BASE = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}" if TELEGRAM_BOT_TOKEN else None

# ── Persisted offset ─────────────────────────────────────────────────────────

def load_offset() -> int:
    """Load the last processed update_id from disk."""
    try:
        with open(LAST_UPDATE_FILE, "r") as f:
            return int(f.read().strip())
    except (FileNotFoundError, ValueError):
        return 0


def save_offset(update_id: int) -> None:
    """Persist the last processed update_id to disk."""
    with open(LAST_UPDATE_FILE, "w") as f:
        f.write(str(update_id))


# ── Telegram API helpers ─────────────────────────────────────────────────────

def get_updates(offset: int, timeout: int = 30) -> list | None:
    """Long-poll getUpdates via the Bot API.

    Returns a list of updates, or None on failure.
    """
    if not API_BASE:
        logger.warning("TELEGRAM_BOT_TOKEN not set – cannot poll for updates")
        return None

    url = f"{API_BASE}/getUpdates"
    params = {"offset": offset, "timeout": timeout}

    try:
        with httpx.Client(timeout=timeout + 10) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("ok"):
                return data.get("result", [])
            logger.error("Telegram API error: %s", data)
            return None
    except httpx.TimeoutException:
        # Timeouts are expected with long-polling – just retry
        return []
    except httpx.HTTPStatusError as exc:
        logger.error("HTTP error polling Telegram: %s", exc)
        return None
    except httpx.RequestError as exc:
        logger.error("Request error polling Telegram: %s", exc)
        return None


def send_message(chat_id: int, text: str) -> bool:
    """Send a reply message to a Telegram chat."""
    if not API_BASE:
        logger.warning("TELEGRAM_BOT_TOKEN not set – cannot send message")
        return False

    url = f"{API_BASE}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("ok"):
                return True
            logger.error("sendMessage API error: %s", data)
            return False
    except httpx.RequestError as exc:
        logger.error("Failed to send message: %s", exc)
        return False


# ── Backend forwarding ───────────────────────────────────────────────────────

def forward_to_backend(chat_id: int, text: str, username: str | None) -> dict | None:
    """Forward an incoming message to the backend webhook endpoint.

    Returns the JSON response body on success, or None on failure.
    """
    url = f"{BACKEND_URL}/api/v1/webhook/telegram"
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    payload = {
        "chat_id": str(chat_id),
        "message": text,
        "username": username or None,
        "source_format": "text",
    }

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as exc:
        logger.error("Failed to forward message to backend: %s", exc)
        return None


# ── Main polling loop ────────────────────────────────────────────────────────

def process_update(update: dict) -> None:
    """Process a single Telegram update."""
    update_id = update.get("update_id")
    if not update_id:
        return

    message = update.get("message")
    if not message:
        # Ignore non-message updates (e.g. callback_query, edited_message)
        save_offset(update_id)
        return

    chat = message.get("chat", {})
    chat_id = chat.get("id")
    text = message.get("text", "")
    from_user = message.get("from", {})
    username = from_user.get("username")

    if not chat_id:
        logger.warning("Message without chat_id – skipping")
        save_offset(update_id)
        return

    # Only process text messages
    if not text:
        save_offset(update_id)
        return

    logger.info("Received message from %s (chat %s): %s", username or "unknown", chat_id, text[:80])

    # Forward to backend
    response = forward_to_backend(chat_id, text, username)

    if response is not None:
        # Send backend response back as a Telegram reply
        reply_text = response.get("reply", "") if isinstance(response, dict) else str(response)
        if reply_text:
            send_message(chat_id, reply_text)
        logger.info("Replied to chat %s", chat_id)
    else:
        # If forwarding fails, reply with a generic error
        send_message(chat_id, "Sorry, I couldn't process your message right now.")
        logger.warning("Backend forwarding failed for chat %s", chat_id)

    save_offset(update_id)


def main_loop() -> None:
    """Run the main polling loop indefinitely."""
    logger.info("Telegram Bridge Service starting")
    logger.info("Backend URL: %s", BACKEND_URL)
    logger.info("API Key configured: %s", "yes" if API_KEY else "no")
    logger.info("Bot token configured: %s", "yes" if TELEGRAM_BOT_TOKEN else "no")

    if not TELEGRAM_BOT_TOKEN:
        logger.warning("No TELEGRAM_BOT_TOKEN set – service will retry every 30s")

    offset = load_offset()
    logger.info("Starting with offset %s", offset)

    while True:
        updates = get_updates(offset + 1)

        if updates is None:
            # Non-retryable failure (e.g. no token, auth error) – wait and retry
            logger.warning("Polling returned no updates (will retry in 30s)")
            time.sleep(30)
            continue

        if not updates:
            # Empty result (long-poll timeout or no new messages) – keep going
            continue

        for update in updates:
            try:
                process_update(update)
                # Advance offset after each successful processing
                new_id = update.get("update_id", 0)
                if new_id > offset:
                    offset = new_id
            except Exception:
                logger.exception("Error processing update %s", update.get("update_id"))
                # Don't stop the loop – just move on
                continue


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        logger.info("Shutting down Telegram Bridge Service")
    except Exception:
        logger.exception("Fatal error – service terminated")
