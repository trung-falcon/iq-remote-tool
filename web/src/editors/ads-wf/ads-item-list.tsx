import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Collapse, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { type AdsItem, type AdsRemoteConfig } from '../../../../shared/ads-wf-meta';
import { ADS_TYPES } from '../../../../shared/trigger-meta';
import { AdsItemFields } from './ads-item-card';

const NEW_ITEM: AdsItem = { id: '', name: '', type: 'inter', mediation: 'admob' };

function ItemHeader({ it }: { it: AdsItem }) {
  return (
    <Space size={6} wrap>
      <Typography.Text strong>{it.name || '(chưa đặt tên)'}</Typography.Text>
      <Tag color="geekblue">{it.type}</Tag>
      <Tag>{it.mediation}</Tag>
      {it.isHighFloor && <Tag color="gold">highFloor</Tag>}
      {it.isHigh && <Tag color="blue">high</Tag>}
      {it.disabled && <Tag color="default">disabled</Tag>}
      {it.isPermanentlyStopped && <Tag color="red">stopped</Tag>}
      {it.type === 'banner' && (
        <Tooltip title="Banner không tham gia waterfall">
          <Tag color="orange">excluded</Tag>
        </Tooltip>
      )}
      <Typography.Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 11 }} ellipsis>
        {it.id || '⚠ thiếu id'}
      </Typography.Text>
    </Space>
  );
}

export function AdsItemList({
  value,
  onChange,
}: {
  value: AdsRemoteConfig;
  onChange: (v: AdsRemoteConfig) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const ids = value.ids ?? [];
  const setIds = (next: AdsItem[]) => onChange({ ...value, ids: next });

  const items = ids
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => !typeFilter || it.type === typeFilter)
    .map(({ it, i }) => ({
      key: String(i),
      label: <ItemHeader it={it} />,
      extra: (
        <Space size={2} onClick={e => e.stopPropagation()}>
          <Tooltip title="Nhân bản">
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => setIds([...ids.slice(0, i + 1), { ...it }, ...ids.slice(i + 1)])}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setIds(ids.filter((_, j) => j !== i))}
            />
          </Tooltip>
        </Space>
      ),
      children: <AdsItemFields value={it} onChange={x => setIds(ids.map((o, j) => (j === i ? x : o)))} />,
    }));

  return (
    <Card
      size="small"
      title={`Ad units (${ids.length})`}
      style={{ marginTop: 16 }}
      extra={
        <Space>
          <Select
            allowClear
            size="small"
            placeholder="Lọc type"
            style={{ width: 130 }}
            value={typeFilter}
            options={ADS_TYPES.map(t => ({ value: t, label: t }))}
            onChange={setTypeFilter}
          />
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIds([...ids, { ...NEW_ITEM }])}
          >
            Thêm unit
          </Button>
        </Space>
      }
    >
      {ids.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có ad unit nào — app sẽ không có quảng cáo cho biến thể này"
        />
      )}
      <Collapse items={items} />
    </Card>
  );
}
