import React from 'react';

interface DeviceMockupProps {
  children: React.ReactNode;
}

export const DeviceMockup: React.FC<DeviceMockupProps> = ({ children }) => {
  return (
    <div
      className="relative mx-auto my-3 w-full max-w-[430px] bg-[#FFFFFF] border-[4px] border-[#0D0D0D] shadow-[8px_8px_0px_#0D0D0D]"
      style={{ borderRadius: '2px' }}
    >
      {/* Top Phone Chrome / Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b-[3px] border-[#0D0D0D] bg-[#F2EFE9] font-mono text-xs font-bold text-[#0D0D0D]">
        <span>09:41</span>
        <div className="w-16 h-3 bg-[#0D0D0D]" />
        <span>100%</span>
      </div>

      {/* Screen Content */}
      <div className="p-4 bg-[#F2EFE9] min-h-[680px] max-h-[760px] overflow-y-auto pb-24 space-y-4">
        {children}
      </div>
    </div>
  );
};
