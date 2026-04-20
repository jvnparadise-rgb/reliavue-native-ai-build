FROM python:3.11-slim

WORKDIR /app

COPY apps/worker/app /app/app

CMD ["python", "-c", "from app.main import main; main()"]
