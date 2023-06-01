import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

class GraphConfig extends Component {

  constructor(props){
    super(props);
    this.state = {};
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateForm = this.updateForm.bind(this)
    this.updateDb = this.updateDb.bind(this)
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

  updateForm(event, k) {
    console.log(event)
    var obj = {
      [`${k}`]: event.target.value
    }
    this.setState(
      Object.assign(
        {},
        this.state,
        obj
      )
    )
  }

  handleSubmit(event) {
    event.preventDefault()
    console.log(this.state)
  }

  componentDidMount() {
  }

  updateApiProtocol(event) {
    this.updateForm(event, "apiProtocol")
  }
  updateApiHost(event) {
    this.updateForm(event, "apiHost")
  }
  updateApiPort(event) {
    this.updateForm(event, "apiPort")
  }
  updateApiEndpoint(event) {
    this.updateForm(event, "apiEndpoint")
  }
  updateApiGetOrPost(event) {
    this.updateForm(
      {
        target: {
          value: !event.target.checked ? "GET" : "POST"
        }
      },
      "apiGetOrPost"
    )
  }
  updateDb(event) {
    this.updateForm(event, "db")
  }
  updateLabelCol(event) {
    this.updateForm(event, "labelCol")
  }
  updateLabelerCol(event) {
    this.updateForm(event, "labelerCol")
  }
  updateLabeleeIdCol(event) {
    this.updateForm(event, "labeleeIdCol")
  }
  updateLabeleeContentCol(event) {
    this.updateForm(event, "labeleeContentCol")
  }
  updateJoinQuery(event) {
    this.updateForm(event, "joinQuery")
  }
  updateTimeCol(event) {
    this.updateForm(event, "timeCol")
  }
  updateTimeOut(event) {
    this.updateForm(event, "timeOut")
  }

  render() {
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
          value={this.state.hasOwnProperty("db") ? this.state.db : ""}
          onChange={this.updateDb}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelCol">
        <Form.Label>Label Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABEL COLUMN HERE"
          value={this.state.hasOwnProperty("labelCol") ? this.state.labelCol : ""}
          onChange={this.updateLabelCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelerCol">
        <Form.Label>Labeler Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELER COLUMN HERE"
          value={this.state.hasOwnProperty("labelerCol") ? this.state.labelerCol : ""}
          onChange={this.updateLabelerCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeIdCol">
        <Form.Label>Labelee ID Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELEE ID COLUMN HERE"
          value={this.state.hasOwnProperty("labeleeIdCol") ? this.state.labeleeIdCol : ""}
          onChange={this.updateLabeleeIdCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeContentCol">
        <Form.Label>Labelee Content Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="LABELEE CONTENT COLUMN HERE"
          value={this.state.hasOwnProperty("labeleeContentCol") ? this.state.labeleeContentCol : ""}
          onChange={this.updateLabeleeContentCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-12 mb-3" controlId="formJoinQuery">
        <Form.Label>Join Query</Form.Label>
        <Form.Control
          type="text"
          placeholder="JOIN QUERY HERE"
          value={this.state.hasOwnProperty("joinQuery") ? this.state.joinQuery : ""}
          onChange={this.updateJoinQuery}
        />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeCol">
        <Form.Label>Time Column</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME COLUMN HERE"
          value={this.state.hasOwnProperty("timeCol") ? this.state.timeCol : ""}
          onChange={this.updateTimeCol}
        />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeOutCol">
        <Form.Label>Time Output Format</Form.Label>
        <Form.Control
          type="text"
          placeholder="TIME OUTPUT FORMAT HERE"
          value={this.state.hasOwnProperty("timeOut") ? this.state.timeOut : ""}
          onChange={this.updateTimeOut}
        />
      </Form.Group>
      <Form.Group className="col-sm-1" controlId="formApiGetOrPost">
        <Form.Label>API {this.state.hasOwnProperty("apiGetOrPost") ? this.state.apiGetOrPost: "GET"} Request</Form.Label>
        <Form.Check
          type="switch"
          value={this.state.hasOwnProperty("apiGetOrPost") ? this.state.apiGetOrPost : ""}
          onChange={this.updateApiGetOrPost}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formApiProtocol">
        <Form.Label>API Protocol</Form.Label>
        <Form.Control
          type="text"
          placeholder="API protocol HERE"
          value={this.state.hasOwnProperty("apiProtocol") ? this.state.apiProtocol : ""}
          onChange={this.updateApiProtocol}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiProtocol">
        <Form.Label>API Host</Form.Label>
        <Form.Control
          type="text"
          placeholder="API host HERE"
          value={this.state.hasOwnProperty("apiHost") ? this.state.apiHost : ""}
          onChange={this.updateApiHost}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiPort">
        <Form.Label>API Port</Form.Label>
        <Form.Control
          type="text"
          placeholder="API port HERE"
          value={this.state.hasOwnProperty("apiPort") ? this.state.apiPort : ""}
          onChange={this.updateApiPort}
        />
      </Form.Group>
      <Form.Group className="col-sm-3" controlId="formApiEndpoint">
        <Form.Label>API Endpoint</Form.Label>
        <Form.Control
          type="text"
          placeholder="API endpoint HERE"
          value={this.state.hasOwnProperty("apiEndpoint") ? this.state.apiEndpoint : ""}
          onChange={this.updateApiEndpoint}
        />
      </Form.Group>
    </Form>
    )
  }
}

export default GraphConfig;
