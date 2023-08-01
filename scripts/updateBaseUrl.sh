#/usr/bin/env bash
#
# Replaces instances of 'localhost' with live idir url.
# This enables deployment on server instead of using development url.
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)
UI_CODE_DIR="$PROJECT_ROOT/react-d3"
OLD_VAL='"homepage": "/"'
NEW_VAL='"homepage": "/bipartiteGraphUi"'

echo "OLD_VALUE=${OLD_VAL} /|\ NEW_VALUE=${NEW_VAL}"
echo "perl -pi.bak -e 's@$OLD_VAL@$NEW_VAL@g' $UI_CODE_DIR/package.json"
perl -pi.bak -e "s@$OLD_VAL@$NEW_VAL@g" $UI_CODE_DIR/package.json
