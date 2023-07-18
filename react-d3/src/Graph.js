import React, {useContext, useEffect} from 'react';
import * as d3 from "d3";
import * as bipartite from "d3-bipartite";
import axios from 'axios';
import { GraphContext } from './GraphContext';

export default function Graph () {

  var [config, _] = useContext(GraphContext)

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
     console.log(targets);
     console.log(sources);
     console.log(g);
     console.log(i);
     console.log(els);
     console.log(svg);
     console.log(d3.select("svg").selectAll("g path"));
     d3.select("svg").selectAll("g path")
       .transition()
   //    .style("fill", d =>
   //          d.target == g.key ? "red" : 
   //          d.source == g.key ? "green" : 
   //            "white"
   //    )
       .style("stroke", d => 
             //data = d;
             d.target === g.key ? "red" : 
             d.source === g.key ? "green" : 
               "blue"
       )
       .style("opacity", d => 
             //data = d;
             d.target === g.key ? .9 : 
             d.source === g.key ? .9 : 
              .1
       )
       .filter(d => d.source != g.key && d.target != g.key )
       .style("opacity", .1)
      console.log(data);
      svg.selectAll(".country")
          .transition()
          // .attr("fill", d => 
          //     targets.includes(d.index) ? "red" : 
          //     sources.includes(d.index) ? "green" : 
          //       color(d.index)
          //    )
          // .attr("stroke", d => 
          //     targets.includes(d.index) ? "red" : 
          //     sources.includes(d.index) ? "green" : 
          //       d3.rgb(color(d.index)).darker()
          //    )
          .filter(d => !targets.includes(d.index) && !sources.includes(d.index) )
          .style("opacity", .1)
  }
  function drawReact(layoutData, filterKey, rawData, margin = {left: 0, right: 0}) {
    const color = "green"
    // clear the svg
    const svg = d3.select("svg")
    console.log(svg);
    d3.select("svg").selectAll("g").remove();
    const container = d3.select("svg").append('g')
       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const nodeWidth = 1;
    let { flows, sources, targets } = createLayoutData(rawData);
    console.log("container");
    console.log(container);
    console.log("layoutData");
    console.log(layoutData);
    // flow lines
    container.append('g')
      .selectAll('path')
      .data(flows)
      .enter().append('path')
      .attr('d', d => d.path)
      .attr('opacity', 0.5)  
      .attr('fill', 'none')  
      .attr('stroke', d => color)  
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
      .attr('fill', d => color)  
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
      .attr('fill', d => color)  
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
      .on("mouseover", (i, g, els) => doSth(i, g, els, rawData, svg) )
      .on("click", (g, i, els) => {
        drawReact(layoutData, g.key)
      })
    d3.select("svg")
      .on("mouseleave", () => {
        // if there was a filter, remove it
        if (filterKey != undefined)
        {
          drawReact(layoutData)
          console.log("mouseout")
        }
      })
    // target labels
    const tgtlabels = container.append('g')
      .selectAll('text')
      .data(targets)
      .enter().append('text')
    tgtlabels
      .attr('x', d => d.x + 15)
      .attr('y', d => d.y + d.height/2)
          .attr('font-family', 'arial')
          .attr('font-size', 12)
          .attr('alignment-baseline', 'middle')
          .attr('text-anchor', 'middle')
          .text(d => d.key);
     tgtlabels
         .on("mouseover", (i, g, els) => doSth(i, g, els, rawData, svg))
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
    console.log(`Logging an INTERACTIVE request to: ${api_url}`)
    if(config.data.api.request == "GET") {
      console.log("GET request...")
      reactData = await d3.json(api_url, function(error, data) {
        return data
      });
      console.log("In d3 json GET request...")
      var out = Object.assign({}, config, {response: reactData})
      console.log(out)
    } else {
      console.log("POST request...")
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
      console.log("In axios if stmt")
      console.log(reactData)
      reactData = reactData.data
    }
    drawReact(createLayoutData(reactData, false, config.canvas.height, config.canvas.width), undefined, reactData)
  }

  useEffect(()=>{
    console.log(`in use effect: ${JSON.stringify(config)}`)
    drawChart()
  }, [config])

  return (
  <div className="container">
    <svg />
  </div>
  )
}
