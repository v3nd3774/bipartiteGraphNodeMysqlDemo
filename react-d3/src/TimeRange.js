import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

import TimePicker from 'react-time-picker'
import './TimePicker.css';

// Return new config object with updated start/end time on
// appropriate time range.
function handleChange(id, config, newTime, startOrEnd) {
    let ranges = config.filterConf.timeRanges
    let range = ranges[id]
    range[startOrEnd] = newTime
    ranges[id] = range
    config.filterConf.timeRanges = ranges
    return config
}
function handleStartChange(id, config, newTime) {
    return handleChange(id, config, newTime, 0)
}
function handleEndChange(id, config, newTime) {
    return handleChange(id, config, newTime, 1)
}

// Return appropriate time from config
function retrieveTime(id, config, startOrEnd) {
    let ranges = config.filterConf.timeRanges
    let range = ranges[id]
    return range[startOrEnd]
}
function retrieveStartTime(id, config) {
    return retrieveTime(id, config, 0)
}
function retrieveEndTime(id, config) {
    return retrieveTime(id, config, 1)
}

// id corresponds to what id should be included in the data field for this component
export default function TimeRange(id) {
    var [config, setConfig] = useContext(GraphContext)
    function updateConfig(auxFn) {
        return function (newTime) {
            let newConfig = auxFn(id, config, newTime)
            setConfig(newConfig)
        }
    }
    let out = (
        <div className={"time-range-container"} time-range-id={id}>
            <div className={"time-range-start-container"} >
                <TimePicker onChange{updateConfig(handleStartChange)} value={retrieveStartTime()} />
            </div>
            <div className={"time-range-end-container"} >
                <TimePicker onChange{updateConfig(handleEndChange)} value={retrieveEndTime()} />
            </div>
        </div>
    )
    return out
}
