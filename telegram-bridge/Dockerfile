FROM python:3.11-slim
WORKDIR /app
RUN pip install httpx>=0.27.0
COPY bot.py /app/
CMD ["python", "bot.py"]
