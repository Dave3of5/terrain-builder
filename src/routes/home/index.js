import style from './style.css';
import { useState, useEffect } from 'preact/hooks';
const Home = () => {
  const NodeHeight = 50;
  const NodeWidth = 200;
  const [nodes, setNodes] = useState([]);

  function getNewNode() {
    const heightOffset = 10;
    const maxHeight = nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.y));
    const maxId = nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.id));
    const nodeY = nodes.length === 0 ? 0 : maxHeight + NodeHeight + heightOffset;
    return {
      id: maxId + 1, x: 10, y: nodeY, lastX: 0, lastY: 0, text: `hello${maxId + 1}`,
      mousedown: false, connectionX: 0, connectionY: 0, lastConnectionX: 0, lastConnectionY: 0,
      connectionDragging: false,
      // TODO: connections are dependent on type
      connections: {
        input: [{ id: 1, type: 'input', connectionDragging: false }, { id: 2, type: 'input', connectionDragging: false }],
        output: [{ id: 1, type: 'output', connectionDragging: false }, { id: 2, type: 'output', connectionDragging: false }, { id: 3, type: 'output', connectionDragging: false }]
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
    const connections = nodes[nodeIndex].connections[conn.type];
    const connectionIndex = connections.findIndex(c => c.id === conn.id);

    connections[connectionIndex].connectionDragging = true;
    nodes[nodeIndex].connectionDragging = true;
    nodes[nodeIndex].lastConnectionX = e.clientX;
    nodes[nodeIndex].lastConnectionY = e.clientY;

    nodes[nodeIndex].connectionX = node.x + (conn.type === 'input' ? 0 : NodeWidth);
    nodes[nodeIndex].connectionY = node.y + (conn.id * 20);

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
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].connectionDragging = false;
      for (let j = 0; j < nodes[i].connections.input.length; j++) {
        nodes[i].connections.input[j].connectionDragging = false;
      }
      for (let j = 0; j < nodes[i].connections.output.length; j++) {
        nodes[i].connections.output[j].connectionDragging = false;
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


  function getPath(n) {
    const draggingConnectionType = n.connections.output.findIndex(c => c.connectionDragging) === -1 ? 'input' : 'output';
    const connectionIndex = n.connections[draggingConnectionType].findIndex(c => c.connectionDragging);
    const draggingConnection = n.connections[draggingConnectionType][connectionIndex];

    const sourcePoint = { x: n.x + (draggingConnectionType === 'input' ? 0 : NodeWidth), y: n.y + (draggingConnection.id * 20) };
    const destPoint = { x: n.connectionX, y: n.connectionY };
    const sourceTangent = { x: sourceTangentX(sourcePoint, destPoint), y: sourceTangentY(sourcePoint, destPoint) };
    const destTangent = { x: destTangentX(sourcePoint, destPoint), y: destTangentY(sourcePoint, destPoint) };
    const path = `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceTangent.x} ${sourceTangent.y}, ${destTangent.x} ${destTangent.y}, ${destPoint.x} ${destPoint.y}`;

    return path;
  }

  function getNode(n) {
    return <>
      {/* Outline */}
      <rect rx="4" ry="4" x={n.x} y={n.y} width={NodeWidth} height={(n.connections.output.length * 20) + 20} style="fill:#9b4dca;" onMouseDown={(e) => onMouseDown(e, n)} onMouseUp={(e) => onMouseUp(e, n)} />

      {/* Text */}
      <text x={n.x + (NodeWidth / 2) - 20} y={n.y + 20} font-family="Helvetica" font-size="12" fill="white" style="pointer-events: none;user-select: none;">{n.text}</text>

      {/* Connections */}
      {n.connections.input.map(c => <circle key={c.id} r="5" cx={n.x} cy={n.y + c.id * 20} onMouseDown={(e) => startNewConnection(e, n, c)} />)}
      {n.connections.output.map(c => <circle key={c.id} r="5" cx={n.x + NodeWidth} cy={n.y + c.id * 20} onMouseDown={(e) => startNewConnection(e, n, c)} />)}
      {/* Doesn't look right when going behind node */}
      {n.connectionDragging && <path d={getPath(n)} stroke="black" fill="transparent" />}

    </>;
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
              {nodes.map(n => getNode(n))
              }
            </g>
          </svg>
        </div>
      </div>

    </div>
  );
};

export default Home;
