#/usr/bin/env bash
#
# Replaces instances of 'localhost' with live idir url.
# This enables deployment on server instead of using development url.
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)
UI_CODE_DIR="$PROJECT_ROOT/react-d3/src"
REPLACE_0=("localhost" "idir.uta.edu")
REPLACE_1=("5000" "443")
REPLACE_2=("environ" "bipartiteGraphApi/environ")
REPLACE_3=("http" "https")
MAIN_ARRAY=(
  REPLACE_0[@]
  REPLACE_1[@]
  REPLACE_2[@]
  REPLACE_3[@]
)

# https://stackoverflow.com/a/28308205
COUNT=${#MAIN_ARRAY[@]}
for ((i=0; i<$COUNT; i++))
do
  OLD_VAL=${!MAIN_ARRAY[i]:0:1}
  NEW_VAL=${!MAIN_ARRAY[i]:1:1}
  echo "OLD_VALUE=${OLD_VAL} /|\ NEW_VALUE=${NEW_VAL}"
  perl -pi.stage-$i.bak -e "s:$OLD_VAL:$NEW_VAL:g" $UI_CODE_DIR/*.js
done
