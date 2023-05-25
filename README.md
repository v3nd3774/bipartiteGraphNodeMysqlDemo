# bipartiteGraphNodeMysqlDemo

# How to run

1. Open ssh tunnel to MySQL target

2. Populate `server.env` file with appropriate information

```
export MYSQL_HOST=<host here>
export MYSQL_PORT=<port here>
export MYSQL_USER=<user here>
export MYSQL_PASSWORD=<password here>
export MYSQL_DB=<db here>
export MYSQL_JOIN_QUERY=<query here>
export MYSQL_LABEL_COLUMN=<column with label result here>
export MYSQL_LABELER_COLUMN=<column with labeler username here>
export MYSQL_LABELEE_ID_COLUMN=<column with labeled item id here>
export MYSQL_LABELEE_CONTENT_COLUMN=<column with labeled item text here>
export MYSQL_TIME_COLUMN=<column with time info here>
export MYSQL_OUTPUT_TIME_FORMAT=<output format to json for rest service>
export MYSQL_INPUT_TIME_FORMAT=<format for reading time>
```

3. In a new terminal source the `.env` file and run `python3 app.py`

4. Run `npm install && npm start` in the react frontend folder and view the visualization

References:
  - https://observablehq.com/@sophietalbot/bipartite-graph-of-virtual-water-trade-wheat/2
  - https://observablehq.com/@snowirbix/work-in-progress
