import style from './style.css';
import { useState, useEffect } from 'preact/hooks';
import { v4 as uuidv4 } from 'uuid';
const Home = () => {
  const NodeHeight = 50;
  const NodeWidth = 200;
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  function getNewNode() {
    const heightOffset = 10;
    const maxHeight = nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.y));
    const maxId = nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.id));
    const nodeY = nodes.length === 0 ? 0 : maxHeight + NodeHeight + heightOffset;
    return {
      id: maxId + 1, x: 10, y: nodeY, lastX: 0, lastY: 0, text: `hello${maxId + 1}`,
      mousedown: false, connectionX: 0, connectionY: 0, lastConnectionX: 0, lastConnectionY: 0,
      connectionDragging: false,
      // TODO: get rid of type here
      connectors: {
        input: [{ index: 0, id: uuidv4(), type: 'input', connectionDragging: false, highlight: false }, { index: 1, id: uuidv4(), type: 'input', connectionDragging: false, highlight: false }],
        output: [{ index: 0, id: uuidv4(), type: 'output', connectionDragging: false, highlight: false }, { index: 1, id: uuidv4(), type: 'output', connectionDragging: false, highlight: false }, { index: 2, id: uuidv4(), type: 'output', connectionDragging: false, highlight: false }]
      }
    };
  }

  function AddNode() {
    setNodes([...nodes, getNewNode()]);
  }

  function onMouseDown(e, node) {
    const nodeIndex = nodes.findIndex(n => n.id === node.id);

    nodes[nodeIndex].mousedown = true;
    nodes[nodeIndex].lastX = e.clientX;
    nodes[nodeIndex].lastY = e.clientY;

    setNodes([...nodes]);
  }

  function onMouseMove(e) {
    const nodeIndex = nodes.findIndex(n => n.mousedown || n.connectionDragging);
    if (nodeIndex !== -1) {
      if (nodes[nodeIndex].mousedown) {
        nodes[nodeIndex].x -= nodes[nodeIndex].lastX - e.clientX;
        nodes[nodeIndex].y -= nodes[nodeIndex].lastY - e.clientY;
        nodes[nodeIndex].lastX = e.clientX;
        nodes[nodeIndex].lastY = e.clientY;
      }

      if (nodes[nodeIndex].connectionDragging) {
        nodes[nodeIndex].connectionX -= nodes[nodeIndex].lastConnectionX - e.clientX;
        nodes[nodeIndex].connectionY -= nodes[nodeIndex].lastConnectionY - e.clientY;
        nodes[nodeIndex].lastConnectionX = e.clientX;
        nodes[nodeIndex].lastConnectionY = e.clientY;
      }
    }

    setNodes([...nodes]);
  }

  function onMouseLeave(e) {
    stopDragging();
    stopConnectionDragging();
  }

  function onMouseUp(e, node) {
    stopDragging();
  }

  function startNewConnection(e, node, conn) {
    const nodeIndex = nodes.findIndex(n => n.id === node.id);
    const connectors = nodes[nodeIndex].connectors[conn.type];
    const connectionIndex = connectors.findIndex(c => c.id === conn.id);

    connectors[connectionIndex].connectionDragging = true;
    nodes[nodeIndex].connectionDragging = true;
    nodes[nodeIndex].lastConnectionX = e.clientX;
    nodes[nodeIndex].lastConnectionY = e.clientY;

    nodes[nodeIndex].connectionX = node.x + (conn.type === 'input' ? 0 : NodeWidth);
    nodes[nodeIndex].connectionY = node.y + ((conn.index+1) * 20);

    setNodes([...nodes]);
  }


  function computeConnectionTangentOffset(pt1, pt2) {
    return (pt2.x - pt1.x) / 2;
  }

  function sourceTangentX(pt1, pt2) {
    return pt1.x + computeConnectionTangentOffset(pt1, pt2);
  }

  function sourceTangentY(pt1, pt2) {
    return pt1.y;
  }

  function destTangentX(pt1, pt2) {
    return pt2.x - computeConnectionTangentOffset(pt1, pt2);
  }

  function destTangentY(pt1, pt2) {
    return pt2.y;
  }

  function stopConnectionDragging() {
    makeConnection();
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].connectionDragging = false;
      for (let j = 0; j < nodes[i].connectors.input.length; j++) {
        nodes[i].connectors.input[j].connectionDragging = false;
      }
      for (let j = 0; j < nodes[i].connectors.output.length; j++) {
        nodes[i].connectors.output[j].connectionDragging = false;
      }
    }
    setNodes([...nodes]);
  }

  function stopDragging() {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].mousedown = false;
    }

    setNodes([...nodes]);
  }

  function setConnectionHightlight(c, state) {
    c.highlight = state;
    setNodes([...nodes]);
  }

  function getConnector(n, c) {
    return <circle key={c.id} r={c.highlight ? 7 : 5} cx={n.x + (c.type === 'input' ? 0 : NodeWidth)} cy={n.y + (c.index+1) * 20}
      onMouseDown={(e) => startNewConnection(e, n, c)} onMouseOver={() => setConnectionHightlight(c, true)} onMouseLeave={() => setConnectionHightlight(c, false)} />;
  }

  function makeConnection() {
    const draggingNode = nodes.filter(n => n.connectionDragging)[0];
    if (draggingNode ===  undefined)
      return;
    const draggingConnector = draggingNode.connectors.input.concat(draggingNode.connectors.output).filter(c => c.connectionDragging)[0]
    if (draggingConnector === undefined)
      return;
    const highlightedNode = nodes.filter(n => n.connectors.input.concat(n.connectors.output).filter(c => c.highlight)[0] !== undefined)[0];
    if (highlightedNode === undefined)
      return;
    const highlightedConnector = highlightedNode.connectors.input.concat(highlightedNode.connectors.output).filter(c => c.highlight)[0];
    connections.push({from: {node: draggingNode, connector: draggingConnector}, to: {node: highlightedNode, connector: highlightedConnector}});

    setConnections([...connections]);
  }


  function getNewConnectionPath(n) {
    const draggingConnectionType = n.connectors.output.findIndex(c => c.connectionDragging) === -1 ? 'input' : 'output';
    const connectionIndex = n.connectors[draggingConnectionType].findIndex(c => c.connectionDragging);
    const draggingConnection = n.connectors[draggingConnectionType][connectionIndex];

    const sourcePoint = { x: n.x + (draggingConnectionType === 'input' ? 0 : NodeWidth), y: n.y + ((draggingConnection.index+1) * 20) };
    const destPoint = { x: n.connectionX, y: n.connectionY };
    const sourceTangent = { x: sourceTangentX(sourcePoint, destPoint), y: sourceTangentY(sourcePoint, destPoint) };
    const destTangent = { x: destTangentX(sourcePoint, destPoint), y: destTangentY(sourcePoint, destPoint) };
    const path = `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceTangent.x} ${sourceTangent.y}, ${destTangent.x} ${destTangent.y}, ${destPoint.x} ${destPoint.y}`;

    return path;
  }

  function getNode(n) {
    return <>
      {/* Outline */}
      <rect rx="4" ry="4" x={n.x} y={n.y} width={NodeWidth} height={(n.connectors.output.length * 20) + 20} style="fill:#9b4dca;" onMouseDown={(e) => onMouseDown(e, n)} onMouseUp={(e) => onMouseUp(e, n)} />

      {/* Text */}
      <text x={n.x + (NodeWidth / 2) - 20} y={n.y + 20} font-family="Helvetica" font-size="12" fill="white" style="pointer-events: none;user-select: none;">{n.text}</text>

      {/* Connectors */}
      {n.connectors.input.map(c => getConnector(n, c))}
      {n.connectors.output.map(c => getConnector(n, c))}

      {/* New Connection Path  */}
      {n.connectionDragging && <path id="newConnection" d={getNewConnectionPath(n)} stroke="black" fill="transparent" strokeWidth={4} />}

    </>;
  }

  function getConnection(c) {
    const sourcePoint = { x: c.from.node.x + (c.from.connector.type === 'input' ? 0 : NodeWidth), y: c.from.node.y + ((c.from.connector.index+1) * 20) };

    //cx={n.x + (c.type === 'input' ? 0 : NodeWidth)} cy={n.y + (c.index+1) * 20}
    const destPoint = { x: c.to.node.x+ (c.to.connector.type === 'input' ? 0 : NodeWidth), y: c.to.node.y + (c.to.connector.index+1) * 20 };
    const sourceTangent = { x: sourceTangentX(sourcePoint, destPoint), y: sourceTangentY(sourcePoint, destPoint) };
    const destTangent = { x: destTangentX(sourcePoint, destPoint), y: destTangentY(sourcePoint, destPoint) };

    return <path d={`M ${sourcePoint.x} ${sourcePoint.y} C ${sourceTangent.x} ${sourceTangent.y}, ${destTangent.x} ${destTangent.y}, ${destPoint.x} ${destPoint.y}`} stroke="black" fill="transparent" strokeWidth={4} />;

  }


  return (
    <div class={style.home} >
      <div class={style.row}>
        <div class={style.column}>
          <a className="button" href="#" onClick={AddNode}>Add Node</a>
        </div>
        <div class={style.columnend}>
          <svg onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} style="width: 100%; height: 98vh;" onMouseUp={stopConnectionDragging} >
            <g>

              {nodes.map(n => getNode(n))}
              {connections.map(c => getConnection(c))}

              <use xlinkHref="#newConnection"/>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Home;
