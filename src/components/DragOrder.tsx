import { useState, useCallback } from "react";

interface DragOrderProps {
  items: string[];
  order: string[];
  onReorder: (newOrder: string[]) => void;
}

const DragOrder = ({ items, order, onReorder }: DragOrderProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newOrder = [...order];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, removed);
    onReorder(newOrder);
    setDragIndex(index);
  }, [dragIndex, order, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  // Mobile: tap to select, tap another to swap
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleTap = useCallback((index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const newOrder = [...order];
      const temp = newOrder[selectedIndex];
      newOrder[selectedIndex] = newOrder[index];
      newOrder[index] = temp;
      onReorder(newOrder);
      setSelectedIndex(null);
    }
  }, [selectedIndex, order, onReorder]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground mb-1">
        💡 Arraste ou clique para reordenar
      </p>
      {order.map((item, index) => (
        <div
          key={item}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onClick={() => handleTap(index)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-md border cursor-grab active:cursor-grabbing
            transition-all duration-200 select-none
            ${selectedIndex === index
              ? 'border-secondary bg-secondary/20 border-glow-purple'
              : 'border-primary/30 bg-muted hover:border-primary/60'
            }
            ${dragIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
          `}
        >
          <span className="text-muted-foreground text-sm font-bold w-6">{index + 1}.</span>
          <span className="text-foreground font-semibold text-sm">{item}</span>
          <span className="ml-auto text-muted-foreground text-xs">⠿</span>
        </div>
      ))}
    </div>
  );
};

export default DragOrder;
