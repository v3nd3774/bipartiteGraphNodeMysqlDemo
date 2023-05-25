# save this as app.py
from flask import Response, request
from flask import Flask
from sqlalchemy import create_engine, text
import os
import json
from datetime import datetime

app = Flask(__name__)

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
        "MYSQL_OUTPUT_TIME_FORMAT"
    ]
}

url = f"mysql+pymysql://{config['MYSQL_USER']}:{config['MYSQL_PASSWORD']}@{config['MYSQL_HOST']}:{config['MYSQL_PORT']}/{config['MYSQL_DB']}?charset=utf8"

engine = create_engine(url)

rows = None

def rowJsonifier(row):
    return {
        'source': row[config['MYSQL_LABELER_COLUMN']],
        'target': row[config['MYSQL_LABELEE_ID_COLUMN']],
        'time': row[config['MYSQL_TIME_COLUMN']].strftime(config["MYSQL_OUTPUT_TIME_FORMAT"]),
        'label': row[config['MYSQL_LABEL_COLUMN']],
        'content': row[config["MYSQL_LABELEE_CONTENT_COLUMN"]],
        'value': 1
    }

@app.route("/", methods=["GET", "OPTIONS"])
def hello():
  if request.method == "OPTIONS": # preflight
    r = Response()
    r.headers.add("Access-Control-Allow-Origin", "*")
    r.headers.add('Access-Control-Allow-Headers', "*")
    r.headers.add('Access-Control-Allow-Methods', "*")
    return r
  else: # actual req
    with engine.connect() as connection:
        result = connection.execute(text(config["MYSQL_JOIN_QUERY"]))
        rows = [rowJsonifier(row._asdict()) for row in result]
        r = Response(response=json.dumps(rows), status=200, mimetype="application/json")
        r.headers.add("Access-Control-Allow-Origin", "*")
    return r

if __name__ == "__main__":
    app.run()
