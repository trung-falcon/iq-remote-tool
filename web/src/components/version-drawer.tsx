import { HistoryOutlined } from '@ant-design/icons';
import { Alert, App, Button, Drawer, List, Popconfirm, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { api, type VersionInfo } from '../api';

type Props = {
  open: boolean;
  currentVersion?: string;
  onClose: () => void;
  onRolledBack: () => void; // parent re-fetches template
};

// Last 10 Remote Config versions with one-click rollback.
export function VersionDrawer({ open, currentVersion, onClose, onRolledBack }: Props) {
  const { message } = App.useApp();
  const [versions, setVersions] = useState<VersionInfo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setVersions(null);
    setLoadError(null);
    api
      .versions()
      .then(r => setVersions(r.versions))
      .catch(e => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [open]);

  const rollback = async (versionNumber: string) => {
    setRollingBack(versionNumber);
    try {
      const r = await api.rollback(versionNumber);
      message.success(`Đã rollback — version mới: ${r.versionNumber}`);
      onClose();
      onRolledBack();
    } catch (e) {
      message.error(`Rollback thất bại: ${(e as Error).message}`);
    } finally {
      setRollingBack(null);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      title={
        <span>
          <HistoryOutlined /> Lịch sử version (10 gần nhất)
        </span>
      }
    >
      {loadError ? (
        <Alert type="error" showIcon message="Không tải được lịch sử" description={loadError} />
      ) : !versions ? (
        <Spin />
      ) : (
        <List
          dataSource={versions}
          renderItem={v => (
            <List.Item
              actions={[
                v.versionNumber !== currentVersion && v.versionNumber ? (
                  <Popconfirm
                    key="rb"
                    title={`Rollback toàn bộ template về version ${v.versionNumber}?`}
                    description="Tạo version mới với nội dung của version này."
                    onConfirm={() => rollback(v.versionNumber!)}
                  >
                    <Button size="small" loading={rollingBack === v.versionNumber}>
                      Rollback
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tag key="cur" color="green">
                    hiện tại
                  </Tag>
                ),
              ]}
            >
              <List.Item.Meta
                title={`v${v.versionNumber ?? '?'} — ${
                  v.updateTime ? new Date(v.updateTime).toLocaleString('vi-VN') : ''
                }`}
                description={
                  <>
                    {v.updateUser && <div>{v.updateUser}</div>}
                    {v.description && (
                      <Typography.Text type="secondary">{v.description}</Typography.Text>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
