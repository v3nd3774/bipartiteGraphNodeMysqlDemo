import React, {useContext, useState, useEffect, useMemo} from 'react';
import { GraphContext } from './GraphContext';

export default function Legend () {
    var [config, _] = useContext(GraphContext)

    return (
          <p>
            Drag the graph to orient the right hand side labels to be more readable.
            Zooming with the mouse wheel will zoom the y axis and move the right hand side labels. <br/>
            With default settings,&nbsp;
            {config.uniqueLabels.map((item, _) => {
                var itemStyle = {
                    backgroundColor: config['colorScale'](item)
                }
                return (<span className="item-span">
                  {item} as <span style={itemStyle}>____</span>&nbsp;
                </span>)
                })}
          </p>)
}
