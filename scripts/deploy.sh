#!/usr/bin/env bash
set -euo pipefail

# Blue/Green 무중단 배포 스크립트
# - 현재 활성 색을 Nginx active include 파일에서 감지
# - 반대 색을 빌드/기동 → /health 확인 → Nginx upstream 스위치 → 구 색 정지

ACTIVE_FILE="${ACTIVE_FILE:-/etc/nginx/conf.d/jumoney-active.conf}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

if [[ ! -f "$ACTIVE_FILE" ]]; then
  echo "[deploy] active file not found: $ACTIVE_FILE" >&2
  echo "[deploy] 초기 셋업이 필요합니다. 플랜의 '초기 1회 셋업'을 참고하세요." >&2
  exit 1
fi

current_port="$(grep -oE '300[12]' "$ACTIVE_FILE" | head -n1 || true)"
case "$current_port" in
  3001) new_color=green; new_port=3002; old_color=blue  ;;
  3002) new_color=blue;  new_port=3001; old_color=green ;;
  *)
    echo "[deploy] active file에서 포트(3001/3002)를 못 찾음. 기본값 blue로 시작합니다." >&2
    new_color=blue; new_port=3001; old_color=green
    ;;
esac

echo "[deploy] active=${current_port:-none} → switching to ${new_color}(${new_port})"

"${COMPOSE[@]}" build "app-${new_color}"
"${COMPOSE[@]}" up -d "app-${new_color}"

# health 체크 (최대 30회 × 2s = 60s)
healthy=0
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${new_port}/health" >/dev/null 2>&1; then
    echo "[deploy] ${new_color} healthy (try=${i})"
    healthy=1
    break
  fi
  sleep 2
done

if [[ "$healthy" -ne 1 ]]; then
  echo "[deploy] health check 실패 — ${new_color} 컨테이너를 정지합니다." >&2
  "${COMPOSE[@]}" stop "app-${new_color}" || true
  exit 1
fi

# Nginx upstream 스위치
sudo /bin/sed -i "s|127.0.0.1:[0-9]\+|127.0.0.1:${new_port}|" "$ACTIVE_FILE"
sudo /usr/sbin/nginx -t
sudo /usr/sbin/nginx -s reload

# 트래픽 드레인 후 구 색 정지
sleep 5
"${COMPOSE[@]}" stop "app-${old_color}" || true

echo "[deploy] done. active=${new_color}(${new_port})"
