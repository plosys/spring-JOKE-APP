import { bootstrap, Remapper } from '@appsemble/sdk';
import { has } from '@appsemble/utils';

const parser = new DOMParser();

function populateContentNodes(
  nodes: NodeListOf<HTMLElement>,
  data: any,
  placeholders: Record<string, Remapper>,
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any,
): void {
  for (cons