'use client';

import React, { useState, useCallback } from 'react';
import { Smartphone, Tablet, Monitor, Maximize2, RotateCcw, Info } from 'lucide-react';
import { LPViewer } from './LPViewer';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
  userAgent: string;
}

const DEVICE_PRESETS: Record<string, DevicePreset> = {
  mobile: {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    icon: Smartphone,
    description: 'iOS Safari, 375x667',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  'mobile-large': {
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    icon: Smartphone,
    description: 'iOS Safari, 390x844',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    name: 'iPad',
    width: 768,
    height: 1024,
    icon: Tablet,
    description: 'iPad Safari, 768x1024',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  'tablet-landscape': {
    name: 'iPad Landscape',
    width: 1024,
    height: 768,
    icon: Tablet,
    description: 'iPad Safari Landscape, 1024x768',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  desktop: {
    name: 'Desktop',
    width: 1200,
    height: 800,
    icon: Monitor,
    description: 'Desktop Chrome, 1200x800',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  'desktop-large': {
    name: 'Large Desktop',
    width: 1440,
    height: 900,
    icon: Monitor,
    description: 'Large Desktop, 1440x900',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

interface ResponsivePreviewProps {
  htmlContent: string;
  cssContent?: string;
  title?: string;
  onTextUpdate?: (elementId: string, newText: string) => void;
  onAIImprove?: (elementId: string, currentText: string) => void;
  onExport?: (result: { filename: string; size: number }) => void;
  isModalOpen?: boolean;
  className?: string;
}

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  htmlContent,
  cssContent,
  title,
  onTextUpdate,
  onAIImprove,
  onExport,
  isModalOpen,
  className = ''
}) => {
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_PRESETS>('desktop');
  const [isRotated, setIsRotated] = useState(false);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);

  const device = DEVICE_PRESETS[currentDevice];

  const handleDeviceChange = useCallback((deviceKey: keyof typeof DEVICE_PRESETS) => {
    setCurrentDevice(deviceKey);
    setIsRotated(false); // Reset rotation when changing devices
  }, []);

  const handleRotate = useCallback(() => {
    setIsRotated(prev => !prev);
  }, []);

  const getDeviceClasses = useCallback(() => {
    const baseClasses = "transition-all duration-300 mx-auto bg-white shadow-xl rounded-lg overflow-hidden";
    
    if (currentDevice === 'desktop' || currentDevice === 'desktop-large') {
      return `${baseClasses} w-full h-full`;
    }
    
    const width = isRotated ? device.height : device.width;
    const height = isRotated ? device.width : device.height;
    
    return `${baseClasses} border border-gray-300`;
  }, [currentDevice, device, isRotated]);

  const getDeviceStyles = useCallback(() => {
    if (currentDevice === 'desktop' || currentDevice === 'desktop-large') {
      return { width: '100%', height: '100%' };
    }
    
    const width = isRotated ? device.height : device.width;
    const height = isRotated ? device.width : device.height;
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxHeight: '70vh' // Ensure it fits in the viewport
    };
  }, [currentDevice, device, isRotated]);

  const canRotate = currentDevice !== 'desktop' && currentDevice !== 'desktop-large';

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Device Controls */}
      <div className="flex-shrink-0 p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Device Selection */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(DEVICE_PRESETS).map(([key, preset]) => {
              const IconComponent = preset.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleDeviceChange(key as keyof typeof DEVICE_PRESETS)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors touch-manipulation ${
                    currentDevice === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={preset.description}
                  aria-label={`Switch to ${preset.name}`}
                >
                  <IconComponent size={12} />
                  <span className="hidden sm:inline">{preset.name}</span>
                </button>
              );
            })}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Rotation Control */}
            {canRotate && (
              <button
                onClick={handleRotate}
                className={`p-1 rounded transition-colors touch-manipulation ${
                  isRotated
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Rotate device"
                aria-label="Rotate device orientation"
              >
                <RotateCcw size={14} />
              </button>
            )}
            
            {/* Device Info Toggle */}
            <button
              onClick={() => setShowDeviceInfo(!showDeviceInfo)}
              className={`p-1 rounded transition-colors touch-manipulation ${
                showDeviceInfo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Show device information"
              aria-label="Toggle device information"
            >
              <Info size={14} />
            </button>
          </div>
        </div>
        
        {/* Device Info Panel */}
        {showDeviceInfo && (
          <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div><strong>Device:</strong> {device.name}</div>
              <div><strong>Size:</strong> {isRotated ? `${device.height}x${device.width}` : `${device.width}x${device.height}`}</div>
              <div className="sm:col-span-2"><strong>User Agent:</strong> {device.userAgent.substring(0, 60)}...</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
        <div 
          className={getDeviceClasses()}
          style={getDeviceStyles()}
        >
          {/* Device Frame for Mobile/Tablet */}
          {currentDevice !== 'desktop' && currentDevice !== 'desktop-large' && (
            <div className="relative h-full">
              {/* Device Header (simulating phone/tablet UI) */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-black flex items-center justify-center z-10">
                <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
              </div>
              
              {/* Preview Content */}
              <div className="h-full pt-6">
                <LPViewer
                  htmlContent={htmlContent}
                  cssContent={cssContent}
                  title={title}
                  onTextUpdate={onTextUpdate}
                  onAIImprove={onAIImprove}
                  onExport={onExport}
                  isModalOpen={isModalOpen}
                  enableFullscreen={false}
                  enableDevicePreview={false} // Disable nested device preview
                  width="100%"
                  height="100%"
                />
              </div>
              
              {/* Device Footer (simulating home indicator) */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-black flex items-center justify-center">
                <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Desktop Preview (no device frame) */}
          {(currentDevice === 'desktop' || currentDevice === 'desktop-large') && (
            <LPViewer
              htmlContent={htmlContent}
              cssContent={cssContent}
              title={title}
              onTextUpdate={onTextUpdate}
              onAIImprove={onAIImprove}
              onExport={onExport}
              isModalOpen={isModalOpen}
              enableFullscreen={true}
              enableDevicePreview={false} // Disable nested device preview
              width="100%"
              height="100%"
            />
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="flex-shrink-0 px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>
            {device.name} • {isRotated ? `${device.height}x${device.width}` : `${device.width}x${device.height}`}
            {isRotated && ' (Rotated)'}
          </span>
          <span>
            Responsive Preview • Touch Optimized
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResponsivePreview;