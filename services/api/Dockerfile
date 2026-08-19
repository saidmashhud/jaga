FROM golang:1.23-alpine AS build
WORKDIR /src
COPY services/api/go.mod services/api/go.sum* ./
RUN go mod download 2>/dev/null || true
COPY services/api/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/cortex-api .

FROM alpine:3.20
RUN adduser -D -u 10001 app
COPY --from=build /out/cortex-api /usr/local/bin/cortex-api
USER app
EXPOSE 8050
ENTRYPOINT ["/usr/local/bin/cortex-api"]
