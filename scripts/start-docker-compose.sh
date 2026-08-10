#!/usr/bin/env bash
#
# Start all services with Docker
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)

cd $PROJECT_ROOT

# Start all services
docker-compose up -d

echo "Services started:"
echo "  - MySQL: localhost:3306"
echo "  - Flask API: http://localhost:5000"
echo "  - React UI: http://localhost:3000"
echo ""
echo "Check backup restoration: docker-compose logs -f mysql-init"
echo "View all logs: docker-compose logs -f"
