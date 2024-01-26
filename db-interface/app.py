# save this as app.py
from flask import Response, request
from flask import Flask
from flask_caching import Cache
from functools import reduce
from typing import Dict
from sqlalchemy import create_engine, text
import os
import sys
import copy
import json

config = {
    x: os.environ[x] for x in [
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
}

debug_mode = len(sys.argv) > 1 and sys.argv[1] == "debug"
cache_config = {
    "CACHE_TYPE": "SimpleCache",
    "CACHE_DEFAULT_TIMEOUT": 86400, # 1 day
}
if debug_mode:
    cache_config["DEBUG"] = True

app = Flask(__name__)
app.config.from_mapping(cache_config)
cache = Cache(app)

url = f"mysql+pymysql://{config['MYSQL_USER']}:{config['MYSQL_PASSWORD']}@{config['MYSQL_HOST']}:{config['MYSQL_PORT']}/{config['MYSQL_DB']}?charset=utf8"

engine = create_engine(url)

rows = None

def rowJsonifier(
        row,
        sourceCol = config['MYSQL_LABELER_COLUMN'],
        targetCol = config['MYSQL_LABELEE_ID_COLUMN'],
        timeCol = config['MYSQL_TIME_COLUMN'],
        timeFormat = config["MYSQL_OUTPUT_TIME_FORMAT"],
        labelCol = config['MYSQL_LABEL_COLUMN'],
        contentCol = config["MYSQL_LABELEE_CONTENT_COLUMN"],
        edgeWeight = config.get("EDGE_WEIGHT", 1),
        userQualityScoreCol = config["MYSQL_LABELER_QUALITY_COLUMN"]
        ):
    return {
        'source': row[sourceCol],
        'target': row[targetCol],
        'time': row[timeCol].strftime(timeFormat),
        'label': row[labelCol],
        'content': row[contentCol],
        'user_quality_score': row[userQualityScoreCol],
        'value': edgeWeight
    }

def lst_2_frq(acc, d):
    for k, v in {"LHS":"source", "RHS":"target"}.items():
        acc[k][d[v]] = acc[k].get(d[v], 0) + 1
    return acc


def calculate_summary_stats(data):
    edge_cnt = len(data)
    nodes = {
        "LHS": [x['source'] for x in data],
        "RHS": [x['target'] for x in data]
    }
    node_cnts = {k:len(v) for k,v in nodes.items()}
    unique_nodes = {k:set(v) for k,v in nodes.items()}
    unique_node_set_size = {k:len(v) for k,v in unique_nodes.items()}
    unique_node_cnts: Dict[str, Dict[str, int]] = reduce(lst_2_frq, data, {"LHS":{}, "RHS":{}})
    return {
        "edge_cnt": edge_cnt,
        "node_cnts": node_cnts,
        "unique_node_set_size": unique_node_set_size,
        "unique_node_cnts": unique_node_cnts
    }

def dataJsonifier(raw_data):
    data = [rowJsonifier(row._asdict()) for row in raw_data]
    summary_stats = calculate_summary_stats(data)
    return {"data":data, "summary_stats":summary_stats}


@app.route("/environ", methods=["GET", "OPTIONS"])
@cache.cached()
def serveEnviron():
  if request.method == "OPTIONS": # preflight
    r = Response()
    r.headers.add("Access-Control-Allow-Origin", "*")
    r.headers.add('Access-Control-Allow-Headers', "*")
    r.headers.add('Access-Control-Allow-Methods', "*")
    return r
  else: # actual req
    with engine.connect() as connection:
        result = connection.execute(text(config["MYSQL_JOIN_QUERY"]))
        processed_results = dataJsonifier(result)
        rows = processed_results["data"]
        r = Response(response=json.dumps(rows), status=200, mimetype="application/json")
        r.headers.add("Access-Control-Allow-Origin", "*")
    return r

def checkQuerySafety(x: str) -> bool:
    normalized = x.lower().strip()
    unwanted_strings = None
    with open("./unwanted_strings.txt", "r") as f:
        unwanted_strings = [s.lower() for s in f.readlines()]
    assert unwanted_strings, "Unwanted sql strings not loaded properly..."
    checks = [
            normalized[0:6] == "select",
            *[not (uwnt in normalized) for uwnt in unwanted_strings]
    ]
    return all(checks)

@app.route("/custom", methods=["POST", "OPTIONS"])
def serveCustom():
  r = Response()
  r.headers.add("Access-Control-Allow-Origin", "*")
  r.headers.add('Access-Control-Allow-Headers', "*")
  r.headers.add('Access-Control-Allow-Methods', "*")
  if request.method == "OPTIONS": # preflight
    return r
  else: # actual req
    # customRequest leverages environ file as defaults with options passed in
    # overriding other options defined in structure below
    request_struct = copy.deepcopy(config)
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
        query = request_struct["MYSQL_JOIN_QUERY"]
        qsafe = checkQuerySafety(query)
        if qsafe:
            result = connection.execute(text(request_struct["MYSQL_JOIN_QUERY"]))
            processed_results = dataJsonifier(result)
            rows = processed_results["data"]
            r.set_data(json.dumps(rows))
            r.status_code = 200
            r.mimetype = "application/json"
        else:
            r.set_data("Only allowed SELECT queries...")
            print(json.dumps(request_struct))
            r.status_code = 405
    return r

if __name__ == "__main__":
    kwargs = {
        "host": "0.0.0.0",
        "port": 5001
    }
    if debug_mode:
        kwargs["debug"] = True
    app.run(**kwargs)
