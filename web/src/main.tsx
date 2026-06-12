import { App as AntApp, ConfigProvider, theme } from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';
import RemoteConfigApp from './app';

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Dark "OLED" theme — deep slate surfaces, blue primary, green/amber/red semantics.
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorBgBase: '#0a0d14',
          colorBgContainer: '#141925',
          colorBgElevated: '#1a2030',
          colorBorder: '#2a3344',
          colorBorderSecondary: '#222a3a',
          colorTextBase: '#e6eaf2',
          borderRadius: 10,
          fontFamily: FONT_STACK,
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Card: { paddingLG: 20 },
          Slider: { handleSize: 12, handleSizeHover: 14, railSize: 6 },
          Modal: { contentBg: '#141925', headerBg: '#141925' },
          Alert: { borderRadiusLG: 10 },
        },
      }}
    >
      <AntApp>
        <RemoteConfigApp />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
