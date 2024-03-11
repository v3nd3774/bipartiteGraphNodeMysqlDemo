import React, {useContext} from 'react';
import { GraphContext } from './GraphContext';

const downloadFile = ({ data, fileName, fileType }) => {
  // Create a blob with the data we want to download as a file
  const blob = new Blob([data], { type: fileType })
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const a = document.createElement('a')
  a.download = fileName
  a.href = window.URL.createObjectURL(blob)
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  a.dispatchEvent(clickEvt)
  a.remove()
}

const exportToJson = function (config) {
    return (e) => {
        e.preventDefault()
        downloadFile({
          data: JSON.stringify(config),
          fileName: 'my-config.json',
          fileType: 'text/json',
        })
    }
}

export default function Download() {
  var [config, setConfig] = useContext(GraphContext)
  return (
    <div className='App'>
      <h5>Download Config in JSON format</h5>
      <div className='actionBtns'>
        <button type='button' onClick={exportToJson(config)}>
          Export to JSON
        </button>
      </div>
    </div>
  )
}
