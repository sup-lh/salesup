export interface LocalUserOption {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserSelectProps {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
}

export type UserSelectValue = string | null;
export type UserValue = LocalUserOption;
export type ValueType = 'string';
export type User = LocalUserOption;
