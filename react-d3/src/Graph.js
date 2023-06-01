import React, {Component} from 'react';
import * as d3 from "d3";
import * as bipartite from "d3-bipartite";
import {create} from 'd3';

class Graph extends Component {

  constructor(props){
    super(props);
    this.state = null;
    // use custom endpoint if props is set and
    // contains a new query to try
    // otherwise, use the default route to get data
    if (props.MYSQL_JOIN_QUERY) {
      console.log("LOGGING CONSTRUCTOR DETERMINED INTERACTIVE")
    }
  }

  createLayoutData (filteredData, filtered = false, height=1000, width=1000, padding=0) {
    const layout = bipartite()
      .width(width)
      .height(filtered ? height/2 : height)
      .padding(padding)
      .source(d => d.source)
      .target(d => d.target)
      .value(d => d.value);
    return layout(filteredData);
  }
  doSth (g, i, els, rawData, svg) {
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
  drawReact(layoutData, filterKey, rawData, margin = {left: 0, right: 0}) {
    const color = "green"
    // clear the svg
    const svg = d3.select("svg")
    console.log(svg);
    d3.select("svg").selectAll("g").remove();
    const container = d3.select("svg").append('g')
       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const nodeWidth = 1;
    let { flows, sources, targets } = this.createLayoutData(rawData);
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
      .on("mouseover", (i, g, els) => this.doSth(i, g, els, rawData, svg) )
      .on("click", (g, i, els) => {
        this.drawReact(layoutData, g.key)
      })
    d3.select("svg")
      .on("mouseleave", () => {
        // if there was a filter, remove it
        if (filterKey != undefined)
        {
          this.drawReact(layoutData)
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
         .on("mouseover", (i, g, els) => this.doSth(i, g, els, rawData, svg))
         //.on("mouseout", stopDoingSth)
  }
  async drawChart() {
    var reactData;
    if (this.state) {
      // If interactive request then state will be populated
      console.log("Logging an INTERACTIVE request")
      reactData = await d3.json('http://localhost:5000/environ', function(error, data) {
          return data
      });
    } else {
      // Otherwise use default request from file
      reactData = await d3.json('http://localhost:5000/environ', function(error, data) {
          return data
      });
    }
    const svgSize = 2000
    const svg = d3.select("div.container > svg")
      .attr("viewBox", [
        (-svgSize / 30),
        (-svgSize / 30),
        svgSize/2,
        svgSize*0.6
      ])
    this.drawReact(this.createLayoutData(reactData, false, svgSize, svgSize), undefined, reactData)
  }
  componentDidMount() {
    this.drawChart()
  }
  render() {
    return (
    <div className="container">
      <svg />
    </div>
    )
  }
}

export default Graph;
