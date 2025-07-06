import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

export const HierarchyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#6366f1',
          strokeWidth: 2,
          fill: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12, fill: '#6366f1' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {String(data.label)}
          </textPath>
        </text>
      )}
    </>
  );
};

export default HierarchyEdge;
