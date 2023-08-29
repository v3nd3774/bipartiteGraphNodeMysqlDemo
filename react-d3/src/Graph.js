import React, {useContext, useEffect, useMemo} from 'react';
import * as d3 from "d3";
import * as bipartite from "d3-bipartite";
import axios from 'axios';
import { GraphContext } from './GraphContext';

export default function Graph () {

  var [config, setConfig] = useContext(GraphContext)

  function updateConfig(k, v, parent) {
    var obj = {
      [`${k}`]: v
    }
    return Object.assign(
      {},
      parent,
      obj
    )
  }

  function createLayoutData (filteredData, filtered = false, height=1000, width=1000, padding=0) {
    const layout = bipartite()
      .width(width)
      .height(filtered ? height/2 : height)
      .padding(padding)
      .source(d => d.source)
      .target(d => d.target)
      .value(d => d.value);
    return layout(filteredData);
  }
  function doSth (g, i, els, rawData, svg) {
     const targets = [...rawData.filter(d => d.target.index === i).map(d => d.source.index), i]
     const sources = [...rawData.filter(d => d.source.index === i).map(d => d.target.index), i]
     var data;
     d3.select("svg").selectAll("g path")
       .transition()
       .style("fill", d =>
         "white"
       )
       .style("stroke", d => 
         "white"
       )
       .style("opacity", _ =>
         0
       )
       .filter(d => {
         return d.source == sources[0].key
       })
       .style("fill", d =>
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
               "yellow" // zero here
       )
       .style("stroke", d => 
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
               "yellow" // zero here
       )
       .style("opacity", _ =>
         0.5
       )
  }
  function doSthTgt (g, i, els, rawData, svg) {
     const targets = [...rawData.filter(d => d.target.index === i).map(d => d.source.index), i]
     const sources = [...rawData.filter(d => d.source.index === i).map(d => d.target.index), i]
     var data;
     d3.select("svg").selectAll("g path")
       .transition()
       .style("fill", d =>
         "white"
       )
       .style("stroke", d => 
         "white"
       )
       .style("opacity", _ =>
         0
       )
       .filter(d => {
         return d.target == targets[0].key
       })
       .style("fill", d =>
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
               "yellow" // zero here
       )
       .style("stroke", d => 
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
               "yellow" // zero here
       )
       .style("opacity", _ =>
         0.75
       )
  }
  function drawReact(layoutData, filterKey, rawData, margin = {left: 0, right: 0}) {
    // clear the svg
    const svg = d3.select("svg")
    d3.select("svg").selectAll("g").remove();
    const container = d3.select("svg").append('g')
       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const nodeWidth = 1;
    let { flows, sources, targets } = createLayoutData(rawData);
    // flow lines
    container.append('g')
      .selectAll('path')
      .data(flows)
      .enter().append('path')
      .attr('d', d => d.path)
      .attr('opacity', 0.5)  
      .attr('fill', 'none')  
      .attr('stroke', d =>
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
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
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
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
             d.target == -1 ? "red" : 
             d.target == -2 ? "purple" : 
             d.target ==  1 ? "green" : 
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
      .attr('x', d => d.x - 75)
      .attr('y', d => d.y)
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
  }

  async function drawChart() {

    const svg = d3.select("div.container > svg")
    svg.selectAll("*").remove()
    svg.attr("viewBox", [
        config.canvas.viewBox.o,
        config.canvas.viewBox.tw,
        config.canvas.viewBox.th,
        config.canvas.viewBox.f
      ])
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
      reactData = reactData.data
    }
    setConfig(updateConfig("response", reactData, config))
    console.log("Storing data")
    console.log(config)
    drawReact(createLayoutData(reactData, false, config.canvas.height, config.canvas.width), undefined, reactData)
  }

  useEffect(()=>{
    drawChart()
  }, [
    useMemo(
      () => (config.response),
      []
    )
  ])

  return (
  <div className="container">
    <svg />
  </div>
  )
}
