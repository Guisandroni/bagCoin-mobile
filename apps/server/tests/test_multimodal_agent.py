"""Tests for multimodal agent media handling."""

from app.agents import multimodal


def test_process_multimodal_accepts_audio_media(monkeypatch):
    monkeypatch.setattr(multimodal, "process_audio", lambda media: "Gastei R$ 42 no mercado")

    state = {
        "source_format": "ptt",
        "message": "",
        "context": {
            "media": {
                "mimetype": "audio/ogg",
                "data": "fake",
            }
        },
    }

    result = multimodal.process_multimodal(state)

    assert result["message"] == "Gastei R$ 42 no mercado"
    assert result["context"]["original_format"] == "audio"
    assert result["context"]["extracted_media_text"] == "Gastei R$ 42 no mercado"
    assert "error" not in result


def test_process_multimodal_accepts_image_media(monkeypatch):
    monkeypatch.setattr(
        multimodal,
        "process_image",
        lambda media: "Recibo do supermercado. Total R$ 99,90.",
    )

    state = {
        "source_format": "image",
        "message": "",
        "context": {
            "media": {
                "mimetype": "image/jpeg",
                "data": "fake",
            }
        },
    }

    result = multimodal.process_multimodal(state)

    assert result["message"] == "Recibo do supermercado. Total R$ 99,90."
    assert result["context"]["original_format"] == "image"
    assert "error" not in result


def test_process_multimodal_returns_actionable_error_when_audio_cannot_be_transcribed(monkeypatch):
    monkeypatch.setattr(
        multimodal,
        "process_audio",
        lambda media: "[Não consegui entender o áudio. Tente de novo ou envie como texto.]",
    )

    state = {
        "source_format": "audio",
        "message": "",
        "context": {
            "media": {
                "mimetype": "audio/ogg",
                "data": "fake",
            }
        },
    }

    result = multimodal.process_multimodal(state)

    assert "Não consegui entender o áudio" in result["error"]
    assert "Pode enviar novamente" in result["response"]
