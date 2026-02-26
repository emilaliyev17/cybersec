# Запуск локально

```bash
cd security-onboarding
./run.sh
```

Скрипт сам сделает всё: проверит gcloud auth, поднимет Cloud SQL Proxy, запустит backend и frontend.

**Откроется на:** http://localhost:3000

## Если gcloud auth истёк

Скрипт предложит залогиниться автоматически. Если не сработало:

```bash
gcloud auth application-default login
```

Затем снова `./run.sh`.

## Остановка

`Ctrl+C` в терминале — всё остановится автоматически.
