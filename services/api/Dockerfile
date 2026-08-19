FROM golang:1.23-alpine AS build
WORKDIR /src
COPY services/api/ ./
# go.sum в репозитории нет: зависимость одна, и tidy её разрешает сам
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/cortex-api .

FROM alpine:3.20
RUN adduser -D -u 10001 app
COPY --from=build /out/cortex-api /usr/local/bin/cortex-api
USER app
EXPOSE 8050
ENTRYPOINT ["/usr/local/bin/cortex-api"]
