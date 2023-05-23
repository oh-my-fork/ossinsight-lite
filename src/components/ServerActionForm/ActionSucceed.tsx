import { experimental_useFormStatus as useFormStatus } from 'react-dom';
import { ReactElement, useContext } from 'react';
import { ServerActionFormContext } from '@/src/components/ServerActionForm/context';
import { ServerActionFormState } from '@/src/components/ServerActionForm/type';

interface ActionSucceedProps {
  children: ReactElement | null;
}

export function ActionSucceed ({ children }: ActionSucceedProps) {
  const { pending } = useFormStatus();
  const { state } = useContext(ServerActionFormContext);
  return !pending && state === ServerActionFormState.SUCCEED ? children : null;
}