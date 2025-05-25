import React, { useState, ElementType } from 'react';
export interface SeatProps { 
  status: "available" | "selected" | "booked";
  icon: ElementType | null; 
  color: string;
  onClick: () => void;
  displayLabel: string; 
}

const SeatDisplayComponent: React.FC<SeatProps> = ({ status, icon: Icon, color, onClick, displayLabel }) => {
  const [isHovered, setIsHovered] = useState(false);
  let bgColor, textColor, borderColor;
  const seatColor = color;

  let isGap = !displayLabel;
  if (isGap) {
      // For gaps, render a non-interactive, visually hidden placeholder to maintain grid structure
      return <div style={{ width: 30, height: 30, margin: 4, visibility: 'hidden' }} />;
  }

  if (status === "booked") { 
    bgColor = "#A9A9A9"; // DarkGray
    textColor = "#DDD";    // Lighter gray for text on dark background
    borderColor = "#A9A9A9";
  } else if (status === "selected" || (isHovered && status === "available")) {
    bgColor = seatColor;
    textColor = "white";
    borderColor = seatColor;
  } else { // Available, not hovered
    bgColor = "white";
    textColor = seatColor;
    borderColor = seatColor;
  }

  const hasIcon = !!Icon;
  const effectiveCursor = status === "booked" ? "not-allowed" : "pointer";

  return (
    <div
      onClick={status !== "booked" ? onClick : undefined} 
      onMouseEnter={() => status === "available" && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 30,
        height: 30,
        margin: 4,
        backgroundColor: bgColor,
        color: textColor, 
        border: `1.5px solid ${borderColor}`,
        display: "flex",
        flexDirection: 'column', 
        justifyContent: hasIcon ? "space-between" : "center", 
        alignItems: "center",
        cursor: effectiveCursor,
        borderRadius: '4px',
        fontSize: hasIcon ? '0.6rem' : '0.75rem', 
        padding: hasIcon ? '2px 0' : '0', 
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
      }}
      title={displayLabel} 
      aria-label={`Seat ${displayLabel}, Status: ${status}`}
    >
      {Icon && <Icon style={{ fontSize: '0.8rem', color: textColor }} />}
      <div style={{ lineHeight: hasIcon ? '0.8rem' : 'normal' }}>{displayLabel}</div>
    </div>
  );
};

export default SeatDisplayComponent;
