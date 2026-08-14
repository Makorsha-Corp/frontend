import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  COMMON_TIMEZONES,
  filterTimezones,
  timezoneLabel,
} from '@/lib/timezones';

export interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const searchResults = useMemo(() => filterTimezones(search), [search]);

  const pick = (tz: string) => {
    onChange(tz);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{timezoneLabel(value)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,92vw)] p-3" align="start">
        <Input
          placeholder="Search timezone…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mb-2"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {(search.trim() ? searchResults : COMMON_TIMEZONES.map((z) => z.value)).map((tz) => {
            const label = COMMON_TIMEZONES.find((z) => z.value === tz)?.label ?? tz.replace(/_/g, ' ');
            return (
              <button
                key={tz}
                type="button"
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                  value === tz && 'bg-muted'
                )}
                onClick={() => pick(tz)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4 shrink-0',
                    value === tz ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimezoneSelect;
