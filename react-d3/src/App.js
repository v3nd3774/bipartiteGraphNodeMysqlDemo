import {useState} from 'react';
import './App.css';
import Graph from './Graph';
import DataTable from './DataTable';
import GraphConfig from './GraphConfig';
import ViewboxControls from './ViewboxControls';
import { defaults, GraphContext } from './GraphContext';

function App() {
  const [config, setConfig] = useState(defaults)
  return (
    // Fragment to return graph and graph configuration DOM elements
    // https://react.dev/reference/react/Fragment#fragment
    <GraphContext.Provider value={[config, setConfig]}>
      <ViewboxControls/>
      <Graph/>
      <p>
        With default settings,
        <span style={{'background-color': "red", color: 'white'}}> red </span> is NFS;
        <span style={{'background-color': "purple", color: 'white'}}>purple</span> is UFS,
        <span style={{'background-color': "green", color: 'white'}}>green</span> is CFS and
        <span style={{'background-color': "yellow", color: 'white'}}>yellow</span> is skip
      </p>
      <DataTable/>
      <GraphConfig/>

    </GraphContext.Provider>
  );
}

export default App;
