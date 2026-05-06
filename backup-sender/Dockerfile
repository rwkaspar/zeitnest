FROM alpine:latest

RUN apk add --no-cache postgresql16-client rsync bash tzdata coreutils

WORKDIR /app

COPY entrypoint.sh backup.sh restore.sh /app/
RUN chmod +x /app/*.sh

VOLUME ["/snapshots"]

ENTRYPOINT ["/app/entrypoint.sh"]
