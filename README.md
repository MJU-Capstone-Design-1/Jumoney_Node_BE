# Jumoney_Node_BE

한국투자증권(KIS) REST/WebSocket을 연동하여 시세 데이터를 수집·서빙하는 Node.js(TypeScript) 백엔드.
EC2 위에서 **Docker + docker compose**로 Node 앱과 Redis를 함께 운영합니다.

---

## 기술 스택

- Node.js 22 (alpine), TypeScript 5.9
- Express 5, ws 8 (KIS 실시간 시세)
- Redis 7 (`ioredis`) — 시세 히스토리 ZSET, 최신값 캐시
- 패키지 매니저: `pnpm@10.31.0` (corepack)

## 디렉토리

```
src/
  index.ts        # 부트스트랩 + listen + graceful shutdown
  app.ts          # Express 앱, /health, /price/:code
  websocket.ts    # KIS 실시간 시세 → Redis 적재
Dockerfile        # 멀티스테이지 (builder → deps → runtime)
docker-compose.yml
.env.example      # 환경변수 템플릿
```

---

## 로컬 개발

```bash
pnpm install
cp .env.example .env   # 값 채우기
pnpm dev               # tsx watch
```

## 빌드 / 타입체크

```bash
pnpm build       # tsc -> dist/
pnpm typecheck
pnpm test
```

---

## EC2 배포 (Docker + docker compose)

> 기존 PM2 직접 실행 방식에서 컨테이너 운영으로 전환합니다.

### 1) EC2 사전 준비 (1회)

Amazon Linux 2023 기준:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # 적용 위해 재로그인
# docker compose plugin
DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/libexec/docker}
sudo mkdir -p $DOCKER_CONFIG/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
sudo chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
docker --version && docker compose version
```

Ubuntu 계열은 `apt-get install docker.io docker-compose-plugin`으로 대체.

### 2) 보안그룹

- 인바운드 `3000/tcp` 허용 (또는 추후 80/443 + 리버스 프록시)
- Redis 6379는 **외부에 노출하지 않음** — compose 내부 네트워크에서만 접근

### 3) 기존 PM2 정리 (회귀 대비 백업)

```bash
pm2 save                 # 현재 프로세스 목록 보존(롤백용)
pm2 stop all
pm2 delete all
# 시스템 재부팅 시 자동기동 해제
pm2 unstartup systemd || true
```

### 4) 코드/환경변수 배치

```bash
git clone <repo>  Jumoney_project   # 최초
cd Jumoney_project
cp .env.example .env
vi .env   # KIS 키, REDIS_PASSWORD 등 채우기. REDIS_HOST=redis 유지
```

### 5) 기동

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

### 6) 동작 확인

```bash
curl -s localhost:3000/health
curl -s localhost:3000/price/005930 | jq .
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ZCARD stock:history:005930
```

---

## 일상 배포 루프

```bash
ssh ec2
cd Jumoney_project
git pull
docker compose up -d --build
docker compose logs -f app
```

롤백:

```bash
git checkout <previous-sha>
docker compose up -d --build
```

---

## 운영 메모

- 컨테이너 로그는 `json-file` 드라이버로 회전(`max-size: 10m`, `max-file: 5`) — 디스크 보호
- Redis는 `appendonly yes` + named volume `redis-data`로 영속화
- 컨테이너 재시작 정책 `unless-stopped` — 호스트 재부팅/크래시 시 자동 복구
- `restart: unless-stopped`는 프로세스 단위 재시작만 보장. KIS WebSocket 자체 끊김에 대한 reconnect 로직은 `src/websocket.ts`에 별도 추가 권장
- 앱이 사용하는 환경변수 정의는 `.env.example` 참고

### 기존 원격 Redis(13.209.125.199) 데이터 이관(선택)

현재 코드는 시세 히스토리/최신값만 저장하므로 무손실 이관이 필수가 아니라면 생략 가능합니다.
필요 시:

```bash
# 기존 호스트에서
redis-cli -h 13.209.125.199 -a mju_redis --rdb /tmp/dump.rdb
scp /tmp/dump.rdb new-ec2:/tmp/

# 신규 EC2에서
docker compose stop redis
docker cp /tmp/dump.rdb jumoney-redis:/data/dump.rdb
docker compose start redis
```
