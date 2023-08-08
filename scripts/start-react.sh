#/usr/bin/env bash
#
# Installs serve and starts static server for apache to use
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)
UI_CODE_DIR="$PROJECT_ROOT/react-d3"
cd $UI_CODE_DIR
npm install -g serve
# below starts on TCP 3000
serve -s build
