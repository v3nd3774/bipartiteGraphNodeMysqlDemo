#/usr/bin/env bash
#
# activate virtual env FIRST
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname $SCRIPT_DIR)
API_CODE_DIR="$PROJECT_ROOT/db-interface"
cd $API_CODE_DIR
p
export OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true
opentelemetry-bootstrap -a install
opentelemetry-instrument \
    --service_name bipartiteGraphApi \
    --traces_exporter otlp,console \
    --metrics_exporter otlp,console \
    --logs_exporter otlp,console \
    flask run \
        -p 5001 \
        -h 0.0.0.0
