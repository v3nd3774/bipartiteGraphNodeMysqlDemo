import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import './TimeRange.css';

// Return new config object with updated start/end time on
// appropriate time range.
function handleChange(id, config, newTime, startOrEnd) {
    let newConfig = {}
    for(var k in config) newConfig[k] = config[k]
    newConfig.filterConf.timeRanges[id][startOrEnd] = newTime
    return newConfig
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

function generateTimePicker(isStart, updateConfig, id, config) {
    let changeFn = isStart ? updateConfig(handleStartChange) : updateConfig(handleEndChange)
    let value = isStart ? retrieveStartTime(id, config) : retrieveEndTime(id, config)
    return (<TimePicker
        onChange={changeFn}
        value={value}
        amPmAriaLabel="Select AM/PM"
        clearAriaLabel="Clear value"
        clockAriaLabel="Toggle clock"
        hourAriaLabel="Hour"
        maxDetail="second"
        minuteAriaLabel="Minute"
        nativeInputAriaLabel="Time"
    />)
}

// id corresponds to what id should be included in the data field for this component
export default function TimeRange(kwargs) {
    var [config, setConfig] = useContext(GraphContext)
    let id = kwargs.id
    function updateConfig(auxFn) {
        return function (newTime) {
            let newConfig = auxFn(id, config, newTime)
            setConfig(newConfig)
        }
    }
    let out = (
        <div className={"time-range-container"} time-range-id={id} key={`time-range-${id}`}>
            <div className={"time-range-start-container"} >
                {generateTimePicker(true, updateConfig, id, config)}
            </div>
            <div className={"time-range-end-container"} >
                {generateTimePicker(false, updateConfig, id, config)}
            </div>
        </div>
    )

    return out
}
