import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

export default function Upload({ children }) {
  var [config, setConfig] = useContext(GraphContext)

  const handleChange = e => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      console.log("file read result:", e.target.result);
      let parsedConfig = JSON.parse(e.target.result)

      // Parse in the dates again as they are stored as strings:
      let newRanges = [];
      for(const [lhsIn, rhsIn] of parsedConfig.filterConf.datetimeRanges) {
        let lhs = new Date(lhsIn)
        let rhs = new Date(rhsIn)
        newRanges.push([lhs, rhs]);
      }
      parsedConfig.filterConf.datetimeRanges = newRanges;

      setConfig(parsedConfig);
    };
  };
  return (
    <div className='App'>
      <h5>Upload JSON config</h5>
      <input type="file" onChange={handleChange} />
    </div>
  );
}
