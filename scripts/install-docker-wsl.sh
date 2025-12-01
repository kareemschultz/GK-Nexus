#!/bin/bash

# Docker Installation Script for Ubuntu WSL
# Run this script with: sudo bash scripts/install-docker-wsl.sh

set -e

echo "=========================================="
echo "  Installing Docker in Ubuntu WSL"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script with sudo${NC}"
    echo "Usage: sudo bash scripts/install-docker-wsl.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}

echo -e "${YELLOW}Step 1: Removing old Docker installations...${NC}"
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

echo -e "${YELLOW}Step 2: Installing prerequisites...${NC}"
apt-get update
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo -e "${YELLOW}Step 3: Adding Docker's official GPG key...${NC}"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo -e "${YELLOW}Step 4: Setting up Docker repository...${NC}"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

echo -e "${YELLOW}Step 5: Installing Docker Engine...${NC}"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo -e "${YELLOW}Step 6: Starting Docker service...${NC}"
service docker start || true

echo -e "${YELLOW}Step 7: Adding user to docker group...${NC}"
usermod -aG docker $ACTUAL_USER

echo -e "${YELLOW}Step 8: Testing Docker installation...${NC}"
docker --version
docker compose version

echo ""
echo "=========================================="
echo -e "${GREEN}  Docker Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "IMPORTANT: To use Docker without sudo:"
echo "  1. Log out and log back in, OR"
echo "  2. Run: newgrp docker"
echo ""
echo "Then start Docker with:"
echo "  sudo service docker start"
echo ""
echo "After that, run the GK-Nexus setup:"
echo "  cd /home/kareem/GK-Nexus"
echo "  docker compose up -d"
echo "  bun run db:push"
echo "  bun run db:seed"
echo "  bun run dev"
echo ""
