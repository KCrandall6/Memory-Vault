import { useContext } from 'react';
import { UpdateContext } from './updateContextValue';

export function useUpdates() {
  const value = useContext(UpdateContext);
  if (!value) throw new Error('useUpdates must be used within UpdateProvider');
  return value;
}
