FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5001

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && python -m pip install --no-cache-dir 'gunicorn>=23,<24'

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5001} app:app"]