import type { ScanPresetId } from '@/lib/documentScan/types';

export interface ScanPresetDefinition {
  id: ScanPresetId;
  label: string;
  description: string;
}

export const SCAN_PRESETS: ScanPresetDefinition[] = [
  {
    id: 'bw',
    label: 'Scan B&W',
    description: 'High-contrast black and white for text documents.',
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    description: 'Even lighting with natural gray tones.',
  },
  {
    id: 'colour',
    label: 'Colour',
    description: 'Keeps ink and stamp colours readable.',
  },
];

export const DEFAULT_SCAN_PRESET: ScanPresetId = 'bw';
