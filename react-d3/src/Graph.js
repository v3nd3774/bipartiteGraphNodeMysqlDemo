import { renderToString } from 'react-dom/server'
import React, {useContext, useState, useEffect, useMemo} from 'react';
import * as d3 from "d3";
import ShowModal from './ShowModal'
import axios from 'axios';
import { GraphContext } from './GraphContext';
import { Loading } from './Loading';
import { d3Bipartite } from './d3Bipartite';
import { updateConfig } from './Utility.js';
import { lhsAvailibleSorting, rhsAvailibleSorting} from './Sorting';
import { genTRFilter, genDTRFilter } from './TimeFilters';
import './Graph.css';

// http://www.d3noob.org/2013/01/using-multiple-axes-for-d3js-graph.html
// https://github.com/ilyabo/d3-bipartite/blob/master/src/index.js#L46
// will need to create module to perform the zoom shown below with above resources totally redo viz
// https://observablehq.com/@d3/zoomable-area-chart?collection=@d3/d3-zoom
// above example has static y axis; will need this to be a static x axis with y axis being the zoomable part

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return { height, width };
}

export default function Graph () {

  var [config, setConfig] = useContext(GraphContext)
  var { detectedHeight, detectedWidth } = getWindowDimensions();
  var result;


  while (typeof detectedHeight === "undefined") {
     result = getWindowDimensions();
     detectedHeight = result.height;
     detectedWidth = result.width;
  }

  const tooltip = d3.select("body").append("div")
    .attr("class", "svg-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "10px")
    .style("border-radius", "4px")
    .style("font-family", "arial")
    .style("font-size", "14px")
    .style("max-width", "300px") // Good for 1-3 sentences
    .style("pointer-events", "none")
    .style("z-index", "1000");

  function createLayoutData (filteredData, summary_data, filtered = false, rawHeight=detectedHeight * 2, width=detectedWidth * 1.5, padding=config.canvas.padding) {
    function onlyUnique(value, index, array) {
      return array.indexOf(value) === index;
    }
    let edge_cnt = summary_data.edge_cnt
    let gamma = Math.log(edge_cnt + 1) / 2
    let height = rawHeight * gamma
    let theta = (1 + (1 / Math.log(edge_cnt)) - 1/2) / (Math.E - .832)
    let padding_value = height / (edge_cnt * theta)
    let currentScale = config.zoomLevel
    const layout = d3Bipartite(
            lhsAvailibleSorting[config.sortingConf.lhs],
            rhsAvailibleSorting[config.sortingConf.rhs],
            currentScale
    )
      .width(width * gamma)
      .height(height)
      .padding(height/edge_cnt)
      .source(d => d.source)
      .target(d => d.target)
      .value(d => d.value);
    return layout(filteredData);
  }
  // function doSth (g, i, els, rawData, svg, colorScale) {
  //    d3.select("svg").selectAll("g path")
  //      .filter(d => {
  //        return d.source != i.key
  //      })
  //      .transition()
  //      .style("stroke", d =>
  //        "white"
  //      )
  //      .style("stroke-width", d =>
  //        0
  //      )
  //      .style("opacity", _ =>
  //        0
  //      )
  //    d3.select("svg").selectAll("g path")
  //      .filter(d => {
  //        return d.source == i.key
  //      })
  //      .transition()
  //      .style("stroke", d =>
  //            colorScale(d.original.label)
  //      )
  //      .style("stroke-width", d =>
  //        1.01010101010101010102
  //      )
  //      .style("opacity", _ =>
  //        0.5
  //      )
  // }
// Change from 6 arguments to 5 to match the .on() call
function doSth(event, i, rawData, svg, colorScale) {
  d3.select("svg").selectAll("g path")
    .filter(d => {
      // Using String casting to handle the type mismatch we found earlier
      return String(d.original.source) !== String(i.key)
    })
    .transition()
    .style("stroke", "white")
    .style("stroke-width", 0)
    .style("opacity", 0);

  d3.select("svg").selectAll("g path")
    .filter(d => {
      return String(d.original.source) === String(i.key)
    })
    .transition()
    .style("stroke", d => colorScale(d.original.label)) // Now colorScale will be correctly defined
    .style("stroke-width", 1.01010101010101010102)
    .style("opacity", 0.5);
}
  function stopDoSthTgt(event, d, rawData, svg, colorScale) {
  // --- 1. Tooltip Logic ---
  tooltip.style("visibility", "hidden");

  // --- 2. Reset Paths ---
  d3.select("svg").selectAll("g path")
    .transition()
    .style("stroke", p => colorScale(p.original.label))
    .style("stroke-width", 1.01010101010101010102)
    .style("opacity", 0.5);
  }
  function doSthTgt(event, d, rawData, svg, colorScale) {
  // --- 1. Tooltip Logic ---
  const textContent = d.values[0]?.original?.content || "No additional info available.";
  tooltip
    .style("visibility", "visible")
    .html(`<strong>${d.key}</strong><br/>${textContent || "No additional info available."}`);
    // ^ Replace 'd.info' with the actual property containing your sentences

  // --- 2. Existing Path Filtering Logic ---
  const all = d3.select("svg").selectAll("g path");

  //all.filter(p => p.target !== d.key)
  //  .transition()
  //  .style("stroke", "white")
  //  .style("stroke-width", 0)
  //  .style("opacity", 0);

  //all.filter(p => p.target === d.key)
  //  .transition()
  //  .style("stroke", p => colorScale(p.original.label))
  //  .style("stroke-width", 1.01010101010101010102)
  //  .style("opacity", 0.5);
  //}
// Use String() to ensure "123" matches 123
  all.filter(p => String(p.original.target) !== String(d.key))
    .transition()
    .style("stroke", "white")
    .style("stroke-width", 0)
    .style("opacity", 0);

  all.filter(p => String(p.original.target) === String(d.key))
    .transition()
    .style("stroke", p => colorScale(p.original.label))
    .style("stroke-width", 1.01010101010101010102)
    .style("opacity", 0.5);
    }

  function getColorScheme(originLabels) {
    const uniqueLabels = [...new Set(originLabels)];
    const colorScheme = d3.schemeTableau10;
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueLabels)
        .range(colorScheme);
    return colorScale;
  }

  function drawReact(layoutData, filterKey, rawData, summaryData, margin = {left: 0, right: 0}) {
    // clear the svg
    d3.select("div.container").selectAll("*").remove()
    d3.select("div.container").append("svg")

    const svg = d3.select("div.container > svg")
    let min_x = Math.min(...layoutData.flows.map(d => d.start.x)) - 15
    let min_y = Math.min(...layoutData.flows.map(d => d.end.y)) - 15
    let max_x = Math.max(...layoutData.flows.map(d => d.end.x)) + 15
    let max_y = Math.max(...layoutData.flows.map(d => d.end.y)) + 15
    svg.attr("viewBox", [
        min_x,
        min_y,
        min_x + max_x,
        min_y + max_y
      ])
    svg.attr("width", `${detectedWidth}px`)
    svg.attr("height", `${detectedHeight}px`)
    d3.select("svg").selectAll("g").remove();
    const container = d3.select("svg").append('g')
       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const nodeWidth = 1;
    let { flows, sources, targets } = createLayoutData(
      rawData,
      summaryData,
      false
    );

    const originLabels = flows.map(flow => flow.original.label)
    const colorScale = getColorScheme(originLabels);
    const uniqueLabels = [...new Set(originLabels)];

    var newConfig = Object.assign({}, config, {colorScale: colorScale}, {uniqueLabels: uniqueLabels})
    setConfig(newConfig)

    // flow lines
    let lines = container.append('g')
      .selectAll('path')
      .data(flows)
      .enter().append('path')
      .attr('d', d => d.path)
      .attr('opacity', 0.5)
      .attr('fill', 'none')
      .attr('stroke', d =>
             colorScale(d.original.label)
      )
          .attr('stroke-width', d => d.thickness);
    // source node rectangles
    let source_nodes = container.append('g')
      .selectAll('rect')
      .data(flows)
      .enter().append('rect')
      .attr('x', d => d.start.x - nodeWidth/2)
      .attr('y', d => d.start.y)
      .attr('width', nodeWidth)
      .attr('height', d => d.start.height)
      .attr('fill', d =>
             colorScale(d.original.label)
      )
      .attr('stroke', 'none');
    // target node rectangles
    let target_nodes = container.append('g')
      .selectAll('rect')
      .data(flows)
      .enter().append('rect')
      .attr('x', d => d.end.x - nodeWidth/2)
      .attr('y', d => d.end.y)
      .attr('width', nodeWidth)
      .attr('height', d => d.end.height)
      .attr('fill', d =>
             colorScale(d.original.label)
      )
      .attr('stroke', 'none');
    // source labels
    //const srclabels = container.append('g')
    //  .selectAll('text')
    //  .data(sources)
    //  .enter().append('text')
    //srclabels
    //  .attr('x', d => d.x - 15)
    //  .attr('y', d => d.y + d.height/2)
    //  .attr('font-family', 'arial')
    //  .attr('font-size', 20)
    //  .attr('alignment-baseline', 'middle')
    //  .attr('text-anchor', 'middle')
    //  .attr('color', 'black')
    //  .text(d => d.key)
    ////srclabels
    ////  .on("mouseenter", (i, g, els) =>
    ////    doSth(i, g, els, rawData, svg, colorScale )
    ////  )
    ////  .on("mouseleave", (i, g, els) => stopDoSthTgt(i, g, els, rawData, svg, colorScale ))
    ////  .on("click", (g, i, els) => {
    ////    drawReact(layoutData, filterKey, rawData, summaryData, margin)
    ////  })
    //srclabels
    //  .on("mouseenter", (event, d) => doSth(event, d, rawData, svg, colorScale)) // Fix this too if needed
    //  .on("mouseleave", (event, d) => stopDoSthTgt(event, d, rawData, svg, colorScale)) // Fix applied here
    //  .on("click", (event, d) => {
    //    drawReact(layoutData, undefined, rawData, summaryData, margin)
    //  });
    //d3.select("svg")
    //  .on("mouseleave", () => {
    //    // if there was a filter, remove it
    //    if (filterKey != undefined)
    //    {
    //      drawReact(layoutData, filterKey, rawData, summaryData, margin)
    //    }
    //  })

// 1. Create a group for source labels to match the target label structure
const srclabelGroups = container.append('g')
  .selectAll('g.src-label-group')
  .data(sources)
  .enter().append('g')
  .attr('class', 'src-label-group')
  // This centers the group exactly at the node's vertical midpoint
  .attr('transform', d => `translate(${d.x - 15}, ${d.y + d.height / 2})`);

// 2. Append text to the groups
srclabelGroups.append('text')
  .attr('font-family', 'arial')
  .attr('font-size', 20)
  .attr('alignment-baseline', 'middle')
  .attr('text-anchor', 'end') // Changed to 'end' so text flows left, away from the node
  .attr('fill', 'black')
  .text(d => d.key);

// 3. Attach the events to the group
srclabelGroups
  .on("mouseenter", (event, d) => doSth(event, d, rawData, svg, colorScale))
  .on("mouseleave", (event, d) => stopDoSthTgt(event, d, rawData, svg, colorScale))
  .on("click", (event, d) => {
    drawReact(layoutData, undefined, rawData, summaryData, margin);
  });

    // // target labels
    // const tgtlabels = container.append('g')
    //   .selectAll('text')
    //   .data(targets)
    //   .enter().append('text')

    // var itemIdxToConcensus = {}
    // tgtlabels.each(d => {
    //     const itemIdx = d.key
    //     const edges = d.values
    //     const originalEdges = edges.map(e => e.original)
    //     const originalLabels = originalEdges.map(e => e.label)
    //     const freqs = originalLabels.reduce((countMap, edge) => {
    //       countMap[edge] = (countMap[edge] || 0) + 1;
    //       return countMap;
    //     }, {})
    //     const entries = Object.entries(freqs)
    //     const highestEntry = [...entries].reduce((maxEntry, currentEntry) => {
    //         return currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry;
    //     });
    //     itemIdxToConcensus[itemIdx] = highestEntry[0]
    // })

    // tgtlabels
    //   .attr('x', d => d.x)
    //   .attr('y', d => d.y + d.height/2)
    //       .attr('font-family', 'arial')
    //       .attr('font-size', 20)
    //       .attr('alignment-baseline', 'middle')
    //       .attr('text-anchor', 'middle')
    //       .attr('color', 'black')
    //       .text(d => {
    //         return d.key
    //       })
    //       .attr('fill', d => colorScale(itemIdxToConcensus[d.key]))
    //  tgtlabels
    //      .on("mouseenter", (i, g, els) => doSthTgt(i, g, els, rawData, svg, colorScale ))
         //.on("mouseleave", (i, g, els) => stopDoSthTgt(i, g, els, rawData, svg, colorScale ))

// 1. Change selection to 'g' instead of 'text'
const tgtlabels = container.append('g')
  .selectAll('g.label-group')
  .data(targets)
  .enter().append('g')
  .attr('class', 'label-group')
  // Move the group to the target position
  .attr('transform', d => `translate(${d.x}, ${d.y + d.height/2})`);

var itemIdxToConcensus = {}
tgtlabels.each(d => {
    const itemIdx = d.key
    const edges = d.values
    const originalEdges = edges.map(e => e.original)
    const originalLabels = originalEdges.map(e => e.label)
    const freqs = originalLabels.reduce((countMap, edge) => {
      countMap[edge] = (countMap[edge] || 0) + 1;
      return countMap;
    }, {})
    const entries = Object.entries(freqs)
    const highestEntry = [...entries].reduce((maxEntry, currentEntry) => {
        return currentEntry[1] > maxEntry[1] ? currentEntry : maxEntry;
    });
    itemIdxToConcensus[itemIdx] = highestEntry[0]
})

// 2. Append the text to the groups
const textElements = tgtlabels.append('text')
  .attr('font-family', 'arial')
  .attr('font-size', 20)
  .attr('alignment-baseline', 'middle')
  .attr('text-anchor', 'start') // Changed to start so the box follows the text
  .attr('fill', 'black')
  .text(d => d.key);

// 3. Append the rectangles using dynamic width
tgtlabels.append('rect')
  .attr('x', function(d) {
    // Finds the sibling text element and measures it
    const textWidth = d3.select(this.parentNode).select('text').node().getComputedTextLength();
    return textWidth + 10; // 10px gap
  })
  .attr('y', -10) // Center vertically (half of height 20)
  .attr('width', 20)
  .attr('height', 20)
  .attr('fill', d => colorScale(itemIdxToConcensus[d.key]));

// 4. Re-attach events to the group so the whole area is interactive
tgtlabels
  .on("mouseenter", (event, d) => doSthTgt(event, d, rawData, svg, colorScale))
  .on("mousemove", (event) => {
    // Keeps the tooltip following the cursor
    tooltip
      .style("top", (event.pageY - 10) + "px")
      .style("left", (event.pageX - 330) + "px");
  })
  .on("mouseleave", (event, d) => stopDoSthTgt(event, d, rawData, svg, colorScale));

    let path_str = lines._groups[0][0].getAttribute("d")
    let path_parts = path_str.split(' ')
    let last_x = path_parts[2].split(',')[0]
    let last_x_int = parseInt(last_x)

    function handleZoom(e) {
      //const eventType = e.sourceEvent.type;
      //let cont = d3.select('svg g')
      //let old_transform = cont.attr('transform');
      //let old_scale = 1
      //if (old_transform.includes('scale')) {
      //  old_scale = parseFloat(old_transform.split(' ')[1].split(',')[0]);
      //}
      //if (eventType !== 'wheel') {
      //  e.transform.k = old_scale
      //}
      //function scaleAndMaintainOffset(domElement, _, __) {
      // let old_transform = domElement.getAttribute("transform")

      // let new_transform_to_apply_dict = {
      //  'scale': [e.transform.k, 1],
      // }

      // let merged_transform_dict = {}

      // if (!(old_transform == null || old_transform == "" || typeof old_transform == "undefined")) {
      //   let prev_transform_dict = old_transform.split(/[^,] [^,]/).reduce((acc, setting) => {
      //          let name = setting.split('(')[0]
      //          let value = setting.split('(')[1].slice(0,-1)
      //          let values = value.split(',')
      //          acc[name] = values.map(parseFloat)
      //          return acc
      //      }, {})
      //   merged_transform_dict = Object.assign(merged_transform_dict, prev_transform_dict)
      // }

      // merged_transform_dict = Object.assign(merged_transform_dict, new_transform_to_apply_dict)

      // if ('scale' in merged_transform_dict && 'translate' in merged_transform_dict) {
      //      let scale = merged_transform_dict['scale']
      //      let translate = merged_transform_dict['translate']
      //      let original_translate = parseFloat(d3.select(domElement).attr("data-original-translate-x"))
      //      translate[0] = original_translate
      //      let new_translate = translate.map((val, idx) => val * scale[idx])
      //      merged_transform_dict['translate'] = new_translate
      // }

      // let transform_str = Object.entries(merged_transform_dict).map(([name, values]) => {
      //      return `${name}(${values.join(',')})`
      //  }).join(' ')

      // d3.select(domElement).attr("transform", transform_str);
      //}

      //tgtlabels
      //  .attr('x', d => last_x_int / e.transform.k)

      //srclabels._groups[0].forEach(scaleAndMaintainOffset)
      //tgtlabels._groups[0].forEach(scaleAndMaintainOffset)

      //cont
      //    .attr("transform", `scale(1, ${e.transform.k}) translate(0, ${e.transform.y})`);
      //setConfig(updateConfig("zoomLevel", e.transform.k, newConfig))
            //

const currentK = e.transform.k;
  const cont = d3.select('svg g');

  // 1. Scale the main container
  cont.attr("transform", `translate(0, ${e.transform.y}) scale(1, ${currentK})`);

  // 2. Faster text growth math
  // We use currentK directly now.
  // If it's STILL too slow, you can use (currentK * 1.5)
  const labelScale = currentK;

  tgtlabels.attr('transform', d => {
    const centerY = d.y + d.height / 2;

    // Logic:
    // X scale = labelScale (Grows 1:1 with zoom)
    // Y scale = labelScale / currentK (Grows 1:1 with zoom, but cancels parent stretch)
    return `translate(${d.x}, ${centerY}) scale(${labelScale}, ${labelScale / currentK})`;
  });

  //srclabels.attr('transform', d => {
  //  return `translate(${d.x}, ${d.y + d.height / 2}) scale(${labelScale}, ${labelScale / currentK})`;
  //});
srclabelGroups.attr('transform', d => {
  const centerY = d.y + d.height / 2;
  // We include the -15 offset here so the labels stay pinned to the left of the nodes
  return `translate(${d.x - 15}, ${centerY}) scale(${labelScale}, ${labelScale / currentK})`;
});

  setConfig(updateConfig("zoomLevel", currentK, newConfig));

    }
    let zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', handleZoom)

    d3.select('svg')
        .call(zoom)
  }

  async function drawChart() {

    d3.select("div.container").selectAll("*").remove()
    let stringToInject = renderToString(<Loading/>)
    d3.select("div.container").html(stringToInject)
    var reactData;
    const endpoint = config.data.api.endpoint ? "environ" : "testingsample"
    var api_url = `${config.data.api.protocol}://${config.data.api.host}:${config.data.api.port}/${endpoint}`
    var filterObj = {
            "LHSThresh": config.filterConf.leftRenderThreshold,
            "RHSThresh": config.filterConf.rightRenderThreshold,
            "OmitSkip": config.filterConf.omitSkip,
            "TimeFilters": JSON.stringify({
                "time_filters": config.filterConf.timeRanges.map(
                    function (range) {
                        return {
                            "start": range[0],
                            "end": range[1]
                        }
                    }
                )
            }),
            "DateTimeFilters": JSON.stringify({
                "datetime_filters": config.filterConf.datetimeRanges.map(
                    function (range) {
                        return {
                            "start": range[0],
                            "end": range[1]
                        }
                    }
                )
            }),
        }

    var filterQueryStr = Object.entries(filterObj).map(([key, value]) => `${key}=${value}`).join('&')
    var targetSampleDatsetStr = `TargetDataset=${config.targetsampledataset}`
    var api_url = `${api_url}?${filterQueryStr}&${targetSampleDatsetStr}`
    if(config.data.api.request == "GET") {
      reactData = await d3.json(api_url, function(error, data) {
        return data
      });

    } else {
      reactData = await axios.post(
        api_url,
        {
          MYSQL_HOST: config.data.api.host,
          MYSQL_PORT: config.data.api.port,
          MYSQL_DB: config.data.db.name,
          MYSQL_JOIN_QUERY: config.data.db.joinQuery,
          MYSQL_LABEL_COLUMN: config.data.db.labelCol,
          MYSQL_LABELER_COLUM: config.data.db.labelerCol ,
          MYSQL_LABELEE_ID_COLUMN: config.data.db.labeleeIdCol,
          MYSQL_LABELEE_CONTENT_COLUMN: config.data.db.labeleeContentCol ,
          MYSQL_TIME_COLUMN: config.data.db.timeCol,
          MYSQL_OUTPUT_TIME_FORMAT: config.data.db.timeOutFormat
        })
      reactData = reactData
    }
    console.log("rawReactData")
    console.log(reactData)
    // purge elements from being rendered that have less than 10 targets
    const svg = d3.select("div.container > svg")
    svg.selectAll("*").remove()
    if (reactData.data.length == 0) {
            console.log("No data to display")
            var newData = Object.assign({}, config.data, { noDataModal: true, noDataModalTable: true, noDataModalSummary: true})
            var newResponse = Object.assign({}, config.response, { noData: true })
            var newConfig = Object.assign({}, config, {data: newData})
            setConfig(updateConfig("response", reactData, newConfig))
    } else {
        setConfig(updateConfig("response", reactData, config))
        //console.log("Storing data")
        //console.log(config)

        function parseTime( t ) {
           //https://stackoverflow.com/a/141504
           var d = new Date();
           var time = t.match( /(\d+)(?::(\d\d))?\s*(p?)/ );
           d.setHours( parseInt( time[1]) + (time[3] ? 12 : 0) );
           d.setMinutes( parseInt( time[2]) || 0 );
           return d;
        }
        const rawData = reactData.data
        const dataForConsideration = rawData.map(function (d) {
            var out = {}
            for(var k in d) out[k] = d[k]
            out['timeParsed'] = new Date(out['time'])
            return out
        })
        const summaryData =  reactData.summary_stats
        drawReact(
            createLayoutData(
                dataForConsideration,
                summaryData,
                false
            ),
            undefined,
            dataForConsideration,
            summaryData
        )
    }
  }

  useEffect(()=>{
    drawChart()
  }, [
    useMemo(
      () => (config.response),
      [config.canvas, config.canvas.viewBox, config.data.api, config.sortingConf.lhs, config.sortingConf.rhs, config.filterConf.omitSkip, config.filterConf.timeRanges, config.filterConf.datetimeRanges, config.filterConf.leftRenderThreshold, config.filterConf.rightRenderThreshold, config.zoomLevel]
    )
  ])

  return (
  <div className="container">
  <ShowModal
    title={"No Data"}
    body={"No data to display."}
    setShow={
        ((cfg, sConf, show) => {
            var newData = Object.assign({}, cfg.data, { noDataModal: show })
            var newConfig = Object.assign({}, cfg, {data: newData})
            sConf(newConfig)
        })}
    configPath={["data", "noDataModal"]} />
    <svg />
  </div>
  )
}
