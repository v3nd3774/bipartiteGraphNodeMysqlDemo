import {useState, useEffect} from 'react';
import * as d3 from "d3";
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
import Download from './Download'
import Upload from './Upload'

function App() {
  const [config, setConfig] = useState(defaults)

  const header = (<Header/>);


  useEffect(() => {
    // Fetch your initial config data here
    async function initialLoad() {
      // const data = await fetchConfigFromAPI();
        var datalsurl = `${config.data.api.protocol}://${config.data.api.host}:${config.data.api.port}/availabletestingdata`
        var datasetlsresp = await d3.json(datalsurl, function(error, data) {
            return data
        });
        var newConfig = Object.assign({}, config, {sampledatasetnames: datasetlsresp.available_datasets});
        var newestConfig = Object.assign({}, newConfig, {"isLoaded": true});
        setConfig(newestConfig)
    }
    initialLoad();
  }, []); // Run once on mount

  // Only render the tabs once the configuration is loaded
  if (!config.isLoaded) {
    return <div>Initializing Application Configuration...</div>;
  }

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
          <Download/>
          <Upload/>
        </TabPanel>
        <TabPanel>
          <About/>
        </TabPanel>
      </Tabs>
    </GraphContext.Provider>
  );
}

export default App;
