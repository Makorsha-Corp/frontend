import { OrderedPart } from '@/types';
import { X } from 'lucide-react';
import React from 'react'


interface PopupProps {
    orderedParts: OrderedPart[] | null;
    onClose: () => void;
    position: { top: number; left: number };
}

const OrderedPartsPopup: React.FC<PopupProps> = ({ orderedParts, onClose, position }) => {
    return (
        <>{orderedParts? (<div
          className="absolute z-50 p-4 min-w-64 bg-white border rounded shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-gray-500 hover:text-red-500"
            aria-label="Close ordered parts popup"
            title="Close"
          >
            <X aria-hidden="true"></X>
          </button>
          <h4 className="text-sm font-semibold mb-2">Order {orderedParts[0].order_id} - Ordered parts:</h4>
         
          <div className="flex flex-col pt-2">
            {orderedParts.length>0 ? (
              orderedParts.map((part) => (
                <div key={part.id} className="text-xs whitespace-nowrap">
                  {part.parts.name} - [{part.qty} {part.parts.unit}]
                </div>
              ))
            ) : (
              <div>No parts available</div>
            )}
          </div>
        </div>): (<div>Error :o</div>)}</>
      );
}

export default OrderedPartsPopup