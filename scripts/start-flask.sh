#/usr/bin/env bash
#
# activate virtual env FIRST
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)
API_CODE_DIR="$PROJECT_ROOT/db-interface"
cd $API_CODE_DIR
python3 app.py
