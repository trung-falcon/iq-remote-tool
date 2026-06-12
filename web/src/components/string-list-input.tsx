import { Select } from 'antd';

type Props = {
  value?: (string | number)[];
  numeric?: boolean;
  placeholder?: string;
  onChange: (next: string[] | number[] | undefined) => void;
};

// Free-entry list editor (AntD tags mode). Empty → undefined so the field is
// omitted on serialize. `numeric` parses tokens to numbers (for swapAfterNS).
export function StringListInput({ value, numeric, placeholder, onChange }: Props) {
  return (
    <Select
      mode="tags"
      open={false}
      suffixIcon={null}
      style={{ width: '100%' }}
      placeholder={placeholder}
      value={(value ?? []).map(String)}
      tokenSeparators={[',', ' ']}
      onChange={(arr: string[]) => {
        if (numeric) {
          const nums = arr.map(Number).filter(n => !Number.isNaN(n));
          onChange(nums.length ? nums : undefined);
        } else {
          const cleaned = arr.map(s => s.trim()).filter(Boolean);
          onChange(cleaned.length ? cleaned : undefined);
        }
      }}
    />
  );
}
