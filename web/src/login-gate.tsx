import { ControlOutlined, LockOutlined } from '@ant-design/icons';
import { App, Button, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { getPassword, setPassword, UNAUTHORIZED_EVENT } from './auth';

// Wraps the app behind a shared-password gate. Once a valid password is stored,
// the app renders; a 401 anywhere clears it (via `rc-unauthorized`) and brings
// this screen back.
export function LoginGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => !!getPassword());

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  if (authed) return <>{children}</>;
  return <LoginScreen onSuccess={() => setAuthed(true)} />;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const { message } = App.useApp();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await api.login(value.trim());
      setPassword(value.trim());
      onSuccess();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        message.error('Sai mật khẩu, thử lại.');
      } else {
        message.error(`Đăng nhập thất bại: ${(e as Error).message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(900px 600px at 50% -10%, rgba(59,130,246,0.18), transparent)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: 28,
          borderRadius: 16,
          background: '#141925',
          border: '1px solid #2a3344',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 16,
            display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
            boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
          }}
        >
          <ControlOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Remote Config
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Nhập mật khẩu để truy cập công cụ.
        </Typography.Text>
        <Input.Password
          autoFocus
          size="large"
          prefix={<LockOutlined />}
          placeholder="Mật khẩu"
          value={value}
          onChange={e => setValue(e.target.value)}
          onPressEnter={submit}
          style={{ marginTop: 20 }}
        />
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={submit}
          style={{ marginTop: 16 }}
        >
          Đăng nhập
        </Button>
      </div>
    </div>
  );
}
