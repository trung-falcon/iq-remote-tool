import { Select } from 'antd';

type Props = {
  value?: (string | number)[];
  numeric?: boolean;
  placeholder?: string;
  options?: string[]; // suggestions (still free entry); shows a dropdown when set
  onChange: (next: string[] | number[] | undefined) => void;
};

// Free-entry list editor (AntD tags mode). Empty → undefined so the field is
// omitted on serialize. `numeric` parses tokens to numbers (for swapAfterNS).
// `options` adds autocomplete suggestions (e.g. ad group/name from ads_wf).
export function StringListInput({ value, numeric, placeholder, options, onChange }: Props) {
  return (
    <Select
      mode="tags"
      open={options ? undefined : false}
      suffixIcon={options ? undefined : null}
      options={options?.map(o => ({ value: o }))}
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
