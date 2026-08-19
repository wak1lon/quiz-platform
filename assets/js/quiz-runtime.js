export const RESPONSE_TYPES = new Set(['checkbox','radio','input','textarea','number','date','file','rating','slider','select','image-options']);
export const OPTION_TYPES = new Set(['checkbox','radio','select','image-options']);

export function uid(prefix='id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}
