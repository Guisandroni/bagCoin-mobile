import bot


def test_process_update_prioritizes_media_over_caption(monkeypatch):
    called = {"forward_media": None, "forward_text": 0, "reply": 0}

    monkeypatch.setattr(bot, "save_offset", lambda *_: None)
    monkeypatch.setattr(bot, "download_file", lambda _file_id: b"doc-bytes")
    monkeypatch.setattr(bot, "send_message", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(bot, "send_document_from_url", lambda *_args, **_kwargs: True)

    def fake_forward_text(*_args, **_kwargs):
        called["forward_text"] += 1
        return {"reply": "texto"}

    def fake_forward_media(chat_id, mediatype, mimetype, data_b64, username, filename="", text=""):
        called["forward_media"] = {
            "chat_id": chat_id,
            "mediatype": mediatype,
            "mimetype": mimetype,
            "username": username,
            "filename": filename,
            "text": text,
            "data_b64": data_b64,
        }
        return {"reply": "arquivo recebido"}

    monkeypatch.setattr(bot, "forward_text", fake_forward_text)
    monkeypatch.setattr(bot, "forward_media", fake_forward_media)

    update = {
        "update_id": 1,
        "message": {
            "chat": {"id": 123},
            "from": {"username": "gui"},
            "caption": "Lista de despesas e salário em formato de teste",
            "document": {
                "file_id": "abc",
                "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "file_name": "test00010010111.docx",
            },
        },
    }

    bot.process_update(update)

    assert called["forward_text"] == 0
    assert called["forward_media"] is not None
    assert called["forward_media"]["mediatype"] == "document"
    assert called["forward_media"]["filename"] == "test00010010111.docx"
    assert called["forward_media"]["text"] == "Lista de despesas e salário em formato de teste"
