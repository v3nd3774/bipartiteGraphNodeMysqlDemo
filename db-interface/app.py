"""
Runs the API DB interface for returning data for bipartite graph visualizer.
"""
import signal
import time
import atexit
import os
import sys
import copy
import json
import datetime
import pandas as pd
import numpy as np
from functools import reduce
from typing import Dict, List, TypeAlias, Final, Any, Literal, Sequence, Mapping
from typing_extensions import TypedDict
from flask import Response, request, Flask
from typeguard import check_type
from flask_caching import Cache
from sqlalchemy import create_engine, text, pool, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from opentelemetry.sdk.resources import SERVICE_NAME, Resource

from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.flask import FlaskInstrumentor

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter
)

from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import (
    PeriodicExportingMetricReader,
    ConsoleMetricExporter
)


debug_mode: bool = len(sys.argv) > 1 and sys.argv[1] == "debug"

if not debug_mode:
    resource: Resource = Resource(attributes={
        SERVICE_NAME: "bipartiteGraphApi"
    })
    OTLP_ENDPOINT: str = "http://localhost:4318"
    OTLP_V: str = "v1"
    tracer_provider = TracerProvider(resource=resource)
    processors = [
        BatchSpanProcessor(ConsoleSpanExporter()),
        BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{OTLP_ENDPOINT}/{OTLP_V}/traces"))
    ]
    for processor in processors:
        tracer_provider.add_span_processor(processor)
    trace.set_tracer_provider(tracer_provider)
    # tracer = trace.get_tracer("bipartiteGraphApiInternalTracer")
    metric_readers: List[PeriodicExportingMetricReader] = [
        PeriodicExportingMetricReader(ConsoleMetricExporter()),
        PeriodicExportingMetricReader(OTLPMetricExporter(
            endpoint=f"{OTLP_ENDPOINT}/{OTLP_V}/metrics"
        ))
    ]
    metric_provider: MeterProvider = MeterProvider(resource=resource, metric_readers=metric_readers)
    metrics.set_meter_provider(metric_provider)
    # meter = metrics.get_meter("bipartiteGraphApiInternalMetric")



CONFIG_KEYS: Final[List[str]] = [
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DB",
    "MYSQL_JOIN_QUERY",
    "MYSQL_LABEL_COLUMN",
    "MYSQL_LABELER_COLUMN",
    "MYSQL_LABELEE_ID_COLUMN",
    "MYSQL_LABELEE_CONTENT_COLUMN",
    "MYSQL_TIME_COLUMN",
    "MYSQL_OUTPUT_TIME_FORMAT",
    "MYSQL_LABELER_QUALITY_COLUMN"
]
config: Dict[str, str] = {
    x: os.environ[x] for x in CONFIG_KEYS
}

datefmt_two: str = "%Y-%m-%d %H:%M:%S"

Cache_Config_Type = TypedDict("Cache_Config_Type", {
    "CACHE_TYPE": str,
    "CACHE_DEFAULT_TIMEOUT": int,
    "DEBUG": bool
})
cache_config: Cache_Config_Type = {
    "CACHE_TYPE": "SimpleCache",
    "CACHE_DEFAULT_TIMEOUT": 86400, # 1 day
    "DEBUG": debug_mode
}

app: Flask = Flask(__name__)

app.config.from_mapping(cache_config)
cache: Cache = Cache(app)

FlaskInstrumentor().instrument_app(app) # type: ignore
FlaskInstrumentor().instrument(enable_commenter=True, commenter_options={})

url: str = ":".join([
    "mysql+pymysql",
    f"//{config['MYSQL_USER']}",
    f"{config['MYSQL_PASSWORD']}@{config['MYSQL_HOST']}",
    f"{config['MYSQL_PORT']}/{config['MYSQL_DB']}?charset=utf8"
])

global engine
engine = None

global instrumented
instrumented: bool = False

global listeners_attached
listeners_attached: bool = False

def setup_engine_listeners():
    global listeners_attached
    if listeners_attached or engine is None:
        return

    def checkout_listener(dbapi_connection, connection_record, connection_proxy):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
        except Exception:
            raise

    def engine_connect_listener(connection, branch):
        print(f"New connection established: {connection}")

    # Use event.listen() instead of decorator
    event.listen(engine, "checkout", checkout_listener)
    event.listen(engine, "engine_connect", engine_connect_listener)
    listeners_attached = True

def setup_instrumentation():
    global engine, instrumented
    if instrumented or engine is None:
        return
    try:
        SQLAlchemyInstrumentor().instrument(engine=engine)
        instrumented = True
    except Exception as e:
        print(f"Failed to instrument SQLAlchemy: {e}")

def populate_engine() -> None:
    global engine, instrumented, listeners_attached
    engine = create_engine(
        url,
        pool_size=5,           # Maximum connections in pool
        max_overflow=10,       # Extra connections if pool is full
        pool_pre_ping=True,    # Check connection before using (CRITICAL!)
        pool_recycle=3600,     # Recycle connections after 1 hour
        pool_timeout=30,       # Timeout for getting connection
        echo_pool=True         # Log pool activity (for debugging)
    )
    if not instrumented:
        setup_instrumentation()
    if not listeners_attached:
        setup_engine_listeners()

RawRowType: TypeAlias = Dict[str, str | int | datetime.datetime]

RowType: TypedDict = TypedDict("RowType", {
    'source': str,
    'target': str,
    'time': str,
    'label': str,
    'content': str,
    'user_quality_score': int,
    'value': int
})
UniqueNodeCnt: TypedDict = TypedDict("UniqueNodeCnt",{
    "label": str,
    "cnt": int
})
SummaryStatsType: TypedDict = TypedDict("SummaryStatsType", {
    "edge_cnt": int,
    "unique_node_set_size": Mapping[Literal["LHS", "RHS"], int],
    "unique_node_cnts": Mapping[Literal["LHS", "RHS"], Sequence[UniqueNodeCnt]],
    "min_date": str,
    "max_date": str
})

@cache.memoize()
def csv_to_array_of_dictionaries(file_path: str) -> List[RawRowType]:
    """Reads a CSV file into an array of dictionaries.

    Args:
        file_path: The path to the CSV file.

    Returns:
        A list of dictionaries, where each dictionary represents a row
        in the CSV file and keys are taken from the header row.
        Returns an empty list if the file is not found or an error occurs.
    """
    print(f"\n=== DEBUG: Reading CSV file: {file_path} ===")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print(f"Total lines in file: {len(lines)}")
            print("First 5 lines of raw CSV:")
            for i, line in enumerate(lines[:5]):
                print(f"  Line {i+1}: {line.strip()}")
    except Exception as e:
        print(f"Error reading raw file: {e}")
    print("=== END DEBUG ===\n")
    print(f"Columns expected: username, id, time, label, text, user_quality_score")
    try:
        # Force pandas to read all columns as strings first to avoid conversion issues
        df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return []
    except pd.errors.EmptyDataError:
        print(f"Error: Empty CSV file at {file_path}")
        return []
    except Exception as e:
        print(f"Error reading CSV file {file_path}: {e}")
        return []

    # Check if dataframe is empty
    if df.empty:
        print(f"Warning: CSV file {file_path} is empty")
        return []

    # Convert to records
    intermed = df.to_dict('records')
    out = []

    for item in intermed:
        # Check for empty strings or None values
        if any([v == '' or v is None for v in item.values()]):
            print(f"Skipping item due to empty values: {item}")
            continue

        try:
            # Convert time column to datetime
            time_value = item.get('time', '')
            if time_value:
                # Parse the time string
                parsed_time = datetime.datetime.strptime(time_value, "%Y-%m-%d %H:%M:%S")
                # Convert numeric fields
                data = {
                    'username': item.get('username', ''),
                    'id': int(item.get('id', 0)) if item.get('id', '').strip() else 0,
                    'time': parsed_time,
                    'label': item.get('label', ''),
                    'text': item.get('text', ''),
                    'user_quality_score': float(item.get('user_quality_score', 0)) if item.get('user_quality_score', '').strip() else 0.0
                }
                out.append(data)
            else:
                print(f"Skipping item due to missing time: {item}")
        except Exception as e:
            print(f"Error processing item: {e}")
            print(f"Item: {item}")
            # Don't break - continue with next item
            continue

    print(f"Successfully loaded {len(out)} rows from {file_path}")
    return out

@cache.memoize()
def run_query(query: str, max_retries: int = 2) -> List[RawRowType]:
    """Runs a query with retry logic for connection issues."""
    if debug_mode:
        print("\n========== SQL QUERY START ==========")
        print(query)
        print("=====================================\n")
    for attempt in range(max_retries):
        try:
            with engine.connect() as connection:
                if debug_mode:
                    db_name = connection.execute(text("SELECT DATABASE()")).scalar()
                    print(f"Connected database: {db_name}")
                    print(f"Attempt: {attempt + 1}")
                result: List[RawRowType] = [
                    r._asdict()
                    for r in connection.execute(text(query))
                ]
                if debug_mode:
                    print(f"Rows returned: {len(result)}")
                    if result:
                        print("First row:")
                        print(json.dumps(result[0], default=str, indent=2))
                        if len(result) > 1:
                            print("Second row:")
                            print(json.dumps(result[1], default=str, indent=2))
                    else:
                        print("WARNING: Query returned zero rows")
                    print("========== SQL QUERY END ==========\n")

            return result
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database error, retrying... (attempt {attempt + 1}/{max_retries})")
                time.sleep(2 ** attempt)  # Exponential backoff
                # Force pool disconnect
                engine.dispose()
            else:
                raise e
    return []

def row_jsonifier_simple( # pylint: disable=too-many-arguments
    row: RawRowType,
    source_col: str = config['MYSQL_LABELER_COLUMN'],
    target_col: str = config['MYSQL_LABELEE_ID_COLUMN'],
    time_col: str = config['MYSQL_TIME_COLUMN'],
    time_format: str = config["MYSQL_OUTPUT_TIME_FORMAT"],
    label_col: str = config['MYSQL_LABEL_COLUMN'],
    content_col: str = config["MYSQL_LABELEE_CONTENT_COLUMN"],
    user_quality_score_col: str = config["MYSQL_LABELER_QUALITY_COLUMN"]) -> RowType:
    """ Converts a row into a consistent format for use in graph generation. """
    return {
        'source': row[source_col], # type: ignore
        'target': row[target_col], # type: ignore
        'time': row[time_col].strftime(time_format), # type: ignore
        'label': row[label_col], # type: ignore
        'content': row[content_col], # type: ignore
        'user_quality_score': row[user_quality_score_col], # type: ignore
        'value': 1
    }

def row_jsonifier_enrich(row: RowType, summary_stats: SummaryStatsType) -> RowType:
    """ Enriches a row with additional data from the summary stats. """
    output_data: RowType = row
    source_key: str = row["source"]
    target_key: str = row["target"]
    source_summary: UniqueNodeCnt = list(filter(lambda x: x["label"] == source_key,
                                                summary_stats["unique_node_cnts"]["LHS"]))[0]
    target_summary: UniqueNodeCnt = list(filter(lambda x: x["label"] == target_key,
                                                summary_stats["unique_node_cnts"]["RHS"]))[0]
    edge_connections: int = source_summary["cnt"] + target_summary["cnt"]
    output_data['value'] = edge_connections
    return output_data

def lst_2_frq(
        acc: Mapping[Literal["LHS","RHS"], Dict[str, int]],
        d: RowType
    ) -> Mapping[Literal["LHS", "RHS"], Dict[str, int]]:
    """ Converts a list to a dict of frequencies for each half of bipartite graph. """
    acc["LHS"][d["source"]] = acc["LHS"].get(d["source"], 0) + 1
    acc["RHS"][d["target"]] = acc["RHS"].get(d["target"], 0) + 1
    return acc

def calculate_summary_stats(data: Sequence[RowType]) -> SummaryStatsType:
    """ Calculates summary statistics from raw data. """
    edge_cnt: int = len(data)
    nodes: Mapping[Literal["LHS", "RHS"], Sequence[str]] = {
        "LHS": [x['source'] for x in data],
        "RHS": [x['target'] for x in data]
    }
    unique_nodes: Mapping[Literal["LHS", "RHS"], set[str]] = {k:set(v) for k,v in nodes.items()}
    unique_node_set_size: Mapping[Literal["LHS", "RHS"], int] = {
        k:len(v) for k,v in unique_nodes.items()
    }
    unique_node_cnts_raw: Mapping[Literal["LHS", "RHS"], Dict[str, int]] = reduce(
        lst_2_frq,
        data,
        {"LHS":{}, "RHS":{}}
    )
    unique_node_cnts: Mapping[Literal["LHS", "RHS"], Sequence[UniqueNodeCnt]] = {
        "LHS": [
           {
               "label": k,
               "cnt": v
           } for k, v in unique_node_cnts_raw["LHS"].items()
        ],
        "RHS": [
            {
               "label": k,
               "cnt": v
           } for k, v in unique_node_cnts_raw["RHS"].items()
        ]
    }

    try:
        min_date: datetime.datetime = min([string_to_datetime(x["time"], datefmt=datefmt_two) for x in data]) - datetime.timedelta(days=1)
        max_date: datetime.datetime = max([string_to_datetime(x["time"], datefmt=datefmt_two) for x in data]) + datetime.timedelta(days=1)
    except ValueError as e:
        print(e)
        print("Data is empty, setting min and max date to current date...")
        min_date = datetime.datetime.now()
        max_date = min_date

    return {
        "edge_cnt": edge_cnt,
        "unique_node_set_size": unique_node_set_size,
        "unique_node_cnts": unique_node_cnts,
        "min_date": min_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "max_date": max_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    }

ReturnDataType: TypedDict = TypedDict("ReturnDataType", {
    "data": List[RowType],
    "summary_stats": SummaryStatsType
})

def determine_nodes_to_remove(data: Sequence[UniqueNodeCnt], thresh: int) -> Sequence[str]:
    """ Determines the nodes to remove based on a threshold. """
    nodes_to_remove: List[str] = []
    for record in data:
        if record["cnt"] < thresh:
            nodes_to_remove.append(record["label"])
    return nodes_to_remove

def remove_nodes(data: Sequence[RowType], lhs_to_remove: Sequence[str],
                 rhs_to_remove: Sequence[str]) -> Sequence[RowType]:
    """ Removes nodes from the data based on the nodes to remove. """
    output_data: Sequence[RowType] = [
        x for x in data
        if x['source'] not in lhs_to_remove
        and x['target'] not in rhs_to_remove
    ]
    return output_data

class RawTimeFilter(TypedDict):
    """ One Time filter for data. HH:MM:SS """
    start: str
    end: str

class RawTimeFilters(TypedDict):
    """ One or more Time filters for data."""
    time_filters: Sequence[RawTimeFilter]

class TimeFilter(TypedDict):
    """ One Time filter for data. HH:MM:SS """
    start: tuple[int, int, int]
    end: tuple[int, int, int]

class TimeFilters(TypedDict):
    """ One or more Time filters for data."""
    time_filters: Sequence[TimeFilter]

def raw_time_filters_to_time_filters(raw: RawTimeFilters) -> TimeFilters:
    """ Converts raw time filters to time filters. """
    return {
        "time_filters": [
            {
                "start": string_to_time_tuple(x["start"]),
                "end": string_to_time_tuple(x["end"])
            } for x in raw["time_filters"]
        ]
    }

def string_to_time_tuple(x: str) -> tuple[int, int, int]:
    """ Converts a string to a time tuple. """
    portions: Sequence[str] = x.split(":")
    return (int(portions[0]), int(portions[1]), int(portions[2]))

class RawDateTimeFilter(TypedDict):
    """ One DateTime filter for data. YYYY-MM-DDTHH:MM:SS """
    start: str
    end: str

class DateTimeFilter(TypedDict):
    """ One DateTime filter for data. YYYY-MM-DDTHH:MM:SS """
    start: datetime.datetime
    end: datetime.datetime

def string_to_datetime(x: str, datefmt: str = "%Y-%m-%dT%H:%M:%S.%fZ") -> datetime.datetime:
    """ Converts a string to a datetime object. """
    return datetime.datetime.strptime(x, datefmt)

class RawDateTimeFilters(TypedDict):
    """ One or more DateTime filters for data. as strings"""
    datetime_filters: Sequence[RawDateTimeFilter]

class DateTimeFilters(TypedDict):
    """ One or more DateTime filters for data. as datetime objects"""
    datetime_filters: Sequence[DateTimeFilter]

def raw_datetime_filters_to_datetime_filters(raw: RawDateTimeFilters) -> DateTimeFilters:
    """ Converts raw datetime filters to datetime filters. """
    return {
        "datetime_filters": [
            {
                "start": string_to_datetime(x["start"]),
                "end": string_to_datetime(x["end"])
            } for x in raw["datetime_filters"]
        ]
    }

def data_jsonifier(
    raw_data: List[RawRowType],
    skip_label: Any = 0,
    lhs_thresh: int = 0,
    rhs_thresh: int = 0,
    time_filters: TimeFilters | None = None,
    datetime_filters: DateTimeFilters | None = None,
    no_skip: bool = False
    ) -> ReturnDataType:
    """
    Applies jsonifier to raw data to organize in consistent format.
    Also calculates and includes summary stats in this format.
    """
    data: Sequence[RowType] = [row_jsonifier_simple(row, ) for row in raw_data]
    summary_stats: SummaryStatsType = calculate_summary_stats(data)
    min_date: str = summary_stats["min_date"]
    max_date: str = summary_stats["max_date"]
    if lhs_thresh > 0 or rhs_thresh > 0:
        lhs_to_remove: Sequence[str] = []
        rhs_to_remove: Sequence[str] = []
        if lhs_thresh > 0:
            lhs_to_remove = determine_nodes_to_remove(
                summary_stats["unique_node_cnts"]["LHS"], lhs_thresh
            )
        if rhs_thresh > 0:
            rhs_to_remove = determine_nodes_to_remove(
                summary_stats["unique_node_cnts"]["RHS"], rhs_thresh
            )
        data = remove_nodes(data, lhs_to_remove, rhs_to_remove)
    if datetime_filters:
        for dt_filter in datetime_filters["datetime_filters"]:
            data = [
                x for x in data
                if dt_filter["start"] <= string_to_datetime(x["time"], datefmt=datefmt_two) <= dt_filter["end"]
            ]
    if time_filters:
        for t_filter in time_filters["time_filters"]:
            data = [
                x for x in data
                if t_filter["start"] <= string_to_time_tuple(x["time"].split(" ")[1]) <= t_filter["end"]
            ]
    if no_skip:
        data = [x for x in data if x['label'] != skip_label]
    summary_stats = calculate_summary_stats(data)
    summary_stats["min_date"] = min_date
    summary_stats["max_date"] = max_date
    output_data = [row_jsonifier_enrich(record, summary_stats) for record in data]
    return {
        "data":output_data,
        "summary_stats":summary_stats
    }


def check_query_safety(x: str) -> bool:
    """
    Confirms that query is safe to apply to database
    and does not perform destructive activity.
    """
    normalized: str = x.lower().strip()
    unwanted_strings: List[str] | None = None
    with open("./unwanted_strings.txt", "r", encoding="utf-8") as f:
        unwanted_strings = [s.lower() for s in f.readlines()]
    assert unwanted_strings, "Unwanted sql strings not loaded properly..."
    checks: List[bool] = [
            normalized[0:6] == "select",
            *[uwnt not in normalized for uwnt in unwanted_strings]
    ]
    return all(checks)

@app.route("/custom", methods=["POST", "OPTIONS"])
def serve_custom() -> Response:
    """ Returns the data after using the custom fields sent in a POST request. """
    r: Response = Response()
    r.headers.add("Access-Control-Allow-Origin", "*")
    r.headers.add('Access-Control-Allow-Headers', "*")
    r.headers.add('Access-Control-Allow-Methods', "*")
    if request.method != "OPTIONS": # preflight
        # customRequest leverages environ file as defaults with options passed in
        # overriding other options defined in structure below
        request_struct: Dict[str, str] = copy.deepcopy(config)
        request_struct.update(request.get_json())
        r.set_data("Error with connecting to sql")
        r.status_code = 500
        ####
        ####
        ##
        ## THIS WILL FAIL FOR QUERIES THAT CAUSE MYSQL TO TRY TO USE /TMP as ITS OWNED BY ROOT;
        ## need to chat with team on how to address this issue
        ##
        ####
        ####
        query: str = request_struct["MYSQL_JOIN_QUERY"]
        qsafe: bool = check_query_safety(query)
        if qsafe:
            result: List[RawRowType] = run_query(request_struct["MYSQL_JOIN_QUERY"])
            lhs_thresh: int = int(request.args.get("LHSThresh", 0))
            rhs_thresh: int = int(request.args.get("RHSThresh", 0))
            no_skip: bool = bool(request.args.get("OmitSkip", 0))
            time_filters_string: str = request.args.get("TimeFilters", "")
            untyped_time_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(time_filters_string)
            raw_t_filters: Sequence[RawTimeFilter] = []
            for x in untyped_time_filters["time_filters"]:
                assert "start" in x, "Time filter must have start"
                assert "end" in x, "Time filter must have end"
                typed_time_filter: RawTimeFilter = {
                    "start": x["start"],
                    "end": x["end"]
                }
                raw_t_filters = [*raw_t_filters, typed_time_filter]
            raw_time_filters: RawTimeFilters = { "time_filters": raw_t_filters }
            time_filters: TimeFilters = raw_time_filters_to_time_filters(raw_time_filters)
            datetime_filters_string: str = request.args.get("DateTimeFilters", "")
            untyped_datetime_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(datetime_filters_string)
            raw_dt_filters: Sequence[RawDateTimeFilter] = []
            for x in untyped_datetime_filters["datetime_filters"]:
                assert "start" in x, "DateTime filter must have start"
                assert "end" in x, "DateTime filter must have end"
                typed_datetime_filter: RawDateTimeFilter = {
                    "start": x["start"],
                    "end": x["end"]
                }
                raw_dt_filters = [*raw_dt_filters, typed_datetime_filter]
            raw_datetime_filters: RawDateTimeFilters = {"datetime_filters": raw_dt_filters}
            datetime_filters: DateTimeFilters = raw_datetime_filters_to_datetime_filters(
                raw_datetime_filters
            )
            data: ReturnDataType = data_jsonifier(result,
                                                  lhs_thresh=lhs_thresh,
                                                  rhs_thresh=rhs_thresh,
                                                  time_filters=time_filters,
                                                  datetime_filters=datetime_filters,
                                                  no_skip=no_skip)
            r.set_data(json.dumps(data))
            r.status_code = 200
            r.mimetype = "application/json"
        else:
            r.set_data("Only allowed SELECT queries...")
            print(json.dumps(request_struct))
            r.status_code = 405
    return r

@app.route("/environ", methods=["GET", "OPTIONS"])
@cache.cached(query_string=True)
def serve_environ() -> Response:
    """ Returns the row using the environment config to extract necessary data. """
    r: Response = Response()
    if request.method == "OPTIONS": # preflight
        r.headers.add("Access-Control-Allow-Origin", "*")
        r.headers.add('Access-Control-Allow-Headers', "*")
        r.headers.add('Access-Control-Allow-Methods', "*")
    else: # actual req
        result: List[RawRowType] = run_query(config["MYSQL_JOIN_QUERY"])
        lhs_thresh: int = int(request.args.get("LHSThresh", 0))
        rhs_thresh: int = int(request.args.get("RHSThresh", 0))
        no_skip: bool = bool(request.args.get("OmitSkip", 0))
        time_filters_string: str = request.args.get("TimeFilters", [])
        untyped_time_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(time_filters_string)
        raw_t_filters: Sequence[RawTimeFilter] = []
        for x in untyped_time_filters["time_filters"]:
            assert "start" in x, "Time filter must have start"
            assert "end" in x, "Time filter must have end"
            typed_time_filter: RawTimeFilter = {
                "start": x["start"],
                "end": x["end"]
            }
            raw_t_filters = [*raw_t_filters, typed_time_filter]
        raw_time_filters: RawTimeFilters = { "time_filters": raw_t_filters }
        time_filters: TimeFilters = raw_time_filters_to_time_filters(raw_time_filters)
        datetime_filters_string: str = request.args.get("DateTimeFilters", "")
        untyped_datetime_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(datetime_filters_string)
        raw_dt_filters: Sequence[RawDateTimeFilter] = []
        for x in untyped_datetime_filters["datetime_filters"]:
            assert "start" in x, "DateTime filter must have start"
            assert "end" in x, "DateTime filter must have end"
            typed_datetime_filter: RawDateTimeFilter = {
                "start": x["start"],
                "end": x["end"]
            }
            raw_dt_filters = [*raw_dt_filters, typed_datetime_filter]
        raw_datetime_filters: RawDateTimeFilters = {"datetime_filters": raw_dt_filters}
        datetime_filters: DateTimeFilters = raw_datetime_filters_to_datetime_filters(
            raw_datetime_filters
        )
        data: ReturnDataType = data_jsonifier(result,
                                              lhs_thresh=lhs_thresh,
                                              rhs_thresh=rhs_thresh,
                                              time_filters=time_filters,
                                              datetime_filters=datetime_filters,
                                              no_skip=no_skip)

        r = Response(response=json.dumps(data), status=200, mimetype="application/json")
        r.headers.add("Access-Control-Allow-Origin", "*")
    return r


@app.route("/availabletestingdata", methods=["GET", "OPTIONS"])
@cache.cached(query_string=True)
def serve_data_list() -> Response:
    """ Returns the row using the environment config to extract necessary data. """
    r: Response = Response()
    if request.method == "OPTIONS": # preflight
        r.headers.add("Access-Control-Allow-Origin", "*")
        r.headers.add('Access-Control-Allow-Headers', "*")
        r.headers.add('Access-Control-Allow-Methods', "*")
    else: # actual req
        filepath_spec_str: str = os.environ["CSV_SAMPLE_FILEPATHS"]
        filepath_spec_pairs: Sequence[str] = filepath_spec_str.split(",")
        available_datasets: Sequence[str] = [pair.split("=")[0] for pair in filepath_spec_pairs]
        output: Mapping[str, Sequence[str]] = { "available_datasets": available_datasets }
        r = Response(response=json.dumps(output), status=200, mimetype="application/json")
        r.headers.add("Access-Control-Allow-Origin", "*")
    return r


@app.route("/testingsample", methods=["GET", "OPTIONS"])
@cache.cached(query_string=True)
def serve_environ_sample() -> Response:
    """ Returns the row using the environment config to extract necessary data. """
    r: Response = Response()
    if request.method == "OPTIONS": # preflight
        r.headers.add("Access-Control-Allow-Origin", "*")
        r.headers.add('Access-Control-Allow-Headers', "*")
        r.headers.add('Access-Control-Allow-Methods', "*")
    else: # actual req
        target_dataset: str = request.args.get("TargetDataset", "")
        assert len(target_dataset) > 0, "Please provide a target dataset to be loaded."
        filepath_spec_str: str = os.environ["CSV_SAMPLE_FILEPATHS"]
        filepath_spec_pairs: Sequence[str] = filepath_spec_str.split(",")
        filepath_spec_map: Mapping[str, List[RawRowType]] = {
            pair.split("=")[0]: csv_to_array_of_dictionaries(pair.split("=")[1]) for pair in  filepath_spec_pairs
        }

        result: List[RawRowType] = filepath_spec_map[target_dataset]
        # must configure thresholds to 0 in the configuration table manually when using the
        # testingsample endpoint
        lhs_thresh: int = int(request.args.get("LHSThresh", 0))
        rhs_thresh: int = int(request.args.get("RHSThresh", 0))
        no_skip: bool = bool(request.args.get("OmitSkip", 0))
        time_filters_string: str = request.args.get("TimeFilters", "[]")
        untyped_time_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(time_filters_string)
        raw_t_filters: Sequence[RawTimeFilter] = []
        for x in untyped_time_filters.get("time_filters", []):
            assert "start" in x, "Time filter must have start"
            assert "end" in x, "Time filter must have end"
            typed_time_filter: RawTimeFilter = {
                "start": x["start"],
                "end": x["end"]
            }
            raw_t_filters = [*raw_t_filters, typed_time_filter]
        raw_time_filters: RawTimeFilters = { "time_filters": raw_t_filters }
        time_filters: TimeFilters = raw_time_filters_to_time_filters(raw_time_filters)
        datetime_filters_string: str = request.args.get("DateTimeFilters", "{}")
        untyped_datetime_filters: Mapping[str, Sequence[Mapping[str, str]]] = json.loads(datetime_filters_string)
        raw_dt_filters: Sequence[RawDateTimeFilter] = []
        for x in untyped_datetime_filters.get("datetime_filters", []):
            assert "start" in x, "DateTime filter must have start"
            assert "end" in x, "DateTime filter must have end"
            typed_datetime_filter: RawDateTimeFilter = {
                "start": x["start"],
                "end": x["end"]
            }
            raw_dt_filters = [*raw_dt_filters, typed_datetime_filter]
        raw_datetime_filters: RawDateTimeFilters = {"datetime_filters": raw_dt_filters}
        datetime_filters: DateTimeFilters = raw_datetime_filters_to_datetime_filters(
            raw_datetime_filters
        )
        data: ReturnDataType = data_jsonifier(result,
                                              lhs_thresh=lhs_thresh,
                                              rhs_thresh=rhs_thresh,
                                              time_filters=time_filters,
                                              datetime_filters=datetime_filters,
                                              no_skip=no_skip)

        r = Response(response=json.dumps(data), status=200, mimetype="application/json")
        r.headers.add("Access-Control-Allow-Origin", "*")
    return r

def cleanup():
    """Clean up resources on shutdown."""
    global engine
    print("Cleaning up database connections...")
    if engine is not None:
        engine.dispose()
    print("Cleanup complete.")

def signal_handler(sig, frame):
    global engine
    print(f"Received signal {sig}, cleaning up...")
    if engine is not None:
        engine.dispose()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

@app.before_request
def before_request():
    """Ensure database connection is alive before each request."""
    global engine, instrumented, listeners_attached

    if engine is None:
        populate_engine()
        return

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        print(f"Connection error, recreating engine: {e}")
        if engine is not None:
            engine.dispose()
        # Recreate engine with fresh connections
        engine = create_engine(
            url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_timeout=30,
            echo_pool=True
        )
        # Reset flags so instrumentation and listeners are reattached
        instrumented = False
        listeners_attached = False
        setup_instrumentation()
        setup_engine_listeners()

if __name__ == "__main__":
    KwargsType: TypedDict = TypedDict("KwargsType", {
        "host": str,
        "port": int,
        "debug": bool
    })
    kwargs: KwargsType = {
        "host": "0.0.0.0",
        "port": 5001,
        "debug": debug_mode
    }
    app.run(**kwargs)
