import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

import TimeRange from './TimeRange';
import './TimeRanges.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRectangleXmark, faSquarePlus } from '@fortawesome/free-solid-svg-icons';

const closeMark = <FontAwesomeIcon icon={faRectangleXmark} />
const plusMark = <FontAwesomeIcon icon={faSquarePlus} />

function handleClose(id, config) {
    console.log(`Clicked on close id ${id}`)
    return config;
}
function handleNew(_, config) {
    console.log(`Clicked on plus`)
    let newConfig = {}
    for(var k in config) newConfig[k] = config[k]
    newConfig.filterConf.timeRanges.push(["00:00:00", "11:59:59"])
    return newConfig
}

function generate_time_range (n, i, handleNewFn, handleCloseFn) {
    let closeAction = i > 0 ?  (<div className="time-range-close"><a href={"javascript:void(0)"} onClick={handleCloseFn}>{closeMark}</a></div>) : ""
    let newAction = i == n - 1 ? (<div className="time-range-new"><a href={"javascript:void(0)"} onClick={handleNewFn}>{plusMark}</a></div>) : ""
    let out = (
        <div className={"time-range-control-group"} >
            <TimeRange id={i} />
            {closeAction}
            {newAction}
        </div>
    )
    return out
}

function generate_time_ranges (n, updateConfig) {
    const ranges = []
    for (let i = 1; i < n; i++) {
        ranges.push(
            generate_time_range(n, i, updateConfig(i, handleNew), updateConfig(i, handleClose))
        )
    }
    return ranges
}

export default function TimeRanges() {
    var [config, setConfig] = useContext(GraphContext)
    let n = config.filterConf.timeRanges.length
    function updateConfig(id, auxFn) {
        return function _ () {
            let newConfig = auxFn(id, config)
            setConfig(newConfig)
        }
    }
    let out = (
        <div className={"time-ranges-container"}>
            {generate_time_range(n, 0, updateConfig(0, handleNew), updateConfig(0, handleClose))}
            {generate_time_ranges(n, updateConfig)}
        </div>
    )
    return out
}
