import {createContext, useState} from 'react';
import './App.css';
import Graph from './Graph';
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
      <GraphConfig/>
    </GraphContext.Provider>
  );
}

export default App;
