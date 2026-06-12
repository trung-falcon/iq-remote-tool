import { App as AntApp, ConfigProvider } from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';
import RemoteConfigApp from './app';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}>
      <AntApp>
        <RemoteConfigApp />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
