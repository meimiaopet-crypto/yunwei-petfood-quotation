#!/usr/bin/env bash
# ============================================================
# 云威宠物食品报价系统 · 一键启动脚本
# Usage:  ./start.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}"
cat <<'EOF'
   __  __                 _     __         __  _           
  / / / /__  ____ _____  (_)___/ /  ___   / /_(_)__  __ _  
 / /_/ / _ \/ __ `/ __ \/ / __  /  / _ \ / __/ / _ \/  ' \ 
/ __  /  __/ /_/ / / / / / /_/ /  /  __// /_/ /  __/ / / /
\_/ /_/\___/\__,_/_/ /_/_/\__,_/   \___/ \__/_/\___/_/ /_/ 
  Yunwei Petfood Quotation System v1.0
EOF
echo -e "${NC}"

# 1. 检查 Node
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ 未检测到 Node.js，请先安装 Node 18+${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node ${NC}$(node -v)"

# 2. 安装依赖
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}📦 安装依赖...${NC}"
  npm install || pnpm install
fi
echo -e "${GREEN}✓ 依赖已就绪${NC}"

# 3. 环境变量
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}📝 创建 .env.local（使用 Mock 模式，无需 Supabase）${NC}"
  cp .env.example .env.local
fi
echo -e "${GREEN}✓ .env.local 已就绪${NC}"

# 4. 检查 Supabase
if grep -q "your-project" .env.local 2>/dev/null; then
  echo -e "${YELLOW}⚠️  未配置 Supabase，将以 Mock 模式运行${NC}"
  echo -e "${YELLOW}   如需完整功能（PDF/Excel 导出、跨设备同步），请编辑 .env.local 填入 Supabase URL${NC}"
  echo -e "${YELLOW}   迁移 SQL: supabase/migrations/0001_init_schema.sql + supabase/seed.sql${NC}"
fi

# 5. 启动
echo -e "${BLUE}🚀 启动开发服务器...${NC}"
echo -e "${GREEN}   → http://localhost:3000${NC}"
echo ""

npm run dev
