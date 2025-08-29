import React, { useContext } from "react";
import {
  getBezierPath,
  getMarkerEnd
} from "reactflow";

import "./css/buttonedge.css";
import { Delete } from "@mui/icons-material";

const onEdgeClick = (evt, id) => {
  evt.stopPropagation();
  //removeEdgeList(id);
};

// Función para calcular el centro del edge manualmente
const calculateEdgeCenter = (sourceX, sourceY, targetX, targetY) => {
  return [(sourceX + targetX) / 2, (sourceY + targetY) / 2];
};

export default function removeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  arrowHeadType,
  markerEndId
}) {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const [edgeCenterX, edgeCenterY] = calculateEdgeCenter(sourceX, sourceY, targetX, targetY);

  const foreignObjectSize = 40;

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <body>
          {/* <button
            className="edgebutton"
            onClick={event => onEdgeClick(event, id)}
          >
            <Delete sx={{ width: "12px", height: "12px", color: "#0000FF" }} />
          </button> */}
        </body>
      </foreignObject>
    </>
  );
}
