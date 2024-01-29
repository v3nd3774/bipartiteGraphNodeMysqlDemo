
import React, {useContext, useEffect, useMemo} from 'react';
import { GraphContext } from './GraphContext';

import * as d3 from "d3";


export default function SummaryStats () {
    var [config, _] = useContext(GraphContext)

    function isEmpty (obj) {
      return Object.keys(obj).length === 0
    }

    function drawSummary() { var data = (! isEmpty(config.response)) && (! isEmpty(config.response.summary_stats)) ? config.response.summary_stats : {
            "edge_cnt": 1,
            "node_cnts": {"LHS": 1, "RHS":1},
            "unique_node_set_size": {"LHS": 1, "RHS":1},
            "unique_node_cnts": {"LHS": {"a":1}, "RHS":{"b":1}}
        }

        const margin = { top: 10, right: 10, bottom: 20, left: 40 };
        const width = 300 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        // Static Counts
        const edgeCnt = d3.select("div.edge-cnt")
        edgeCnt.selectAll("h2").remove();
        edgeCnt
            .append('h2')
            .text(`Total Edges in graph: ${data.edge_cnt}`);
        const lhsCnt = d3.select("div.lhs-node-cnt")
        lhsCnt.selectAll("h2").remove();
        lhsCnt
            .append('h2')
            .text(`Total nodes in graph left hand side: ${data.node_cnts.LHS}`);
        const rhsCnt = d3.select("div.rhs-node-cnt")
        rhsCnt.selectAll("h2").remove();
        rhsCnt
            .append('h2')
            .text(`Total nodes in graph right hand side: ${data.node_cnts.RHS}`);
        const lhsCntUnique = d3.select("div.lhs-node-set-cnt")
        lhsCntUnique.selectAll("h2").remove();
        lhsCntUnique
            .append('h2')
            .text(`Total unique nodes in graph left hand side: ${data.unique_node_set_size.LHS}`);
        const rhsCntUnique = d3.select("div.rhs-node-set-cnt")
        rhsCntUnique .selectAll("h2").remove();
        rhsCntUnique
            .append('h2')
            .text(`Total unique nodes in graph right hand side: ${data.unique_node_set_size.RHS}`);

        // Bar Charts
        // https://stackoverflow.com/a/70536279
        const lhsUniqueCnts = d3.select("div.lhs-node-set-cnts")
        lhsUniqueCnts.selectAll("svg").remove();
        lhsUniqueCnts
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
        var nodes = Object.keys(data.unique_node_cnts.LHS)
        const lhsStackedData = d3.stack()
            .keys(nodes)(data.unique_node_cnts.LHS);
        const lhsXMax = d3.max(lhsStackedData[lhsStackedData.length - 1], d => d[1])
        const lhsX = d3.scaleLinear()
            .domain([0, lhsXMax]).nice()
            .range([0, width])
        const lhsY = d3.scaleBand()
            .domain(["LHS"])
            .range([0, height])
            .padding(0.25)
        const lhsColor = d3.scaleOrdinal()
            .domain(nodes)
            .range(d3.schemeTableau10)
        const lhsXAxis = d3.axisBottom(lhsX).ticks(5, '~s');
        const lhsYAxis = d3.axisLeft(lhsY);
        lhsUniqueCnts.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(lhsXAxis)
            .call(g => g.select('.domain').remove());
        lhsUniqueCnts.append("g")
            .call(lhsYAxis)
            .call(g => g.select('.domain').remove());
        const lhsLayers = lhsUniqueCnts.append('g')
            .selectAll('g')
            .data(lhsStackedData)
            .join('g')
            .attr('fill', d => lhsColor(d.key));
        const duration = 1000;
        const lhsT = d3.transition()
            .duration(duration)
            .ease(d3.easeLinear);
        lhsLayers.each(function(_, i) {
            d3.select(this)
                .selectAll('rect')
                .data(d => d)
                .join('rect')
                    .attr('x', d => lhsX(d[0]))
                    .attr('y', d => lhsY("LHS"))
                    .attr('height', lhsY.bandwidth())
                .transition(lhsT)
                    .delay(i * duration)
                    .attr('width', d => lhsX(d[1]) - lhsX(d[0]));
          });
    }


    return (
        <div className="summary-container">
            <div className="edge-cnt"> </div>
            <div className="lhs-node-cnt"> </div>
            <div className="rhs-node-cnt"> </div>
            <div className="lhs-node-set-cnt"> </div>
            <div className="rhs-node-set-cnt"> </div>
            <div className="lhs-node-unique-cnts"> </div>
            <div className="rhs-node-unique-cnts"> </div>
        </div>
    )
}
