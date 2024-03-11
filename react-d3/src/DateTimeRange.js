import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

import './DateTimeRange.css';

import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

// Return new config object with updated start/end time on
// appropriate time range.
function handleChange(id, config, newTime, startOrEnd) {
    let newConfig = {}
    for(var k in config) newConfig[k] = config[k]
    newConfig.filterConf.datetimeRanges[id][startOrEnd] = newTime
    return newConfig
}
function handleStartChange(id, config, newTime) {
    return handleChange(id, config, newTime, 0)
}
function handleEndChange(id, config, newTime) {
    return handleChange(id, config, newTime, 1)
}

// Return appropriate time from config
function retrieveDatetime(id, config, startOrEnd) {
    let ranges = config.filterConf.datetimeRanges
    let range = ranges[id]
    return range[startOrEnd]
}
function retrieveStartDatetime(id, config) {
    return retrieveDatetime(id, config, 0)
}
function retrieveEndDatetime(id, config) {
    return retrieveDatetime(id, config, 1)
}

function generateDatetimePicker(isStart, updateConfig, id, config) {
    let changeFn = isStart ? updateConfig(handleStartChange) : updateConfig(handleEndChange)
    let value = isStart ? retrieveStartDatetime(id, config) : retrieveEndDatetime(id, config)
    return (<Datetime
        onChange={changeFn}
        value={value}
    />)
}

// id corresponds to what id should be included in the data field for this component
export default function DateTimeRange(kwargs) {
    var [config, setConfig] = useContext(GraphContext)
    let id = kwargs.id
    function updateConfig(auxFn) {
        return function (newTime) {
            let newConfig = auxFn(id, config, newTime)
            setConfig(newConfig)
        }
    }
    let out = (
        <div className={"datetime-range-container"} datetime-range-id={id} key={`datetime-range-${id}`}>
            <div className={"datetime-range-start-container"} >
                <span className={"datetime-range-start-text"}>Start</span>
                {generateDatetimePicker(true, updateConfig, id, config)}
            </div>
            <div className={"datetime-range-end-container"} >
                <span className={"datetime-range-end-text"}>End</span>
                {generateDatetimePicker(false, updateConfig, id, config)}
            </div>
        </div>
    )

    return out
}
