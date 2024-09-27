
import React, { useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import { defaults, GraphContext } from './GraphContext';
function ShowModal() {
    const contextType = GraphContext
    const context = useContext(contextType)
    const [config, setConfig] = context

    const setShow = (show) => {
        var newData = Object.assign({}, config.data, { submitSuccessModal: show })
        var newConfig = Object.assign({}, config, {data: newData})
        setConfig(newConfig)
    }

    const handleClose = () => setShow(false);

    return (
        <Modal show={config.data.submitSuccessModal} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Submitted Configuration!</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>Please re-visit the tabs of interest to view with the new configuration.</p>
            </Modal.Body>
        </Modal>
    );
}
export default ShowModal
