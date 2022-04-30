import { ActionType, AppDefinition, BlockManifest, EventType, Theme } from '@appsemble/types';
import {
  IdentifiableBlock,
  iterApp,
  normalizeBlockName,
  Prefix,
  stripBlockName,
  validateAppDefinition,
} from '@appsemble/utils';
import { editor, IRange, languages, worker } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize } from 'monaco-worker-manager/worker';
import { Document, isMap, isNode, isScalar, LineCounter, Node, parseDocument } from 'yaml';

const blockMap = new Map<string, Promise<BlockManifest>>();

async function getCachedBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
  const manifests = await Promise.all(
    blocks.map(({ type, version }) => {
      const url = `/api/blocks/${normalizeBlockName(type)}/versions/${version}`;
      if (!blockMap.has(url)) {
        blockMap.set(
          url,
          fetch(url).then((response) => (response.ok ? response.json() : null)),
        );
      }
      return blockMap.get(url);
    }),
  );
  return manifests.filter(Boolean);
}

let cachedYaml: [
  doc: Document.Parsed,
  lineCounter: LineCounter,
  definition: AppDefinition,
  version: number,
];
function parseYamlCached(ctx: worker.IWorkerContext, uri: string): typeof cachedYaml | [] {
  const models = ctx.getMirrorModels();
  const model = models.find((m) => String(m.uri) === uri);
  if (