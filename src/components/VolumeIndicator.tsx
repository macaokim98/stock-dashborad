import React from 'react';

interface VolumeIndicatorProps {
  volume: number;
  averageVolume?: number;
  className?: string;
}

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ 
  volume, 
  averageVolume, 
  className = '' 
}) => {
  const formatVolume = (vol: number): string => {
    if (vol >= 1000000000) {
      return (vol / 1000000000).toFixed(2) + 'B';
    } else if (vol >= 1000000) {
      return (vol / 1000000).toFixed(2) + 'M';
    } else if (vol >= 1000) {
      return (vol / 1000).toFixed(2) + 'K';
    }
    return vol.toString();
  };

  const getVolumeStatus = (): { status: string; color: string } => {
    if (!averageVolume) {
      return { status: 'Normal', color: '#64748b' };
    }

    const ratio = volume / averageVolume;
    if (ratio >= 2) {
      return { status: 'Very High', color: '#dc2626' };
    } else if (ratio >= 1.5) {
      return { status: 'High', color: '#ea580c' };
    } else if (ratio >= 0.8) {
      return { status: 'Normal', color: '#059669' };
    } else {
      return { status: 'Low', color: '#0284c7' };
    }
  };

  const { status, color } = getVolumeStatus();

  return (
    <div className={`volume-indicator ${className}`}>
      <div className="volume-main">
        <span className="volume-label">거래량</span>
        <span className="volume-value">{formatVolume(volume)}</span>
      </div>
      
      {averageVolume && (
        <div className="volume-details">
          <div className="volume-average">
            평균: {formatVolume(averageVolume)}
          </div>
          <div 
            className="volume-status"
            style={{ color }}
          >
            {status}
          </div>
        </div>
      )}
      
      {averageVolume && (
        <div className="volume-bar">
          <div 
            className="volume-bar-fill"
            style={{ 
              width: `${Math.min((volume / averageVolume) * 100, 100)}%`,
              backgroundColor: color 
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VolumeIndicator;