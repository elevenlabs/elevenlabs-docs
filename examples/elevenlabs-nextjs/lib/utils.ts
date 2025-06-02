import { clsx, type ClassValue } from 'clsx';
import { observable } from 'mobx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function signal<T>(initialValue: T) {
  return observable.box(initialValue);
}
