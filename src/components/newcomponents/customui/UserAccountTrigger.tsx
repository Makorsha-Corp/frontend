import React from 'react';
import { ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSettingsModal } from '@/context/SettingsModalContext';
import { avatarColor, initialsOf } from '@/components/newcomponents/customui/orders/transferOrderApprovals';

export interface UserAccountTriggerProps {
  user: { id: number; name: string; email: string };
  isExpanded: boolean;
}

function AvatarCircle({
  userId,
  name,
  className,
}: {
  userId: number;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
        avatarColor(userId),
        className
      )}
    >
      {initialsOf(name)}
    </div>
  );
}

const UserAccountTrigger: React.FC<UserAccountTriggerProps> = ({ user, isExpanded }) => {
  const { openSettings } = useSettingsModal();

  if (isExpanded) {
    return (
      <button
        type="button"
        onClick={() => openSettings()}
        className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        aria-label="Open settings"
      >
        <AvatarCircle userId={user.id} name={user.name} className="h-8 w-8 text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/85">{user.name}</p>
          <p className="truncate text-xs text-white/55">{user.email}</p>
        </div>
        <ChevronUp size={14} className="shrink-0 text-white/40" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openSettings()}
      className="mb-2 flex w-full justify-center rounded-lg p-1 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
      aria-label={`Open settings — ${user.name}`}
      title={user.name}
    >
      <AvatarCircle userId={user.id} name={user.name} className="h-8 w-8 text-[11px]" />
    </button>
  );
};

export default UserAccountTrigger;
