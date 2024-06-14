export default function Legend () {
    return (
          <p>
            Drag the graph to orient the right hand side labels to be more readable.
            Zooming with the mouse wheel will zoom the y axis and move the right hand side labels. <br/>
            With default settings,&nbsp;
            <span className={"NFS"}> red </span> is NFS;&nbsp;
            <span className={"UFS"}>purple</span> is UFS,&nbsp;
            <span className={"CFS"}>green</span> is CFS and &nbsp;
            <span className={"SKIP"}>yellow</span> is skip
          </p>)
}
