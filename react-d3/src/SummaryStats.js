
import React, {useContext, useEffect, useMemo} from 'react';
import { GraphContext } from './GraphContext';
import { isEmpty } from './DataTable'
import './SummaryStats.css';

import * as d3 from "d3";


export default function SummaryStats () {
    var [config, _] = useContext(GraphContext)

    function drawSummary() {
        var data = (! isEmpty(config.response)) && (! isEmpty(config.response.summary_stats)) ? config.response.summary_stats : {
            "edge_cnt": 1,
            "unique_node_set_size": {"LHS": 1, "RHS":1},
            "unique_node_cnts": {
                "LHS": [
                    {
                        "label": "a",
                        "cnt": 1
                    },
                ],
                "RHS": [
                    {
                        "label": "b",
                        "cnt": 1
                    }
                ]
            }
        }
        // Static Counts
        const edgeCnt = d3.select("div.edge-cnt")
        edgeCnt.selectAll("p").remove();
        edgeCnt
            .append('p')
            .text(`Total Edges in graph: ${data.edge_cnt}`);
        const lhsCntUnique = d3.select("div.lhs-node-set-cnt")
        lhsCntUnique.selectAll("p").remove();
        lhsCntUnique
            .append('p')
            .text(`Total unique nodes in graph left hand side: ${data.unique_node_set_size.LHS}`);
        const rhsCntUnique = d3.select("div.rhs-node-set-cnt")
        rhsCntUnique .selectAll("p").remove();
        rhsCntUnique
            .append('p')
            .text(`Total unique nodes in graph right hand side: ${data.unique_node_set_size.RHS}`);

        // Bar Charts
        // https://stackoverflow.com/a/70536279
        const margin = { top: 10, right: 10, bottom: 20, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const lhsUniqueCnts = d3.select("div.lhs-node-unique-cnts")
        lhsUniqueCnts.selectAll("svg").remove();
        lhsUniqueCnts.selectAll("rect").remove();
        lhsUniqueCnts.selectAll("g").remove();
        lhsUniqueCnts
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
        const lhsUniqueCntsSvg = d3.select("div.lhs-node-unique-cnts > svg")
        lhsUniqueCntsSvg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

        lhsUniqueCntsSvg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", width * 0.75 )
            .attr("y", 18)
            .text("Edge count originating from left hand side")
        var lhsNodes = d3.union(data.unique_node_cnts.LHS.map(d => d.label))
        const lhsStackedData = d3.stack()
            .keys(lhsNodes)
            .value(d => d.cnt)
            (data.unique_node_cnts.LHS)
        const lhsXMax = d3.max(
            lhsStackedData[lhsStackedData.length - 1],
            d => d[1]
        )
        const lhsX = d3.scaleLinear()
            .domain([0, lhsXMax]).nice()
            .range([0, width])
        const lhsY = d3.scaleBand()
            .domain(["LHS"])
            .range([0, height])
            .padding(0.25)
        const lhsColor = d3.scaleOrdinal()
            .domain(lhsNodes)
            .range(d3.schemeTableau10)
        const lhsXAxis = d3.axisBottom(lhsX).ticks(5, '~s');
        const lhsYAxis = d3.axisLeft(lhsY);
        lhsUniqueCntsSvg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(lhsXAxis)
            .call(g => g.select('.domain').remove());
        lhsUniqueCntsSvg.append("g")
            .call(lhsYAxis)
            .call(g => g.select('.domain').remove());
        const lhsLayers = lhsUniqueCntsSvg.append('g')
            .selectAll('g')
            .data(lhsStackedData)
            .join('g')
            .attr('fill', d => lhsColor(d.key));
        const duration = 256;
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


    useEffect(()=>{
      drawSummary()
    }, [
        config.response,
        config.response.summary_stats
    ])

    return (
        <div className="summary-container">
            <h2>Summary Stats</h2>
            <div className="edge-cnt"> </div>
            <div className="lhs-node-set-cnt"> </div>
            <div className="rhs-node-set-cnt"> </div>
            <div className="lhs-node-unique-cnts"> </div>
            <div className="rhs-node-unique-cnts"> </div>
        </div>
    )
}
