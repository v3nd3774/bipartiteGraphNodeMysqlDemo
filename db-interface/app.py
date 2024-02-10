"""
Runs the API DB interface for returning data for bipartite graph visualizer.
"""
import os
import sys
import copy
import json
import datetime
from functools import reduce
from typing import Dict, List, TypeAlias, Final
from typing_extensions import TypedDict
from flask import Response, request, Flask
from flask_caching import Cache
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
#from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
#from opentelemetry.instrumentation.flask import FlaskInstrumentor

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

debug_mode: bool = len(sys.argv) > 1 and sys.argv[1] == "debug"
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

#FlaskInstrumentor().instrument_app(app)
#FlaskInstrumentor().instrument(enable_commenter=True, commenter_options={})

url: str = ":".join([
    "mysql+pymysql",
    f"//{config['MYSQL_USER']}",
    f"{config['MYSQL_PASSWORD']}@{config['MYSQL_HOST']}",
    f"{config['MYSQL_PORT']}/{config['MYSQL_DB']}?charset=utf8"
])

engine: Engine = create_engine(url)
#SQLAlchemyInstrumentor().instrument(engine=engine)

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

def row_jsonifier( # pylint: disable=too-many-arguments
    row: RawRowType,
    source_col: str = config['MYSQL_LABELER_COLUMN'],
    target_col: str = config['MYSQL_LABELEE_ID_COLUMN'],
    time_col: str = config['MYSQL_TIME_COLUMN'],
    time_format: str = config["MYSQL_OUTPUT_TIME_FORMAT"],
    label_col: str = config['MYSQL_LABEL_COLUMN'],
    content_col: str = config["MYSQL_LABELEE_CONTENT_COLUMN"],
    edge_weight: int = int(config.get("EDGE_WEIGHT", "1")),
    user_quality_score_col: str = config["MYSQL_LABELER_QUALITY_COLUMN"]) -> RowType:
    """ Converts a row into a consistent format for use in graph generation. """
    return {
        'source': row[source_col], # type: ignore
        'target': row[target_col], # type: ignore
        'time': row[time_col].strftime(time_format), # type: ignore
        'label': row[label_col], # type: ignore
        'content': row[content_col], # type: ignore
        'user_quality_score': row[user_quality_score_col], # type: ignore
        'value': edge_weight
    }

def lst_2_frq(acc: Dict[str, Dict[str, int]], d: RowType) -> Dict[str, Dict[str, int]]:
    """ Converts a list to a dict of frequencies for each half of bipartite graph. """
    acc["LHS"][d["source"]] = acc["LHS"].get(d["source"], 0) + 1
    acc["RHS"][d["target"]] = acc["RHS"].get(d["target"], 0) + 1
    return acc


UniqueNodeCnt: TypedDict = TypedDict("UniqueNodeCnt",{
    "label": str,
    "cnt": int
})
SummaryStatsType: TypedDict = TypedDict("SummaryStatsType", {
    "edge_cnt": int,
    "unique_node_set_size": Dict[str, int],
    "unique_node_cnts": Dict[str, Dict[str, List[UniqueNodeCnt]]]
})
def calculate_summary_stats(data: List[RowType]) -> SummaryStatsType:
    """ Calculates summary statistics from raw data. """
    edge_cnt: int = len(data)
    nodes: Dict[str, List[str]] = {
        "LHS": [x['source'] for x in data],
        "RHS": [x['target'] for x in data]
    }
    unique_nodes: Dict[str, set[str]] = {k:set(v) for k,v in nodes.items()}
    unique_node_set_size: Dict[str, int] = {k:len(v) for k,v in unique_nodes.items()}
    unique_node_cnts_raw: Dict[str, Dict[str, int]] = reduce(
        lst_2_frq,
        data,
        {"LHS":{}, "RHS":{}}
    )
    unique_node_cnts: Dict[str, UniqueNodeCnt] = {
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

    return {
        "edge_cnt": edge_cnt,
        "unique_node_set_size": unique_node_set_size,
        "unique_node_cnts": unique_node_cnts
    }

ReturnDataType: TypedDict = TypedDict("ReturnDataType", {
    "data": List[RowType],
    "summary_stats": SummaryStatsType,
    "no_skip_data": List[RowType],
    "no_skip_summary_stats": SummaryStatsType
})
def data_jsonifier(raw_data: List[RawRowType], skip_label = 0) -> ReturnDataType:
    """
    Applies jsonifier to raw data to organize in consistent format.
    Also calculates and includes summary stats in this format.
    """
    data = [row_jsonifier(row) for row in raw_data]
    summary_stats = calculate_summary_stats(data)
    no_skip_data: List[RowType] = [x for x in data if x['label'] != skip_label]
    no_skip_summary_stats = calculate_summary_stats(no_skip_data)
    return {
        "data":data,
        "summary_stats":summary_stats,
        "no_skip_data":no_skip_data,
        "no_skip_summary_stats":no_skip_summary_stats
    }


@app.route("/environ", methods=["GET", "OPTIONS"])
@cache.cached()
def serve_environ() -> Response:
    """ Returns the row using the environment config to extract necessary data. """
    r: Response = Response()
    if request.method == "OPTIONS": # preflight
        r.headers.add("Access-Control-Allow-Origin", "*")
        r.headers.add('Access-Control-Allow-Headers', "*")
        r.headers.add('Access-Control-Allow-Methods', "*")
    else: # actual req
        with engine.connect() as connection:
            result: List[RawRowType] = [
                r._asdict()
                for r in connection.execute(text(config["MYSQL_JOIN_QUERY"]))
            ]
            data: ReturnDataType = data_jsonifier(result)
            r = Response(response=json.dumps(data), status=200, mimetype="application/json")
            r.headers.add("Access-Control-Allow-Origin", "*")
    return r

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
        with engine.connect() as connection:
            query: str = request_struct["MYSQL_JOIN_QUERY"]
            qsafe: bool = check_query_safety(query)
            if qsafe:
                result: List[RawRowType] = [
                    r._asdict()
                    for r in connection.execute(text(request_struct["MYSQL_JOIN_QUERY"]))
                ]
                data: ReturnDataType = data_jsonifier(result)
                r.set_data(json.dumps(data))
                r.status_code = 200
                r.mimetype = "application/json"
            else:
                r.set_data("Only allowed SELECT queries...")
                print(json.dumps(request_struct))
                r.status_code = 405
    return r

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
