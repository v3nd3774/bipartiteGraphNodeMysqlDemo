import { renderToString } from 'react-dom/server'
import React, {useContext, useEffect, useMemo} from 'react';
import * as d3 from "d3";
import axios from 'axios';
import { GraphContext } from './GraphContext';
import { Loading } from './Loading';
import { d3Bipartite } from './d3Bipartite';
import { updateConfig } from './Utility.js';
import { lhsAvailibleSorting, rhsAvailibleSorting} from './Sorting';

export default function Graph () {

  var [config, setConfig] = useContext(GraphContext)

  function createLayoutData (filteredData, filtered = false, height=1000, width=1000, padding=0) {
    const layout = d3Bipartite(
            lhsAvailibleSorting[config.sortingConf.lhs],
            rhsAvailibleSorting[config.sortingConf.rhs]
    )
      .width(width)
      .height(height)
      .padding(padding)
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
  function drawReact(layoutData, filterKey, rawData, margin = {left: 0, right: 0}) {
    // clear the svg
    d3.select("div.container").selectAll("*").remove()
    d3.select("div.container").append("svg")

    const svg = d3.select("svg")
    svg.attr("viewBox", [
        config.canvas.viewBox.o,
        config.canvas.viewBox.tw,
        config.canvas.viewBox.th,
        config.canvas.viewBox.f
      ])
    svg.attr("width", config.canvas.width)
    svg.attr("height", config.canvas.height)
    d3.select("svg").selectAll("g").remove();
    const container = d3.select("svg").append('g')
       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const nodeWidth = 1;
    //console.log(config.sortingConf)
    let { flows, sources, targets } = createLayoutData(
      rawData,
      false,
      config.canvas.viewBox.th,
      config.canvas.viewBox.f,
      config.canvas.padding
    );
    // flow lines
    container.append('g')
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
    container.append('g')
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
    container.append('g')
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
      .attr('font-size', 10)
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('color', 'black')
      .text(d => d.key)
    srclabels
      .on("mouseover", (i, g, els) =>
        doSth(i, g, els, rawData, svg)
      )
      .on("click", (g, i, els) => {
        drawReact(layoutData, filterKey, rawData, margin)
      })
    d3.select("svg")
      .on("mouseleave", () => {
        // if there was a filter, remove it
        if (filterKey != undefined)
        {
          drawReact(layoutData)
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
          .attr('font-size', 12)
          .attr('alignment-baseline', 'middle')
          .attr('text-anchor', 'middle')
          .attr('color', 'black')
          .text(d => {
            return d.key
          });
     tgtlabels
         .on("mouseover", (i, g, els) => doSthTgt(i, g, els, rawData, svg))
         //.on("mouseout", stopDoingSth)


    function handleZoom(e) {
      d3.select('svg g')
        .attr('transform', e.transform);
    }
    let zoom = d3.zoom()
      .on('zoom', handleZoom)
    d3.select('svg').call(zoom)
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
    const dataForConsideration = config.filterConf.omitSkip ? reactData.no_skip_data : reactData.data
    drawReact(
        createLayoutData(
            dataForConsideration,
            false,
            config.canvas.viewBox.th,
            config.canvas.viewBox.f
        ),
        undefined,
        dataForConsideration
    )
  }

  useEffect(()=>{
    drawChart()
  }, [
    useMemo(
      () => (config.response),
      [config.canvas, config.canvas.viewBox, config.data.api, config.sortingConf.lhs, config.sortingConf.rhs, config.filterConf.omitSkip]
    )
  ])

  return (
  <div className="container">
    <svg />
  </div>
  )
}
