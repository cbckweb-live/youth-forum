@echo off
set SENTRY_DSN=
cd /d C:\Website\youth-forum
npx next dev --port 3555 > dev_server_out.txt 2>&1
