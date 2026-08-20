# Сборка демо Cortex.
#
# pnpm-монорепозиторий: рабочие пакеты ui, tokens, icons подтягиваются
# через workspace, поэтому копируется весь корень, а не одно приложение.
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /src
COPY . .
# --frozen-lockfile=false: lock собран на другой платформе, и жёсткая
# сверка падает на необязательных бинарных зависимостях.
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter cortex-demo build

FROM nginx:1.27-alpine
# Одностраничное приложение: любой путь отдаёт index.html, иначе прямой
# заход по адресу внутри приложения давал бы 404 от статики.
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
  location /healthz { return 200 "ok"; add_header Content-Type text/plain; }\n\
}\n' > /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/cortex-demo/dist /usr/share/nginx/html
