import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import * as d3 from 'd3';
import Graph from './Graph';
import SummaryStats from './SummaryStats';
import { GraphContext, defaults } from './GraphContext';

jest.mock('d3', () => ({ ...jest.requireActual('d3'), json: jest.fn() }));

global.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom does not implement SVG layout APIs used by Graph.js
window.SVGElement.prototype.getComputedTextLength = () => 10;
window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });

const rows = [
  { source: 'NFS', target: 1, label: 'NFS' },
  { source: 'NFS', target: 2, label: 'NFS' },
  { source: 'CFS', target: 2, label: 'CFS' },
].map((r, i) => ({
  ...r,
  time: `2019-08-1${i} 12:00:00`,
  content: `sentence ${r.target}`,
  user_quality_score: 0.5,
  value: 2,
}));

const populatedResponse = {
  data: rows,
  summary_stats: {
    edge_cnt: 3,
    unique_node_set_size: { LHS: 2, RHS: 2 },
    unique_node_cnts: {
      LHS: [{ label: 'NFS', cnt: 2 }, { label: 'CFS', cnt: 1 }],
      RHS: [{ label: 1, cnt: 1 }, { label: 2, cnt: 2 }],
    },
    min_date: '2019-08-09T00:00:00.000000Z',
    max_date: '2019-08-13T00:00:00.000000Z',
  },
};

// What the backend returns for the default filters (Omit Skips on, thresholds 10)
const emptyResponse = {
  data: [],
  summary_stats: {
    edge_cnt: 0,
    unique_node_set_size: { LHS: 0, RHS: 0 },
    unique_node_cnts: { LHS: [], RHS: [] },
    min_date: '2019-08-09T00:00:00.000000Z',
    max_date: '2019-08-09T00:00:00.000000Z',
  },
};

let latestConfig;
let setLatestConfig;
function Provider({ initial, children }) {
  const state = useState(initial);
  [latestConfig, setLatestConfig] = state;
  return <GraphContext.Provider value={state}>{children}</GraphContext.Provider>;
}

let container;
let root;
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

test('response fetched by Graph is kept in config and rendered by SummaryStats', async () => {
  d3.json.mockResolvedValue(populatedResponse);
  const initial = {
    ...defaults,
    isLoaded: true,
    response: emptyResponse,
    data: { ...defaults.data, noDataModal: true, noDataModalTable: true, noDataModalSummary: true },
  };

  await act(async () => {
    root.render(<Provider initial={initial}><Graph /></Provider>);
  });

  expect(d3.json).toHaveBeenCalled();
  expect(latestConfig.response).toBe(populatedResponse);
  expect(latestConfig.data.noDataModalSummary).toBe(false);

  await act(async () => {
    root.render(<Provider initial={latestConfig}><SummaryStats /></Provider>);
  });

  expect(container.querySelector('.edge-cnt').textContent).toBe('Total Edges: 3');
  expect(container.querySelector('.lhs-node-set-cnt').textContent).toBe('Total originating nodes (LHS): 2');
  expect(container.querySelector('.rhs-node-set-cnt').textContent).toBe('Total terminal nodes (RHS): 2');
  expect(container.textContent).not.toContain('No data to display.');
});

test('SummaryStats shows a message instead of crashing on an empty response', async () => {
  const initial = { ...defaults, isLoaded: true, response: emptyResponse };

  await act(async () => {
    root.render(<Provider initial={initial}><SummaryStats /></Provider>);
  });

  expect(container.querySelector('.lhs-node-unique-cnts').textContent).toBe('No data to display.');
  expect(container.querySelector('.edge-cnt').textContent.trim()).toBe('');
});

test('Graph refetches on filter changes but not on zoom or its own response update', async () => {
  d3.json.mockResolvedValue(populatedResponse);
  const initial = { ...defaults, isLoaded: true, response: emptyResponse };

  await act(async () => {
    root.render(<Provider initial={initial}><Graph /></Provider>);
  });
  expect(d3.json).toHaveBeenCalledTimes(1);

  await act(async () => {
    setLatestConfig(prev => ({ ...prev, zoomLevel: 2 }));
  });
  expect(d3.json).toHaveBeenCalledTimes(1);
  expect(latestConfig.response).toBe(populatedResponse);

  await act(async () => {
    setLatestConfig(prev => ({ ...prev, filterConf: { ...prev.filterConf, leftRenderThreshold: 0 } }));
  });
  expect(d3.json).toHaveBeenCalledTimes(2);
});
