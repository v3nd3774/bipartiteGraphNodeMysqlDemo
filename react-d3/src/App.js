import {useState} from 'react';
import './App.css';
import TimeRanges from './TimeRanges';
import DateTimeRanges from './DateTimeRanges';
import Graph from './Graph';
import DataTable from './DataTable';
import SummaryStats from './SummaryStats';
import GraphConfig from './GraphConfig';
import About from './About';
import { defaults, GraphContext } from './GraphContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Header from './Header'
import Legend from './Legend'

function App() {
  const [config, setConfig] = useState(defaults)

  const header = (<Header/>);
  return (
    // Fragment to return graph and graph configuration DOM elements
    // https://react.dev/reference/react/Fragment#fragment
    <GraphContext.Provider value={[config, setConfig]}>
      {header}
      <Tabs component={header}>
        <TabList>
          <Tab>Graph</Tab>
          <Tab>Summary Statistics</Tab>
          <Tab>Table</Tab>
          <Tab>Configuration</Tab>
          <Tab>About</Tab>
        </TabList>
        <TabPanel>
          <Legend/>
          <Graph/>
        </TabPanel>
        <TabPanel>
          <SummaryStats/>
        </TabPanel>
        <TabPanel>
          <Legend/>
          <DataTable/>
        </TabPanel>
        <TabPanel>
          <GraphConfig/>
          <TimeRanges/>
          <DateTimeRanges/>
        </TabPanel>
        <TabPanel>
          <About/>
        </TabPanel>
      </Tabs>
    </GraphContext.Provider>
  );
}

export default App;
