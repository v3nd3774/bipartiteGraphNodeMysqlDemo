import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import { GraphContext } from './GraphContext';
import { updateConfig } from './Utility.js';

class ViewboxControls extends Component {

  static contextType = GraphContext

  constructor(props){
    super(props);
    this.state = null
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateCanvas = this.updateCanvas.bind(this)
    this.updateCanvasForm = this.updateCanvasForm.bind(this)
    this.updateHeight = this.updateHeight.bind(this)
    this.updateWidth = this.updateWidth.bind(this)
    this.updatePadding = this.updatePadding.bind(this)
    this.updateViewbox = this.updateViewbox.bind(this)
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
      return updateConfig(k, parseFloat(event.target.value), parent);
  }

  updateCanvas(event, key) {
    const [config, _] = this.context
    var newCanvas = this.updateCanvasForm(event, key, config.canvas)
    config.canvas = newCanvas
    this.setState(config)
  }
  updateHeight(event) {
    this.updateCanvas(event, "height")
  }
  updatePadding(event) {
    this.updateCanvas(event, "padding")
  }
  updateWidth(event) {
    this.updateCanvas(event, "width")
  }
  updateViewbox(event, key) {
    const [config, _] = this.context
    var newViewBox = this.updateCanvasForm(event, key, config.canvas.viewBox)
    config.canvas.viewBox = newViewBox
    this.setState(config)
  }
  updateViewboxOne(event) {
    this.updateViewbox(event, "o")
  }
  updateViewboxTwo(event) {
    this.updateViewbox(event, "tw")
  }
  updateViewboxThree(event) {
    this.updateViewbox(event, "th")
  }
  updateViewboxFour(event) {
    this.updateViewbox(event, "f")
  }

  componentDidMount() {
    const [config, _] = this.context
    this.setState(config)
  }

  render() {
    return (
    <Dropdown>
      <Dropdown.Toggle>
      Configure SVG Viewbox
      </Dropdown.Toggle>

      <Dropdown.Menu>
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
         <Form.Group className="col-sm-2" controlId="formPadding">
           <Form.Label>Padding</Form.Label>
           <Form.Control
             type="text"
             placeholder="PADDING HERE"
             value={this.state ? this.state.canvas.padding : ""}
             onChange={this.updatePadding}
           />
         </Form.Group>

         <Button variant="primary mt-2 mb-2" type="submit">
           Submit SVG Canvas Details
         </Button>
       </Form>
      </Dropdown.Menu>
    </Dropdown>
    )
  }
}

export default ViewboxControls;
