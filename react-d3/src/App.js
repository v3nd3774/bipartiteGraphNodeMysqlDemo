import {useState} from 'react';
import './App.css';
import Graph from './Graph';
import DataTable from './DataTable';
import SummaryStats from './SummaryStats';
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
        <span style={{backgroundColor: "red", color: 'white'}}> red </span> is NFS;
        <span style={{backgroundColor: "purple", color: 'white'}}>purple</span> is UFS,
        <span style={{backgroundColor: "green", color: 'white'}}>green</span> is CFS and
        <span style={{backgroundColor: "yellow", color: 'white'}}>yellow</span> is skip
      </p>
      <SummaryStats/>
      <DataTable/>
      <GraphConfig/>

    </GraphContext.Provider>
  );
}

export default App;
