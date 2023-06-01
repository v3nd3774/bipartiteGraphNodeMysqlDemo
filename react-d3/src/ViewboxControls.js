import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

class ViewboxControls extends Component {

  constructor(props){
    super(props);
    this.state = {};
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateForm = this.updateForm.bind(this)
    this.updateHeight = this.updateHeight.bind(this)
    this.updateWidth = this.updateWidth.bind(this)
    this.updateViewboxOne = this.updateViewboxOne.bind(this)
    this.updateViewboxTwo = this.updateViewboxTwo.bind(this)
    this.updateViewboxThree = this.updateViewboxThree.bind(this)
    this.updateViewboxFour = this.updateViewboxFour.bind(this)
  }

  handleSubmit(event) {
    event.preventDefault()
    console.log(this.state)
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

  updateHeight(event) {
    this.updateForm(event, "height")
  }
  updateWidth(event) {
    this.updateForm(event, "width")
  }
  updateViewboxOne(event) {
    this.updateForm(event, "viewboxOne")
  }
  updateViewboxTwo(event) {
    this.updateForm(event, "viewboxTwo")
  }
  updateViewboxThree(event) {
    this.updateForm(event, "viewboxThree")
  }
  updateViewboxFour(event) {
    this.updateForm(event, "viewboxFour")
  }

  componentDidMount() {

  }

  render() {
    return (
    <Form className="form-horizontal row" onSubmit={this.handleSubmit}>

      <Form.Group className="col-sm-2" controlId="formHeight">
        <Form.Label>Height</Form.Label>
        <Form.Control
          type="text"
          placeholder="HEIGHT HERE"
          value={this.state.hasOwnProperty("height") ? this.state.height : ""}
          onChange={this.updateHeight}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formWidth">
        <Form.Label>Width</Form.Label>
        <Form.Control
          type="text"
          placeholder="WIDTH HERE"
          value={this.state.hasOwnProperty("width") ? this.state.width : ""}
          onChange={this.updateWidth}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formViewboxOne">
        <Form.Label>SVG Viewbox 1</Form.Label>
        <Form.Control
          type="text"
          value={this.state.hasOwnProperty("viewboxOne") ? this.state.viewboxOne : ""}
          onChange={this.updateViewboxOne}
          placeholder="VB1 HERE"
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxTwo">
        <Form.Label>SVG Viewbox 2</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB2 HERE"
          value={this.state.hasOwnProperty("viewboxTwo") ? this.state.viewboxTwo : ""}
          onChange={this.updateViewboxTwo}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxThree">
        <Form.Label>SVG Viewbox 3</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB3 HERE"
          value={this.state.hasOwnProperty("viewboxThree") ? this.state.viewboxThree : ""}
          onChange={this.updateViewboxThree}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxFour">
        <Form.Label>SVG Viewbox 4</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB4 HERE"
          value={this.state.hasOwnProperty("viewboxFour") ? this.state.viewboxFour : ""}
          onChange={this.updateViewboxFour}
        />
      </Form.Group>

      <Button variant="primary mt-2 mb-2" type="submit">
        Submit SVG Canvas Details
      </Button>
    </Form>
    )
  }
}

export default ViewboxControls;
