import { WarningOutlined } from '@ant-design/icons';
import { Space, Tag, Tooltip } from 'antd';
import type { ParamSummary } from '../api';

// Status tags shown in every editor card header.
export function ParamTags({ summary, dirty }: { summary?: ParamSummary; dirty?: boolean }) {
  return (
    <Space size={4}>
      {dirty && <Tag color="orange">đã sửa</Tag>}
      {summary && !summary.exists && (
        <Tooltip title="Param chưa tồn tại trên Remote Config — sẽ được tạo khi publish">
          <Tag>chưa có trên template</Tag>
        </Tooltip>
      )}
      {summary?.hasConditionalValues && (
        <Tooltip title="Param này có conditional values trên Firebase — tool chỉ sửa default value, các giá trị theo điều kiện giữ nguyên">
          <Tag color="gold" icon={<WarningOutlined />}>
            conditional values
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
}
