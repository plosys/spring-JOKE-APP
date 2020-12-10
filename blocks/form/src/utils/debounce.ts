export function debounce(cb: (...args: any) => void, delay = 1000): (...args: any) => void {
  let timeo