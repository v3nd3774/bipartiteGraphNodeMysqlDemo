import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { GraphContext } from './GraphContext';

class ViewboxControls extends Component {

  static contextType = GraphContext

  constructor(props){
    super(props);
    this.state = null
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateCanvasForm = this.updateCanvasForm.bind(this)
    this.updateHeight = this.updateHeight.bind(this)
    this.updateWidth = this.updateWidth.bind(this)
    this.updateViewboxOne = this.updateViewboxOne.bind(this)
    this.updateViewboxTwo = this.updateViewboxTwo.bind(this)
    this.updateViewboxThree = this.updateViewboxThree.bind(this)
    this.updateViewboxFour = this.updateViewboxFour.bind(this)
  }

  handleSubmit(event) {
    const [_, setConfig] = this.context
    event.preventDefault()
    console.log(this.state)
    setConfig(this.state)
    console.log(this.props)
  }

  updateCanvasForm(event, k, parent) {
    var obj = {
      [`${k}`]: parseFloat(event.target.value)
    }
    return Object.assign(
      {},
      parent,
      obj
    )
  }

  updateHeight(event) {
    const [config, _] = this.context
    var newCanvas = this.updateCanvasForm(event, "height", config.canvas)
    config.canvas = newCanvas
    this.setState(config)
  }
  updateWidth(event) {
    const [config, _] = this.context
    var newCanvas = this.updateCanvasForm(event, "width", config.canvas)
    config.canvas = newCanvas
    this.setState(config)
  }
  updateViewboxOne(event) {
    const [config, _] = this.context
    var newViewBox = this.updateCanvasForm(event, "o", config.canvas.viewBox)
    config.canvas.viewBox = newViewBox
    this.setState(config)
  }
  updateViewboxTwo(event) {
    const [config, _] = this.context
    var newViewBox = this.updateCanvasForm(event, "tw", config.canvas.viewBox)
    config.canvas.viewBox = newViewBox
    this.setState(config)
  }
  updateViewboxThree(event) {
    const [config, _] = this.context
    var newViewBox = this.updateCanvasForm(event, "th", config.canvas.viewBox)
    config.canvas.viewBox = newViewBox
    this.setState(config)
  }
  updateViewboxFour(event) {
    const [config, _] = this.context
    var newViewBox = this.updateCanvasForm(event, "f", config.canvas.viewBox)
    config.canvas.viewBox = newViewBox
    this.setState(config)
  }

  componentDidMount() {
    const [config, _] = this.context
    this.setState(config)
  }

  render() {
    return (
    <Form className="form-horizontal row" onSubmit={this.handleSubmit}>

      <Form.Group className="col-sm-2" controlId="formHeight">
        <Form.Label>Height</Form.Label>
        <Form.Control
          type="text"
          placeholder="HEIGHT HERE"
          value={this.state ? this.state.canvas.height : ""}
          onChange={this.updateHeight}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formWidth">
        <Form.Label>Width</Form.Label>
        <Form.Control
          type="text"
          placeholder="WIDTH HERE"
          value={this.state ? this.state.canvas.width : ""}
          onChange={this.updateWidth}
        />
      </Form.Group>

      <Form.Group className="col-sm-2" controlId="formViewboxOne">
        <Form.Label>SVG Viewbox 1</Form.Label>
        <Form.Control
          type="text"
          value={this.state ? this.state.canvas.viewBox.o : ""}
          onChange={this.updateViewboxOne}
          placeholder="VB1 HERE"
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxTwo">
        <Form.Label>SVG Viewbox 2</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB2 HERE"
          value={this.state ? this.state.canvas.viewBox.tw : ""}
          onChange={this.updateViewboxTwo}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxThree">
        <Form.Label>SVG Viewbox 3</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB3 HERE"
          value={this.state ? this.state.canvas.viewBox.th : ""}
          onChange={this.updateViewboxThree}
        />
      </Form.Group>
      <Form.Group className="col-sm-2" controlId="formViewboxFour">
        <Form.Label>SVG Viewbox 4</Form.Label>
        <Form.Control
          type="text"
          placeholder="VB4 HERE"
          value={this.state ? this.state.canvas.viewBox.f : ""}
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
