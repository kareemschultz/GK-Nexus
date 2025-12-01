#!/bin/bash

# GK-Nexus Setup Script
# This script sets up the entire development environment

set -e

echo "=========================================="
echo "  GK-Nexus Development Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed or not in PATH${NC}"
        echo "Please install Docker Desktop and ensure it's running"
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Docker daemon is not running${NC}"
        echo "Please start Docker Desktop"
        exit 1
    fi

    echo -e "${GREEN}✓ Docker is available${NC}"
}

# Check if .env exists, if not create from example
setup_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating .env file...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        else
            echo -e "${RED}No .env.example found${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ .env file exists${NC}"
    fi
}

# Start Docker containers
start_containers() {
    echo ""
    echo -e "${YELLOW}Starting Docker containers...${NC}"
    docker compose up -d

    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5

    # Check if postgres is healthy
    until docker compose exec -T postgres pg_isready -U postgres -d gk_nexus &> /dev/null; do
        echo "Waiting for database..."
        sleep 2
    done

    echo -e "${GREEN}✓ Database is ready${NC}"
}

# Install dependencies
install_deps() {
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    bun install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Push database schema
push_schema() {
    echo ""
    echo -e "${YELLOW}Pushing database schema...${NC}"
    cd packages/db
    bun run db:push
    cd ../..
    echo -e "${GREEN}✓ Database schema pushed${NC}"
}

# Seed database
seed_database() {
    echo ""
    echo -e "${YELLOW}Seeding database with super admin...${NC}"
    cd packages/db
    bun run db:seed
    cd ../..
    echo -e "${GREEN}✓ Database seeded${NC}"
}

# Main setup flow
main() {
    echo ""

    # Run checks
    check_docker
    setup_env

    # Start services
    start_containers
    install_deps
    push_schema
    seed_database

    echo ""
    echo "=========================================="
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "You can now start the development server:"
    echo "  bun run dev"
    echo ""
    echo "Then open: http://localhost:3001"
    echo ""
    echo "Login with:"
    echo "  Email: admin@gk-nexus.com"
    echo "  Password: Admin123!@#"
    echo ""
}

# Run main function
main
