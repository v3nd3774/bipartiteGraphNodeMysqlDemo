
import React, { useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import { defaults, GraphContext } from './GraphContext';
function ShowModal({title, body, setShow, configPath}) {
    const contextType = GraphContext
    const context = useContext(contextType)
    const [config, setConfig] = context

    let show_modal_value = configPath.reduce((acc, val) => acc[val], config)

    const handleClose = () => setShow(config, setConfig, false);

    return (
        <Modal show={show_modal_value} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>{body}</p>
            </Modal.Body>
        </Modal>
    );
}
export default ShowModal
