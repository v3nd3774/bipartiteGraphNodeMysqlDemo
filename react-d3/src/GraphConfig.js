import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ShowModal from './ShowModal'
import { defaults, GraphContext } from './GraphContext';
import { updateConfig } from './Utility.js';
import { lhsAvailibleSorting, rhsAvailibleSorting } from './Sorting.js';

class GraphConfig extends Component {

  static contextType = GraphContext

  constructor(props){
    super(props);
    this.state = null;
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateForm = this.updateForm.bind(this)
    this.updateApi = this.updateApi.bind(this)
    this.updateDb = this.updateDb.bind(this)
    this.updateDbName = this.updateDbName.bind(this)
    this.updateLabelCol = this.updateLabelCol.bind(this)
    this.updateLabelerCol = this.updateLabelerCol.bind(this)
    this.updateLabeleeIdCol = this.updateLabeleeIdCol.bind(this)
    this.updateLabeleeContentCol = this.updateLabeleeContentCol.bind(this)
    this.updateJoinQuery = this.updateJoinQuery.bind(this)
    this.updateTimeCol = this.updateTimeCol.bind(this)
    this.updateTimeOut = this.updateTimeOut.bind(this)
    this.updateApiProtocol = this.updateApiProtocol.bind(this)
    this.updateApiHost = this.updateApiHost.bind(this)
    this.updateApiPort = this.updateApiPort.bind(this)
    this.updateApiEndpoint = this.updateApiEndpoint.bind(this)
    this.updateApiGetOrPost = this.updateApiGetOrPost.bind(this)
    this.updateSort = this.updateSort.bind(this)
    this.updateRhs = this.updateRhs.bind(this)
    this.updateLhs = this.updateLhs.bind(this)
    this.updateOmitSkipAux = this.updateOmitSkipAux.bind(this)
    this.updateOmitSkip = this.updateOmitSkip.bind(this)
    this.updateSubmitSuccessModal = this.updateSubmitSuccessModal.bind(this)
    this.determineWhichCheckboxToUse = this.determineWhichCheckboxToUse.bind(this)
    this.updateRHSThreshold = this.updateRHSThreshold.bind(this)
    this.updateLHSThreshold = this.updateLHSThreshold.bind(this)
    this.updateThreshold = this.updateThreshold.bind(this)
    this.updateTargetSampleDataset = this.updateTargetSampleDataset.bind(this)
  }

  determineWhichCheckboxToUse() {
    const isStatePopulated = Boolean(this.state)
    var out = (
      <Form.Check
        type="switch"
        value={defaults.filterConf.omitSkip}
        onChange={this.updateOmitSkip}
        checked
      />
    )
    if (isStatePopulated) {
      const isSkipSwitchChecked = Boolean(this.state.filterConf.omitSkip)
      if (isSkipSwitchChecked) {
        out = (<Form.Check
          type="switch"
          value={this.state.filterConf.omitSkip}
          onChange={this.updateOmitSkip}
          checked
        />)
      } else {
        out = (<Form.Check
          type="switch"
          value={this.state.filterConf.omitSkip}
          onChange={this.updateOmitSkip}
        />)
      }
    }
    return out
  }

  updateForm(event, k, parent) {
      return updateConfig(k, event.target.value, parent);
  }

  handleSubmit(event) {
    const [config, setConfig] = this.context
    event.preventDefault()
    setConfig(this.state)
    this.updateSubmitSuccessModal()
    this.setState(config)
  }

  componentDidMount() {
    const [config, _] = this.context
    this.setState(config)
  }

  updateApi(event, keyString) {
    const [config, _] = this.context
    var newApi = this.updateForm(event, keyString, config.data.api)
    config.data.api = newApi
    this.setState(config)
  }

  updateThreshold(event, keyString) {
    const [config, _] = this.context
    var newEvent = null
    try {
      newEvent = Object.assign({}, event, {target: {value: parseInt(event.target.value)}})
    } catch (_) {
      console.log("Unable to parse as int the threshold value, check for validity...")
    }
    if (newEvent != null) {
      var newFilterConf = this.updateForm(newEvent, keyString, config.filterConf)
      config.filterConf = newFilterConf
      this.setState(config)
    }
  }

  updateRHSThreshold(event) {
    this.updateThreshold(event, "rightRenderThreshold")
  }

  updateLHSThreshold(event) {
    this.updateThreshold(event, "leftRenderThreshold")
  }

  updateTargetSampleDataset(event) {
    const [config, _] = this.context
    config.targetsampledataset = event.target.value
    this.setState(config)
  }

  updateSubmitSuccessModal() {
    const [config, _] = this.context
    var newData = Object.assign({}, config.data, {'submitSuccessModal': !config.data.submitSuccessModal})
    config.data = newData
    this.setState(config)
  }

  updateApiProtocol(event) {
    this.updateApi(event, "protocol")
  }
  updateApiHost(event) {
    this.updateApi(event, "host")
  }
  updateApiPort(event) {
    this.updateApi(event, "port")
  }
  updateApiEndpoint(event) {
    this.updateApi(event, "endpoint")
  }
  updateApiGetOrPost(event) {
    this.updateApi(
      {
        target: {
          value: !event.target.checked ? true : false
        }
      },
      "request"
    )
  }

  updateDb(event, keyString) {
    const [config, _] = this.context
    var newDb = this.updateForm(event, keyString, config.data.db)
    config.data.db = newDb
    this.setState(config)
  }

  updateDbName(event) {
    this.updateDb(event, "name")
  }
  updateLabelCol(event) {
    this.updateDb(event, "labelCol")
  }
  updateLabelerCol(event) {
    this.updateDb(event, "labelerCol")
  }
  updateLabeleeIdCol(event) {
    this.updateDb(event, "labeleeIdCol")
  }
  updateLabeleeContentCol(event) {
    this.updateDb(event, "labeleeContentCol")
  }
  updateJoinQuery(event) {
    this.updateDb(event, "joinQuery")
  }
  updateTimeCol(event) {
    this.updateDb(event, "timeCol")
  }
  updateTimeOut(event) {
    this.updateDb(event, "timeOut")
  }

  updateSort(event, keyString) {
    const [config, _] = this.context
    var newSortingConf = this.updateForm(event, keyString, config.sortingConf)
    config.sortingConf = newSortingConf
    this.setState(config)
  }
  updateLhs(event) {
    this.updateSort(event, "lhs")
  }
  updateRhs(event) {
    this.updateSort(event, "rhs")
  }
  updateOmitSkipAux(event) {
    const [config, _] = this.context
    var newFilterConf = this.updateForm(event, "omitSkip", config.filterConf)
    config.filterConf = newFilterConf
    this.setState(config)
  }
  updateOmitSkip(event) {
    this.updateOmitSkipAux(
      {
        target: {
          value: event.target.checked
        }
      }
    )
  }





  render() {
    return (
    <>
    <ShowModal
        title={"Submitted Configuration!"}
        body={"Please re-visit the tabs of interest to view with the new configuration."}
        setShow={
        ((cfg, sConf, show) => {
            var newData = Object.assign({}, cfg.data, { submitSuccessModal: show })
            var newConfig = Object.assign({}, cfg, {data: newData})
            sConf(newConfig)
        })}
        configPath={['data', 'submitSuccessModal']} />
    <Form className="form-horizontal row justify-content-center" onSubmit={this.handleSubmit}>
      <Form.Group className="col-sm-2" controlId="formLhsSort">
        <Form.Label>Sorting for left hand side</Form.Label>
        <Form.Select
          onChange={this.updateLhs}>
        {
          Object.keys(lhsAvailibleSorting)
           .map(key => <option value={key}>{key}</option>)
        }
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formRhsSort">
        <Form.Label>Sorting for right hand side</Form.Label>
        <Form.Select
          onChange={this.updateRhs}>
        {
          Object.keys(rhsAvailibleSorting)
           .map(key => <option value={key}>{key}</option>)
        }
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formThresholdLHS">
        <Form.Label>Threshold for LHS rendering</Form.Label>
        <Form.Control
          type="text"
          placeholder="Threshold value HERE"
          value={this.state ? this.state.filterConf.leftRenderThreshold : ""}
          onChange={this.updateLHSThreshold}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formThresholdRHS">
        <Form.Label>Threshold for RHS rendering</Form.Label>
        <Form.Control
          type="text"
          placeholder="Threshold value HERE"
          value={this.state ? this.state.filterConf.rightRenderThreshold : ""}
          onChange={this.updateRHSThreshold}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formOmitSkip">
        <Form.Label>
            {this.state ?
                (this.state.filterConf.omitSkip ?
                    "Omit \"skip\"s" :
                    "All data") :
                "Omit \"skip\"s"
            }
        </Form.Label>
        {this.determineWhichCheckboxToUse()}
      </Form.Group>

      <div class="w-100"></div>

      <Form.Group className="col-sm-2" controlId="formDb">
        <Form.Label>Database</Form.Label>
        <Form.Control
          type="text"
          placeholder="DATABASE NAME HERE"
          value={this.state ? this.state.data.db.name : ""}
          onChange={this.updateDbName}
        /> </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelCol">
        <Form.Label>Label Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABEL COLUMN HERE"
          value={this.state ? this.state.data.db.labelCol : ""}
          onChange={this.updateLabelCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelerCol">
        <Form.Label>Labeler Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELER COLUMN HERE"
          value={this.state ? this.state.data.db.labelerCol : ""}
          onChange={this.updateLabelerCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeIdCol">
        <Form.Label>Labelee ID Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELEE ID COLUMN HERE"
          value={this.state ? this.state.data.db.labeleeIdCol : ""}
          onChange={this.updateLabeleeIdCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeContentCol">
        <Form.Label>Labelee Content Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELEE CONTENT COLUMN HERE"
          value={this.state ? this.state.data.db.labeleeContentCol : ""}
          onChange={this.updateLabeleeContentCol}
        />
      </Form.Group>

      <div class="w-100"></div>
      <Form.Group className="col-sm-6 mb-6" controlId="formJoinQuery">
        <Form.Label>Join Query</Form.Label>
        <Form.Control
          type="text"
          placeholder="JOIN QUERY HERE"
          value={this.state ? this.state.data.db.joinQuery : ""}
          onChange={this.updateJoinQuery}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formTimeCol">
        <Form.Label>Time Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME COLUMN HERE"
          value={this.state ? this.state.data.db.timeCol : ""}
          onChange={this.updateTimeCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formTimeOutCol">
        <Form.Label>Time Output Format</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME OUTPUT FORMAT HERE"
          value={this.state ? this.state.data.db.timeOutFormat : ""}
          onChange={this.updateTimeOut}
        />
      </Form.Group>
      <div class="w-100"></div>
      <Form.Group className="col-sm-1" controlId="formApiGetOrPost">
        <Form.Label>API {this.state ? (this.state.data.api.request ? "GET" : "POST") : "GET"} Request</Form.Label>
        <Form.Check
          type="switch"
          value={this.state ? (this.state.data.api.request ? "GET" : "POST") : ""}
          onChange={this.updateApiGetOrPost}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiProtocol">
        <Form.Label>API Protocol</Form.Label>
        <Form.Control
          type="text"
          placeholder="API protocol HERE"
          value={this.state ? this.state.data.api.protocol : ""}
          onChange={this.updateApiProtocol}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiProtocol">
        <Form.Label>API Host</Form.Label>
        <Form.Control
          type="text"
          placeholder="API host HERE"
          value={this.state ? this.state.data.api.host : ""}
          onChange={this.updateApiHost}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiPort">
        <Form.Label>API Port</Form.Label>
        <Form.Control
          type="text"
          placeholder="API port HERE"
          value={this.state ? this.state.data.api.port : ""}
          onChange={this.updateApiPort}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiEndpoint">
        <Form.Label>API Endpoint</Form.Label>
        <Form.Control
          type="text"
          placeholder="API endpoint HERE"
          value={this.state ? this.state.data.api.endpoint : ""}
          onChange={this.updateApiEndpoint}
        />
      </Form.Group>

      <Form.Group className="col-sm-1" controlId="formTargetSampleDataset">
        <Form.Label>Target Sample Dataset (only used with /testingsample endpoint)</Form.Label>
        <Form.Select
          value={this.state ? this.state.targetsampledataset : ""}
          placeholder="Select Dataset to visualize"
          onChange={this.updateTargetSampleDataset}
        >
        {this.state ? this.state.sampledatasetnames.map(name =>
            <option key={name} value={name}>
                {name}
            </option>
        ) : "n/a"}
        </Form.Select>
      </Form.Group>

      <div class="w-100"></div>
      <Button variant="primary col-sm-3 mb-3" type="submit">
        Submit
      </Button>
    </Form>
    </>
    )
  }
}

export default GraphConfig;
