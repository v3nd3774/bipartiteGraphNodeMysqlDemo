
import React, {useContext, useEffect, useMemo} from 'react';
import { GraphContext } from './GraphContext';
import { isEmpty } from './DataTable'
import { Loading } from './Loading';
import { renderToString } from 'react-dom/server'
import './SummaryStats.css';

import * as d3 from "d3";


export default function SummaryStats () {
    var [config, _] = useContext(GraphContext)

    function drawSummary() {

        let stringToInject = renderToString(<Loading/>)

        let isLoading = !((! isEmpty(config.response)) && (! isEmpty(config.response.summary_stats)))

        var data = !isLoading  ? (config.filterConf.omitSkip ? config.response.no_skip_summary_stats: config.response.summary_stats) : {
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
        edgeCnt.html("")
        if (!isLoading) {
            edgeCnt.attr("class", "edge-cnt activated");
            edgeCnt
                .append('p')
                .text(`Total Edges: ${data.edge_cnt}`)
        } else {
            edgeCnt.attr("class", "edge-cnt");
        }

        const lhsCntUnique = d3.select("div.lhs-node-set-cnt")
        lhsCntUnique.html("")
        if (!isLoading) {
            lhsCntUnique.attr("class", "lhs-node-set-cnt activated");
            lhsCntUnique
                .append('p')
                .text(`Total originating nodes (LHS): ${data.unique_node_set_size.LHS}`);
        } else {
            lhsCntUnique.attr("class", "lhs-node-set-cnt");
        }
        const rhsCntUnique = d3.select("div.rhs-node-set-cnt")
        rhsCntUnique.html("")
        if (!isLoading) {
            rhsCntUnique.attr("class", "rhs-node-set-cnt activated");
            rhsCntUnique
                .append('p')
                .text(`Total terminal nodes (RHS): ${data.unique_node_set_size.RHS}`);
        } else {
            rhsCntUnique.attr("class", "rhs-node-set-cnt");
        }
        // Bar Charts
        // https://stackoverflow.com/a/70536279
        // Viewport Details
        // https://stackoverflow.com/a/8876069
        let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        const margin = { top: 10, right: 10, bottom: 20, left: 40 };
        const width = vw - margin.left - margin.right;
        const height = (vh / 4) - margin.top - margin.bottom;

        const lhsUniqueCnts = d3.select("div.lhs-node-unique-cnts")
        if (isLoading) {
            lhsUniqueCnts.html(stringToInject)
        } else {
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
                .attr("x", width)
                .attr("y", 18)
                .text("Edge count by originating node (LHS)")
            var lhsNodes = d3.union(data.unique_node_cnts.LHS.map(d => d.label))
            //.value(d => d.cnt)
            const lhsStackedData = d3.stack()
                .keys(lhsNodes)
                .value(([, D], key) => D.get(key).cnt)
                .order(d3.stackOrderAscending)
                (d3.index(data.unique_node_cnts.LHS, d => "LHS", d => d.label))
            //const lhsXMax = d3.max(
            //    lhsStackedData[lhsStackedData.length - 1],
            //    d => d[1]
            //)
            const lhsXMax = d3.max(
                lhsStackedData,
                d => d3.max(d, d => d[1])
            )
            //const lhsXMax = data.edge_cnt
            const lhsX = d3.scaleLinear()
                .domain([0, lhsXMax]).nice()
                .range([0, width])
            const lhsY = d3.scaleBand()
                .domain(["LHS"])
                .range([0, height])
                .padding(0.25)
            const lhsColor = d3.scaleOrdinal()
                .domain(lhsNodes)
                .range(d3.schemeSpectral[11])
            const lhsXAxis = d3.axisBottom(lhsX).ticks(6, '~s');
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
            const duration = 128;
            lhsLayers.each(function(_, __) {
                d3.select(this)
                    .selectAll('rect')
                    .data(D => D.map(d => (d.key = D.key, d)))
                    .join('rect')
                        .attr('x', d => lhsX(d[0]))
                        .attr('y', d => lhsY("LHS"))
                        .attr('height', lhsY.bandwidth())
                        .attr('width', d => lhsX(d[1]) - lhsX(d[0]));
              });
            // Populate dropdown
            d3.select("div.lhs-node-unique-cnts-dropdown")
                .selectAll("select")
                .remove()
            d3.select("div.lhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .remove()
            d3.select("div.lhs-node-unique-cnts-dropdown")
                .append("p")
                .attr("class", "lhs-unique-percentage")
            const lhsSorted = Array.from(data.unique_node_cnts.LHS).toSorted(function _(a, b){
                const aCnt = data.unique_node_cnts.LHS.filter(d => d.label == a.label)[0].cnt
                const bCnt = data.unique_node_cnts.LHS.filter(d => d.label == b.label)[0].cnt
                return bCnt - aCnt;
            })
            function handleDropDownLhs(e) {
                const label = lhsSorted[this.selectedIndex].label;
                const ratio = lhsSorted.filter(d => d.label == label)[0].cnt / data.edge_cnt;
                d3.select("div.lhs-node-unique-cnts-dropdown")
                    .selectAll("p")
                    .text(`${(ratio * 100).toFixed(2)}%`)
                d3.select("div.lhs-node-unique-cnts-dropdown")
                    .selectAll("p")
                    .attr("style", `background-color: ${lhsColor(label)};`)
            }
            const lhsUniqueCntsDropdown = d3.select("div.lhs-node-unique-cnts-dropdown")
                .append("select")
                .attr("class", "selection")
                .attr("name", "lhs-summary-selector")
                .on("change", handleDropDownLhs)
            const lhsOptions = lhsUniqueCntsDropdown.selectAll("option")
                .data(lhsSorted)
                .enter()
                .append("option")
            lhsOptions
                .text(d => d.label)
                .attr(d => d.label)
            d3.select("div.lhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .text(`${(100 * lhsSorted[0].cnt / data.edge_cnt).toFixed(2)}%`)
            d3.select("div.lhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .attr("style", `background-color: ${lhsColor(lhsSorted[0].label)};`)
        }

        const rhsUniqueCnts = d3.select("div.rhs-node-unique-cnts")

        if (isLoading) {
            rhsUniqueCnts.html(stringToInject)
        } else {
            rhsUniqueCnts.selectAll("svg").remove();
            rhsUniqueCnts.selectAll("rect").remove();
            rhsUniqueCnts.selectAll("g").remove();
            rhsUniqueCnts
                .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
            const rhsUniqueCntsSvg = d3.select("div.rhs-node-unique-cnts > svg")
            rhsUniqueCntsSvg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);

            rhsUniqueCntsSvg.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", 18)
                .text("Edge count by terminal node (RHS)")
            var rhsNodes = d3.union(data.unique_node_cnts.RHS.map(d => d.label))
            //.value(d => d.cnt)
            const rhsStackedData = d3.stack()
                .keys(rhsNodes)
                .value(([, D], key) => D.get(key).cnt)
                .order(d3.stackOrderAscending)
                (d3.index(data.unique_node_cnts.RHS, d => "rhs", d => d.label))
            const rhsXMax = d3.max(
                rhsStackedData,
                d => d3.max(d, d => d[1])
            )
            //const rhsXMax = data.edge_cnt
            const rhsX = d3.scaleLinear()
                .domain([0, rhsXMax]).nice()
                .range([0, width])
            const rhsY = d3.scaleBand()
                .domain(["rhs"])
                .range([0, height])
                .padding(0.25)
            const rhsColor = d3.scaleOrdinal()
                .domain(rhsNodes)
                .range(d3.schemeSpectral[11])
            const rhsXAxis = d3.axisBottom(rhsX).ticks(6, '~s');
            const rhsYAxis = d3.axisLeft(rhsY);
            rhsUniqueCntsSvg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(rhsXAxis)
                .call(g => g.select('.domain').remove());
            rhsUniqueCntsSvg.append("g")
                .call(rhsYAxis)
                .call(g => g.select('.domain').remove());
            const rhsLayers = rhsUniqueCntsSvg.append('g')
                .selectAll('g')
                .data(rhsStackedData)
                .join('g')
                .attr('fill', d => rhsColor(d.key));
            rhsLayers.each(function(_, i) {
                d3.select(this)
                    .selectAll('rect')
                    .data(D => D.map(d => (d.key = D.key, d)))
                    .join('rect')
                        .attr('x', d => rhsX(d[0]))
                        .attr('y', d => rhsY("rhs"))
                        .attr('height', rhsY.bandwidth())
                        .attr('width', d => rhsX(d[1]) - rhsX(d[0]));
              });
            // Populate dropdown
            d3.select("div.rhs-node-unique-cnts-dropdown")
                .selectAll("select")
                .remove()
            d3.select("div.rhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .remove()
            d3.select("div.rhs-node-unique-cnts-dropdown")
                .append("p")
                .attr("class", "rhs-unique-percentage")
            const rhsSorted = Array.from(data.unique_node_cnts.RHS).toSorted(function _(a, b){
                const aCnt = data.unique_node_cnts.RHS.filter(d => d.label == a.label)[0].cnt
                const bCnt = data.unique_node_cnts.RHS.filter(d => d.label == b.label)[0].cnt
                return bCnt - aCnt;
            })
            function handleDropDownRhs(e) {
                const label = rhsSorted[this.selectedIndex].label;
                const ratio = rhsSorted.filter(d => d.label == label)[0].cnt / data.edge_cnt;
                d3.select("div.rhs-node-unique-cnts-dropdown")
                    .selectAll("p")
                    .text(`${(ratio * 100).toFixed(2)}%`)
                d3.select("div.rhs-node-unique-cnts-dropdown")
                    .selectAll("p")
                    .attr("style", `background-color: ${rhsColor(label)};`)
            }
            const rhsUniqueCntsDropdown = d3.select("div.rhs-node-unique-cnts-dropdown")
                .append("select")
                .attr("class", "selection")
                .attr("name", "rhs-summary-selector")
                .on("change", handleDropDownRhs)
            const rhsOptions = rhsUniqueCntsDropdown.selectAll("option")
                .data(rhsSorted)
                .enter()
                .append("option")
            rhsOptions
                .text(d => d.label)
                .attr(d => d.label)
            d3.select("div.rhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .text(`${(100 * rhsSorted[0].cnt / data.edge_cnt).toFixed(2)}%`)
            d3.select("div.rhs-node-unique-cnts-dropdown")
                .selectAll("p")
                .attr("style", `background-color: ${rhsColor(rhsSorted[0].label)};`)
        }
    }


    useEffect(()=>{
      drawSummary()
    }, [
        config.response,
        config.response.summary_stats,
        config.filterConf.omitSkip
    ])

    return (
        <div className="summary-container">
            <div className="edge-cnt"> </div>
            <div className="lhs-node-set-cnt"> </div>
            <div className="rhs-node-set-cnt"> </div>
            <div className="lhs-node-unique-cnts">
                <div className="lhs-node-unique-cnts-dropdown"> </div>
            </div>
            <div className="rhs-node-unique-cnts">
                <div className="rhs-node-unique-cnts-dropdown"> </div>
            </div>
        </div>
    )
}
