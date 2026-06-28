import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface PageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  margins: PageMargins;
  onSave: (margins: PageMargins) => void;
}

export function PageSetupModal({ isOpen, onClose, margins, onSave }: PageSetupModalProps) {
  const [localMargins, setLocalMargins] = React.useState(margins);

  React.useEffect(() => {
    setLocalMargins(margins);
  }, [margins, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalMargins(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSave = () => {
    onSave(localMargins);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>
      <div className="relative z-[61] w-full max-w-[400px] rounded-[12px] bg-white shadow-2xl dark:bg-[#1A1D24] overflow-hidden flex flex-col border border-[#E5E5E5] dark:border-[#393C41]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] dark:border-[#393C41]">
          <h2 className="text-lg font-medium text-[#171A20] dark:text-white">Page setup</h2>
          <button className="text-[#5C5E62] hover:bg-black/5 p-1 rounded-full transition-colors" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-medium text-[#171A20] dark:text-white mb-4">Margins (px)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#5C5E62] dark:text-[#A0A0A0] mb-1">Top</label>
              <input 
                type="number"
                name="top"
                value={localMargins.top}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#171A20] border border-[#CCCCCC] dark:border-[#393C41] rounded-[6px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#3E6AE1]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#5C5E62] dark:text-[#A0A0A0] mb-1">Bottom</label>
              <input 
                type="number"
                name="bottom"
                value={localMargins.bottom}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#171A20] border border-[#CCCCCC] dark:border-[#393C41] rounded-[6px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#3E6AE1]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#5C5E62] dark:text-[#A0A0A0] mb-1">Left</label>
              <input 
                type="number"
                name="left"
                value={localMargins.left}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#171A20] border border-[#CCCCCC] dark:border-[#393C41] rounded-[6px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#3E6AE1]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#5C5E62] dark:text-[#A0A0A0] mb-1">Right</label>
              <input 
                type="number"
                name="right"
                value={localMargins.right}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#171A20] border border-[#CCCCCC] dark:border-[#393C41] rounded-[6px] px-3 py-1.5 text-sm focus:outline-none focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#3E6AE1]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-[#EEEEEE] dark:border-[#393C41] bg-[#FAFAFA] dark:bg-[#121418]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#171A20] dark:text-[#E0E0E0] hover:bg-[#E5E5E5] dark:hover:bg-[#2C2E33] rounded-[6px] transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleSave} className="h-9 px-6 text-sm rounded-[6px]">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
