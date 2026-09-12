import * as React from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.ComponentProps<typeof InputGroupInput>, 'type'> & {
  containerClassName?: string;
};

function PasswordInput({ containerClassName, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className={containerClassName}>
      <InputGroupAddon aria-hidden="true">
        <LockKeyhole />
      </InputGroupAddon>
      <InputGroupInput
        type={visible ? 'text' : 'password'}
        className={cn('px-1', className)}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={visible ? '隐藏密码' : '显示密码'}
          title={visible ? '隐藏密码' : '显示密码'}
          size="icon-xs"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
