import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

import TimePicker from 'react-time-picker'
import './TimePicker.css';

// id corresponds to what id should be included in the data field for this component
export default function TimeRange(id) {
    let out = (
        <div className={"time-range-container"} time-range-id={id}>
            <div className={"time-range-start-container"} >
                <TimePicker />
            </div>
            <div className={"time-range-end-container"} >
                <TimePicker />
            </div>
        </div>
    )
    return out
}
