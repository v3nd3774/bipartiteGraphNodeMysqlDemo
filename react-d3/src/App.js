import './App.css';
import Graph from './Graph';
import GraphConfig from './GraphConfig';
import ViewboxControls from './ViewboxControls';

function App() {
  return (
    // Fragment to return graph and graph configuration DOM elements
    // https://react.dev/reference/react/Fragment#fragment
    <>
      <ViewboxControls />
      <Graph />
      <GraphConfig />
    </>
  );
}

export default App;
