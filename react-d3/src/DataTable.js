import React, {useContext} from 'react';
import { Loading } from './Loading';
import { GraphContext } from './GraphContext';
import './DataTable.css';
import ShowModal from './ShowModal';
import { genTRFilter, genDTRFilter } from './TimeFilters';
import { CSVLink } from "react-csv";

import {
  useTable,
  useFilters,
  useGlobalFilter,
  useAsyncDebounce,
  useSortBy
} from "react-table";

import matchSorter from "match-sorter";
import namor from 'namor'

// encode the legend
const legend = {
  "-1": "NFS",
  "0": "SKIP",
  "1": "CFS",
  "-2": "UFS"
}

// [Modeled after](https://stackoverflow.com/a/69785106)
// start makeData.js
const range = len => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}
// end makeData.js
//
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
//
const newPerson = () => {
  const labels = [-1, 0, 1, -2]
  return {
    source: namor.generate({ words: 1, numbers: 0 }),
    content: namor.generate(
      {
        words: Math.floor(Math.random() * 3) + 1,
        numbers: 0
      }
    ).replace(/-/g, " "),
    label: labels[Math.floor(Math.random() * labels.length)].toString(),
    time: randomDate(new Date(2012, 0, 1), new Date()).toString()
  }
}
function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map(d => {
      return {
        ...newPerson()
      }
    })
  }
  var out = makeDataLevel()
  console.log("in make data")
  console.log(out)
  return out
}
// end makeData.js
// start App.js
// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <span>
      Search across all fields:{" "}
      <input
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        style={{
          fontSize: "1.1rem",
          border: "0"
        }}
      />
    </span>
  );
}

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter }
}) {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
    />
  );
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id }
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);


  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option} className={legend[option]}>
          {option}
        </option>
      ))}
    </select>
  );
}

// This is a custom filter UI that uses a
// slider to set the filter value between a column's
// min and max values
function SliderColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id }
}) {
  // Calculate the min and max
  // using the preFilteredRows

  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    preFilteredRows.forEach((row) => {
      min = Math.min(row.values[id], min);
      max = Math.max(row.values[id], max);
    });
    return [min, max];
  }, [id, preFilteredRows]);

  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        value={filterValue || min}
        onChange={(e) => {
          setFilter(parseInt(e.target.value, 10));
        }}
      />
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  );
}

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
  column: { filterValue = [], preFilteredRows, setFilter, id }
}) {
  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    preFilteredRows.forEach((row) => {
      min = Math.min(row.values[id], min);
      max = Math.max(row.values[id], max);
    });
    return [min, max];
  }, [id, preFilteredRows]);

  return (
    <div
      style={{
        display: "flex"
      }}
    >
      <input
        value={filterValue[0] || ""}
        type="number"
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [
            val ? parseInt(val, 10) : undefined,
            old[1]
          ]);
        }}
        placeholder={`Min (${min})`}
        style={{
          width: "70px",
          marginRight: "0.5rem"
        }}
      />
      to
      <input
        value={filterValue[1] || ""}
        type="number"
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [
            old[0],
            val ? parseInt(val, 10) : undefined
          ]);
        }}
        placeholder={`Max (${max})`}
        style={{
          width: "70px",
          marginLeft: "0.5rem"
        }}
      />
    </div>
  );
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]] });
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val;

// https://www.npmjs.com/package/match-sorter#usage
// ctrl-f WORD_STARTS_WITH
function similarTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, {
    keys: [(row) => row.values[id]],
    threshold: matchSorter.rankings.WORD_STARTS_WITH
  });
}
// Let the table remove the filter if the string is empty
similarTextFilterFn.autoRemove = (val) => !val;

// Our table component
function Table({ columns, data }) {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      similarText: similarTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      }
    }),
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter
  } = useTable(
    {
      columns,
      data,
      defaultColumn, // Be sure to pass the defaultColumn option
      filterTypes
    },
    useFilters, // useFilters!
    useGlobalFilter, // useGlobalFilter!
    useSortBy
  );

  // We don't want to render all of the rows for this example, so cap
  // it for this use case
  const firstPageRows = rows

  return (
    <>
      {/* Export Button Start */}
      <CSVLink className="downloadbtn" filename="my-data.csv" data={data}>
        Export to CSV
      </CSVLink>
      {/* Export Button End */}
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render("Header")}
                  {/* Render the columns filter UI */}
                  <div>{column.canFilter ? column.render("Filter") : null}</div>

                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " ??"
                        : " ??"
                      : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
          <tr>
            <th
              colSpan={visibleColumns.length}
              style={{
                textAlign: "left"
              }}
            >
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </th>
          </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()} className={cell.column.Header != "Label" ? "" : legend[`${cell.value}`]}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <div>
        <pre>
          <code>{JSON.stringify(state.filters, null, 2)}</code>
        </pre>
      </div>
    </>
  );
}

// Define a custom filter filter function!
function filterGreaterThan(rows, id, filterValue) {
  return rows.filter((row) => {
    const rowValue = row.values[id];
    return rowValue >= filterValue;
  });
}

export function isEmpty (obj) {
  return (obj === null || obj === undefined) || Object.keys(obj).length === 0
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = (val) => typeof val !== "number";
// end App.js
export default function DataTable () {
  var [config, _] = useContext(GraphContext)

  let isLoading = isEmpty(config.response.data)

  let columns = React.useMemo(
    () => [
      {
        Header: "Info",
        columns: [
          {
            Header: "Labeler Quality Score",
            accessor: "user_quality_score",
            filter: "fuzzyText"
          },
          {
            Header: "Labeler",
            accessor: "source",
            filter: "fuzzyText"
          },
          {
            Header: "StatementId",
            accessor: "target",
            filter: "similarText"
          },
          {
            Header: "Statement",
            accessor: "content",
            filter: "similarText"
          },
          {
            Header: "Label",
            accessor: "label",
            Filter: SelectColumnFilter
          },
          {
            Header: "Time",
            accessor: "time",
            filter: "similarText"
          }
        ]
      }
    ],
    []
  )


  const rawData = ! isEmpty(config.response.data) ? config.response.data : makeData(100)
  const dataForConsideration = rawData.map(function (d) {
      var out = {}
      for(var k in d) out[k] = d[k]
      out['timeParsed'] = new Date(out['time'])
      return out
  }).filter(genTRFilter(config)).filter(genDTRFilter(config))
    console.log("in DataTable")
    console.log(config)
  return (
    <>
        <ShowModal
          title={"No Data"}
          body={"No data to display."}
          setShow={
              ((cfg, sConf, show) => {
                  var newData = Object.assign({}, cfg.data, { noDataModalTable: show })
                  var newConfig = Object.assign({}, cfg, {data: newData})
                  sConf(newConfig)
              })}
          configPath={["data", "noDataModalTable"]} />
        {isLoading ? (<Loading />) : (
         config.response.data.length == 0 ? (<p>No Data</p>) : (<Table columns={columns} data={dataForConsideration} />)
        )}
    </>
  )
}
