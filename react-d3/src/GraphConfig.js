import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

class GraphConfig extends Component {

  constructor(props){
    super(props);
    this.state = null;
    // determine if config is updated
    if (props.MYSQL_JOIN_QUERY) {
      console.log("LOGGING CONFIGURATION CONSTRUCTOR DETERMINED INTERACTIVE")
    }
  }

  componentDidMount() {
  }
  render() {
    return (
    <Form className="form-horizontal row">
      <Button variant="primary col-sm-12 mb-3" type="submit">
        Submit
      </Button>

      <Form.Group className="col-sm-2" controlId="formDb">
        <Form.Label>Database</Form.Label>
        <Form.Control type="text" placeholder="DATABASE NAME HERE" />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelCol">
        <Form.Label>Label Column</Form.Label>
        <Form.Control type="text" placeholder="LABEL COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelerCol">
        <Form.Label>Labeler Column</Form.Label>
        <Form.Control type="text" placeholder="LABELER COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeIdCol">
        <Form.Label>Labelee ID Column</Form.Label>
        <Form.Control type="text" placeholder="LABELEE ID COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabeleeContentCol">
        <Form.Label>Labelee Content Column</Form.Label>
        <Form.Control type="text" placeholder="LABELEE CONTENT COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formLabelerContentCol">
        <Form.Label>Labeler Content Column</Form.Label>
        <Form.Control type="text" placeholder="LABELER CONTENT COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-12 mb-3" controlId="formJoinQuery">
        <Form.Label>Join Query</Form.Label>
        <Form.Control type="text" placeholder="JOIN QUERY HERE" />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeCol">
        <Form.Label>Time Column</Form.Label>
        <Form.Control type="text" placeholder="TIME COLUMN HERE" />
      </Form.Group>

      <Form.Group className="col-sm-6" controlId="formTimeOutCol">
        <Form.Label>Time Output Format</Form.Label>
        <Form.Control type="text" placeholder="TIME OUTPUT FORMAT HERE" />
      </Form.Group>
    </Form>
    )
  }
}

export default GraphConfig;
