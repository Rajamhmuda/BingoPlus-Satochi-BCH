declare module 'bchaddrjs' {
  export function toLegacyAddress(address: string): string;
  export function toCashAddress(address: string): string;
  export function toTestnetAddress(address: string): string;
  export function isTestnetAddress(address: string): boolean;
  export function isCashAddress(address: string): boolean;
}
