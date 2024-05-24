import { renderToString } from 'react-dom/server'
import React, {useContext, useState, useEffect, useMemo} from 'react';
import * as d3 from "d3";
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


  function createLayoutData (filteredData, summary_data, filtered = false, height=detectedHeight * 2, width=detectedWidth * .85, padding=config.canvas.padding) {
    function onlyUnique(value, index, array) {
      return array.indexOf(value) === index;
    }
    let edge_cnt = summary_data.edge_cnt
    let padding_value = height / (edge_cnt * .5)
    const layout = d3Bipartite(
            lhsAvailibleSorting[config.sortingConf.lhs],
            rhsAvailibleSorting[config.sortingConf.rhs]
    )
      .width(width)
      .height(height)
      .padding(padding_value)
      .source(d => d.source)
      .target(d => d.target)
      .value(d => d.value);
    return layout(filteredData);
  }
  function doSth (g, i, els, rawData, svg) {
     d3.select("svg").selectAll("g path")
       .filter(d => {
         return d.source != i.key
       })
       .transition()
       .style("stroke", d =>
         "white"
       )
       .style("stroke-width", d =>
         0
       )
       .style("opacity", _ =>
         0
       )
     d3.select("svg").selectAll("g path")
       .filter(d => {
         return d.source == i.key
       })
       .transition()
       .style("stroke", d =>
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
       )
       .style("stroke-width", d =>
         1.01010101010101010102
       )
       .style("opacity", _ =>
         0.5
       )
  }
  function stopDoSthTgt (g, i, els, rawData, svg) {
     const all = d3.select("svg").selectAll("g path")
       all
       .transition()
       .style("stroke", d =>
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
       )
       .style("stroke-width", d =>
         1.01010101010101010102
       )
       .style("opacity", _ =>
         0.5
       )
  }
  function doSthTgt (g, i, els, rawData, svg) {
     const all = d3.select("svg").selectAll("g path")
       all
       .filter(d => {
         return d.target != i.key
       })
       .transition()
       .style("stroke", d =>
         "white"
       )
       .style("stroke-width", d =>
         0
       )
       .style("opacity", _ =>
         0
       )
       all
       .filter(d => {
         return d.target == i.key
       })
       .transition()
       .style("stroke", d =>
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
       )
       .style("stroke-width", d =>
         1.01010101010101010102
       )
       .style("opacity", _ =>
         0.5
       )
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
    //console.log(config.sortingConf)
    let { flows, sources, targets } = createLayoutData(
      rawData,
      summaryData,
      false
    );
    // flow lines
    let lines = container.append('g')
      .selectAll('path')
      .data(flows)
      .enter().append('path')
      .attr('d', d => d.path)
      .attr('opacity', 0.5)
      .attr('fill', 'none')
      .attr('stroke', d =>
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
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
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
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
             d.original.label == -1 ? "red" :
             d.original.label == -2 ? "purple" :
             d.original.label ==  1 ? "green" :
               "yellow" // zero here
      )
      .attr('stroke', 'none');
    // source labels
    const srclabels = container.append('g')
      .selectAll('text')
      .data(sources)
      .enter().append('text')
    srclabels
      .attr('x', d => d.x - 15)
      .attr('y', d => d.y + d.height/2)
      .attr('font-family', 'arial')
      .attr('font-size', 20)
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('color', 'black')
      .text(d => d.key)
    srclabels
      .on("mouseenter", (i, g, els) =>
        doSth(i, g, els, rawData, svg)
      )
      .on("mouseleave", (i, g, els) => stopDoSthTgt(i, g, els, rawData, svg))
      .on("click", (g, i, els) => {
        drawReact(layoutData, filterKey, rawData, summaryData, margin)
      })
    d3.select("svg")
      .on("mouseleave", () => {
        // if there was a filter, remove it
        if (filterKey != undefined)
        {
          drawReact(layoutData, filterKey, rawData, summaryData, margin)
        }
      })
    // target labels
    const tgtlabels = container.append('g')
      .selectAll('text')
      .data(targets)
      .enter().append('text')

    tgtlabels
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.height/2)
          .attr('font-family', 'arial')
          .attr('font-size', 20)
          .attr('alignment-baseline', 'middle')
          .attr('text-anchor', 'middle')
          .attr('color', 'black')
          .text(d => {
            return d.key
          });
     tgtlabels
         .on("mouseenter", (i, g, els) => doSthTgt(i, g, els, rawData, svg))
         .on("mouseleave", (i, g, els) => stopDoSthTgt(i, g, els, rawData, svg))

     function fixLabels(labels, left = true) {
        var prevs = [];
        var iterations = 20
        var done = false
        while (!done) {
            prevs = [];
            done = true
            iterations -= 1
            if (iterations == 0) {
                break
            }
            labels.each(function(d, i) {
              let comparison_obj = this
              prevs.forEach(function(prev) {
                if(i > 0) {
                  var thisbb = comparison_obj.getBoundingClientRect();
                  var prevbb = prev.getBoundingClientRect();
                  // move if they overlap
                  let overlap = !(thisbb.right < prevbb.left ||
                          thisbb.left > prevbb.right ||
                          thisbb.bottom < prevbb.top ||
                          thisbb.top > prevbb.bottom)
                  if(overlap) {
                      done = false
                      let selection = d3.select(comparison_obj)
                      var prev_value = 0
                      var prev_transform = selection._groups[0][0].getAttribute("transform")
                      if (!(prev_transform == null || prev_transform == "" || typeof prev_transform == "undefined")) {
                          prev_value = parseFloat(
                            selection._groups[0][0].getAttribute("transform").split(",")[0].split("(")[1]
                          )
                      }
                      if (!left) {
                        let translate_value = prev_value + (prevbb.width + thisbb.width) * 1.25
                        selection.attr("transform",
                            "translate(" + translate_value + ", 0)");
                      } else {
                        let translate_value = prev_value + (-1 * ((prevbb.width + thisbb.width) * 1.25))
                        selection.attr("transform",
                            "translate(" + translate_value + ", 0)");
                      }
                    }
                }
              })
              prevs.push(comparison_obj)
            });
        }
    }
    fixLabels(srclabels)
    fixLabels(tgtlabels, false)

    let path_str = lines._groups[0][0].getAttribute("d")
    let path_parts = path_str.split(' ')
    let last_x = path_parts[2].split(',')[0]
    let last_x_int = parseInt(last_x)

    function handleZoom(e) {
      const eventType = e.sourceEvent.type;
      let cont = d3.select('svg g')
      let old_transform = cont.attr('transform');
      let old_scale = 1
      if (old_transform.includes('scale')) {
        old_scale = parseFloat(old_transform.split(' ')[1].split(',')[0]);
      }
      if (eventType !== 'wheel') {
        e.transform.k = old_scale
      } else {
        srclabels
            .attr("transform", `scale(${e.transform.k}, 1)`);
      }
      tgtlabels
        .attr('x', d => last_x_int / e.transform.k)
        .attr("transform", d => `scale(${e.transform.k}, 1)`);
      cont
          .attr("transform", `scale(1, ${e.transform.k}) translate(0, ${e.transform.y})`);
    }
    let zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', handleZoom)

    d3.select('svg')
        .call(zoom)
  }

  async function drawChart() {

    d3.select("div.container").selectAll("*").remove()
    let stringToInject = renderToString(<Loading/>)
    d3.select("div.container").html(stringToInject)
    var reactData;
    var api_url = `${config.data.api.protocol}://${config.data.api.host}:${config.data.api.port}/${config.data.api.endpoint}`
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
    //console.log("Noise removal to avoid y axis labels on LHS stacking")
    //var frequencies = reactData["summary_stats"]["unique_node_cnts"]["LHS"]
    //console.log("freqs")
    //console.log(frequencies)
    // purge elements from being rendered that have less than 10 targets
    //reactData = reactData.data.filter((item) => frequencies[item.source] >= 10)
    const svg = d3.select("div.container > svg")
    svg.selectAll("*").remove()
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
    const rawData = config.filterConf.omitSkip ? reactData.no_skip_data : reactData.data
    const dataForConsideration = rawData.map(function (d) {
        var out = {}
        for(var k in d) out[k] = d[k]
        out['timeParsed'] = new Date(out['time'])
        return out
    }).filter(genTRFilter(config)).filter(genDTRFilter(config))
    const summaryData = config.filterConf.omitSkip ? reactData.no_skip_summary_stats : reactData.summary_stats
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

  useEffect(()=>{
    drawChart()
  }, [
    useMemo(
      () => (config.response),
      [config.canvas, config.canvas.viewBox, config.data.api, config.sortingConf.lhs, config.sortingConf.rhs, config.filterConf.omitSkip, config.filterConf.timeRanges]
    )
  ])

  return (
  <div className="container">
    <svg />
  </div>
  )
}
