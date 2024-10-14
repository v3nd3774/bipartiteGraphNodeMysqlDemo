import React, {useContext} from 'react';
import { subtractOneDay, subtractOneYear, GraphContext } from './GraphContext';

import DateTimeRange from './DateTimeRange';
import './DateTimeRanges.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRectangleXmark, faSquarePlus } from '@fortawesome/free-solid-svg-icons';

const closeMark = <FontAwesomeIcon icon={faRectangleXmark} />
const plusMark = <FontAwesomeIcon icon={faSquarePlus} />

function handleClose(id, config) {
    console.log(`Clicked on close id ${id}`)
    let newConfig = {}
    for(var k in config) newConfig[k] = config[k]
    newConfig.filterConf.datetimeRanges.splice(id, 1)
    return newConfig
}
function handleNew(config) {
    console.log(`Clicked on plus`)
    let newConfig = {}
    for(var k in config) newConfig[k] = config[k]
    let minDateStr = newConfig.response.summary_stats.min_date
    let maxDateStr = newConfig.response.summary_stats.max_date
    newConfig.filterConf.datetimeRanges.push([
        new Date(minDateStr), new Date(maxDateStr)
    ])
    return newConfig
}

function generate_datetime_range (n, i, handleCloseFn) {
    let closeAction = i > 0 ?  (<div className="datetime-range-close"><a href={"javascript:void(0)"} onClick={handleCloseFn}>{closeMark}</a></div>) : ""
    let out = (
        <div className={"datetime-range-control-group"} >
            <DateTimeRange id={i} />
            {closeAction}
        </div>
    )
    return out
}

function generate_datetime_ranges (n, updateConfig) {
    const ranges = []
    for (let i = 1; i < n; i++) {
        ranges.push(
            generate_datetime_range(n, i, updateConfig(i, handleClose))
        )
    }
    return ranges
}

export default function DateTimeRanges() {
    var [config, setConfig] = useContext(GraphContext)
    let n = config.filterConf.datetimeRanges.length
    function updateConfig(id, auxFn) {
        return function _ () {
            let newConfig = auxFn(id, config)
            setConfig(newConfig)
        }
    }
    let newAction = (<div className="datetime-range-new"><a href={"javascript:void(0);"} onClick={function () {
        let newConfig = handleNew(config)
        setConfig(newConfig)
    }}>{plusMark}</a></div>)
    let out = (
        <div className={"datetime-ranges-container"}>
            <div className={"datetime-ranges-header"} key={"datetime-ranges-header"}>
                <h5>Datetime filters</h5>
                <p>Data will only be considered if the data was created within all of these Datetime ranges.</p>
                {newAction}
            </div>
            {generate_datetime_ranges(n, updateConfig)}
        </div>
    )
    return out
}
