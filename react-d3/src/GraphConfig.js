import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ShowModal from './ShowModal';
import { GraphContext } from './GraphContext';
import { updateConfig } from './Utility.js';
import { lhsAvailibleSorting, rhsAvailibleSorting } from './Sorting.js';

class GraphConfig extends Component {
  static contextType = GraphContext;

  constructor(props) {
    super(props);
    this.state = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateLhs = this.updateLhs.bind(this);
    this.updateRhs = this.updateRhs.bind(this);
    this.updateLHSThreshold = this.updateLHSThreshold.bind(this);
    this.updateRHSThreshold = this.updateRHSThreshold.bind(this);
    this.updateOmitSkip = this.updateOmitSkip.bind(this);
    this.updateDbName = this.updateDbName.bind(this);
    this.updateLabelCol = this.updateLabelCol.bind(this);
    this.updateLabelerCol = this.updateLabelerCol.bind(this);
    this.updateLabeleeIdCol = this.updateLabeleeIdCol.bind(this);
    this.updateLabeleeContentCol = this.updateLabeleeContentCol.bind(this);
    this.updateJoinQuery = this.updateJoinQuery.bind(this);
    this.updateTimeCol = this.updateTimeCol.bind(this);
    this.updateTimeOut = this.updateTimeOut.bind(this);
    this.updateApiProtocol = this.updateApiProtocol.bind(this);
    this.updateApiHost = this.updateApiHost.bind(this);
    this.updateApiPort = this.updateApiPort.bind(this);
    this.updateApiEndpoint = this.updateApiEndpoint.bind(this);
    this.updateApiGetOrPost = this.updateApiGetOrPost.bind(this);
    this.updateTargetSampleDataset = this.updateTargetSampleDataset.bind(this);
  }

  componentDidMount() {
    const [config] = this.context;
    this.setState({ ...config });
  }

  handleSubmit(event) {
    event.preventDefault();
    const [, setConfig] = this.context;
    setConfig(this.state);

    this.setState(prevState => ({
      ...prevState,
      data: { ...prevState.data, submitSuccessModal: true }
    }));
  }

  // --- Helpers ---
  updateThreshold(event, keyString) {
    const val = parseInt(event.target.value) || 0;
    this.setState(prevState => ({
      ...prevState,
      filterConf: { ...prevState.filterConf, [keyString]: val }
    }));
  }

  updateDb(event, keyString) {
    const val = event.target.value;
    this.setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        db: { ...prevState.data.db, [keyString]: val }
      }
    }));
  }

  updateApi(event, keyString) {
    const val = event.target.value;
    this.setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        api: { ...prevState.data.api, [keyString]: val }
      }
    }));
  }

  // --- Specialized Restored Methods ---
  updateLHSThreshold(e) { this.updateThreshold(e, "leftRenderThreshold"); }
  updateRHSThreshold(e) { this.updateThreshold(e, "rightRenderThreshold"); }
  updateDbName(e) { this.updateDb(e, "name"); }
  updateLabelCol(e) { this.updateDb(e, "labelCol"); }
  updateLabelerCol(e) { this.updateDb(e, "labelerCol"); }
  updateLabeleeIdCol(e) { this.updateDb(e, "labeleeIdCol"); }
  updateLabeleeContentCol(e) { this.updateDb(e, "labeleeContentCol"); }
  updateJoinQuery(e) { this.updateDb(e, "joinQuery"); }
  updateTimeCol(e) { this.updateDb(e, "timeCol"); }
  updateTimeOut(e) { this.updateDb(e, "timeOutFormat"); }
  updateApiProtocol(e) { this.updateApi(e, "protocol"); }
  updateApiHost(e) { this.updateApi(e, "host"); }
  updateApiPort(e) { this.updateApi(e, "port"); }

  updateLhs(e) { this.setState({ sortingConf: { ...this.state.sortingConf, lhs: e.target.value } }); }
  updateRhs(e) { this.setState({ sortingConf: { ...this.state.sortingConf, rhs: e.target.value } }); }

  updateOmitSkip(e) {
    this.setState({ filterConf: { ...this.state.filterConf, omitSkip: e.target.checked } });
  }

  updateApiEndpoint(e) {
    this.setState({ data: { ...this.state.data, api: { ...this.state.data.api, endpoint: e.target.checked } } });
  }

  updateApiGetOrPost(e) {
    this.setState({ data: { ...this.state.data, api: { ...this.state.data.api, request: e.target.checked ? "GET" : "POST" } } });
  }

  updateTargetSampleDataset(e) {
    this.setState({ targetsampledataset: e.target.value });
  }

  render() {
    if (!this.state) return null;

    return (
      <>
        <ShowModal
          title={"Submitted Configuration!"}
          body={"Settings saved. Re-visit the Graph tab to see the changes."}
          setShow={((cfg, sConf, show) => {
            const [globalCfg, setGlobalCfg] = this.context;
            const newData = { ...globalCfg.data, submitSuccessModal: show };
            setGlobalCfg({ ...globalCfg, data: newData });
            this.setState({ data: newData });
          })}
          configPath={['data', 'submitSuccessModal']}
        />

        <Form className="form-horizontal row justify-content-center p-3" onSubmit={this.handleSubmit}>
          {/* Row 1: Sorting & Thresholds */}
          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>LHS Sorting</Form.Label>
            <Form.Select value={this.state.sortingConf.lhs} onChange={this.updateLhs}>
              {Object.keys(lhsAvailibleSorting).map(k => <option key={k} value={k}>{k}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>RHS Sorting</Form.Label>
            <Form.Select value={this.state.sortingConf.rhs} onChange={this.updateRhs}>
              {Object.keys(rhsAvailibleSorting).map(k => <option key={k} value={k}>{k}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>LHS Threshold</Form.Label>
            <Form.Control type="number" value={this.state.filterConf.leftRenderThreshold} onChange={this.updateLHSThreshold} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>RHS Threshold</Form.Label>
            <Form.Control type="number" value={this.state.filterConf.rightRenderThreshold} onChange={this.updateRHSThreshold} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>{this.state.filterConf.omitSkip ? "Omit Skips" : "Show All"}</Form.Label>
            <Form.Check type="switch" checked={this.state.filterConf.omitSkip} onChange={this.updateOmitSkip} />
          </Form.Group>

          <div className="w-100"></div>

          {/* Row 2: Database Identification */}
          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Database</Form.Label>
            <Form.Control type="text" value={this.state.data.db.name} onChange={this.updateDbName} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Label Column</Form.Label>
            <Form.Control type="text" value={this.state.data.db.labelCol} onChange={this.updateLabelCol} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Labeler Column</Form.Label>
            <Form.Control type="text" value={this.state.data.db.labelerCol} onChange={this.updateLabelerCol} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Labelee ID Column</Form.Label>
            <Form.Control type="text" value={this.state.data.db.labeleeIdCol} onChange={this.updateLabeleeIdCol} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Labelee Content</Form.Label>
            <Form.Control type="text" value={this.state.data.db.labeleeContentCol} onChange={this.updateLabeleeContentCol} />
          </Form.Group>

          <div className="w-100"></div>

          {/* Row 3: Queries & Time */}
          <Form.Group className="col-sm-6 mb-3">
            <Form.Label>Join Query</Form.Label>
            <Form.Control type="text" value={this.state.data.db.joinQuery} onChange={this.updateJoinQuery} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Time Column</Form.Label>
            <Form.Control type="text" value={this.state.data.db.timeCol} onChange={this.updateTimeCol} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Time Format</Form.Label>
            <Form.Control type="text" value={this.state.data.db.timeOutFormat} onChange={this.updateTimeOut} />
          </Form.Group>

          <div className="w-100"></div>

          {/* Row 4: API Connection */}
          <Form.Group className="col-sm-1 mb-3">
            <Form.Label>API {this.state.data.api.request}</Form.Label>
            <Form.Check type="switch" checked={this.state.data.api.request === "GET"} onChange={this.updateApiGetOrPost} />
          </Form.Group>

          <Form.Group className="col-sm-1 mb-3">
            <Form.Label>Protocol</Form.Label>
            <Form.Control value={this.state.data.api.protocol} onChange={this.updateApiProtocol} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Host</Form.Label>
            <Form.Control value={this.state.data.api.host} onChange={this.updateApiHost} />
          </Form.Group>

          <Form.Group className="col-sm-1 mb-3">
            <Form.Label>Port</Form.Label>
            <Form.Control value={this.state.data.api.port} onChange={this.updateApiPort} />
          </Form.Group>

          <Form.Group className="col-sm-2 mb-3">
            <Form.Label>Endpoint: {this.state.data.api.endpoint ? "environ" : "testingsample"}</Form.Label>
            <Form.Check type="switch" checked={this.state.data.api.endpoint} onChange={this.updateApiEndpoint} />
          </Form.Group>

          <Form.Group className="col-sm-3 mb-3">
            <Form.Label>Target Sample Dataset</Form.Label>
            <Form.Select value={this.state.targetsampledataset} onChange={this.updateTargetSampleDataset}>
              {this.state.sampledatasetnames.map(name => <option key={name} value={name}>{name}</option>)}
            </Form.Select>
          </Form.Group>

          <div className="w-100"></div>
          <Button variant="primary" type="submit" className="col-sm-3 mt-3 mb-5">
            Submit Configuration
          </Button>
        </Form>
      </>
    );
  }
}

export default GraphConfig;
