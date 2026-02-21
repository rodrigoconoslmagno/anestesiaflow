import { classNames } from 'primereact/utils';

export type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const getColSpanClass = (span: ColSpan = 12) => {
  return classNames('col-span-12', {
    'md:col-span-1': span === 1,
    'md:col-span-2': span === 2,
    'md:col-span-3': span === 3,
    'md:col-span-4': span === 4,
    'md:col-span-6': span === 6,
    'md:col-span-8': span === 8,
    'md:col-span-10': span === 10,
    'md:col-span-12': span === 12,
  });
};