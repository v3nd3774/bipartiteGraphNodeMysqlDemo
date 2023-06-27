import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { GraphContext } from './GraphContext';

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
  }

  updateForm(event, k, parent) {
    var obj = {
      [`${k}`]: event.target.value
    }
    return Object.assign(
      {},
      parent,
      obj
    )
  }

  handleSubmit(event) {
    const [_, setConfig] = this.context
    event.preventDefault()
    console.log(this.state)
    setConfig(this.state)
    console.log(this.props)
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

  render() {
    console.log("IN GRAPHCONF RENDER")
    console.log(this.state)
    return (
    <Form className="form-horizontal row" onSubmit={this.handleSubmit}>
      <Button variant="primary col-sm-12 mb-3" type="submit">
        Submit
      </Button>

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

      <Form.Group className="col-sm-12 mb-3" controlId="formJoinQuery">
        <Form.Label>Join Query</Form.Label>
        <Form.Control
          type="text"
          placeholder="JOIN QUERY HERE"
          value={this.state ? this.state.data.db.joinQuery : ""}
          onChange={this.updateJoinQuery}
        />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeCol">
        <Form.Label>Time Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME COLUMN HERE"
          value={this.state ? this.state.data.db.timeCol : ""}
          onChange={this.updateTimeCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeOutCol">
        <Form.Label>Time Output Format</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME OUTPUT FORMAT HERE"
          value={this.state ? this.state.data.db.timeOutFormat : ""}
          onChange={this.updateTimeOut}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiGetOrPost">
        <Form.Label>API {this.state ? (this.state.data.api.request ? "GET" : "POST") : "GET"} Request</Form.Label>
        <Form.Check
          type="switch"
          value={this.state ? (this.state.data.api.request ? "GET" : "POST") : ""}
          onChange={this.updateApiGetOrPost}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formApiProtocol">
        <Form.Label>API Protocol</Form.Label>
        <Form.Control
          type="text"
          placeholder="API protocol HERE"
          value={this.state ? this.state.data.api.protocol : ""}
          onChange={this.updateApiProtocol}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiProtocol">
        <Form.Label>API Host</Form.Label>
        <Form.Control
          type="text"
          placeholder="API host HERE"
          value={this.state ? this.state.data.api.host : ""}
          onChange={this.updateApiHost}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiPort">
        <Form.Label>API Port</Form.Label>
        <Form.Control
          type="text"
          placeholder="API port HERE"
          value={this.state ? this.state.data.api.port : ""}
          onChange={this.updateApiPort}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiEndpoint">
        <Form.Label>API Endpoint</Form.Label>
        <Form.Control
          type="text"
          placeholder="API endpoint HERE"
          value={this.state ? this.state.data.api.endpoint : ""}
          onChange={this.updateApiEndpoint}
        />
      </Form.Group>
    </Form>
    )
  }
}

export default GraphConfig;
