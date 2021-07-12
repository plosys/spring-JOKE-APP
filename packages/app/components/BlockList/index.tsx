
import { EventEmitter } from 'events';

import { Loader, useLocationString } from '@appsemble/react-components';
import { BlockDefinition, PageDefinition, Remapper, Security, TeamMember } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types.js';
import { ActionCreators } from '../../utils/actions/index.js';
import { AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { Block } from '../Block/index.js';
import { useUser } from '../UserProvider/index.js';

interface BlockListProps {
  blocks: BlockDefinition[];
  data?: any;
  ee: EventEmitter;
  extraCreators?: ActionCreators;
  flowActions?: {};
  page: PageDefinition;
  prefix: string;
  prefixIndex: string;
  appStorage: AppStorage;
  remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  showDialog: ShowDialogAction;
  showShareDialog: ShowShareDialog;
}

function filterBlocks(
  security: Security,
  blocks: BlockDefinition[],
  userRole: string,
  teams: TeamMember[],
): [BlockDefinition, number][] {
  return blocks
    .map<[BlockDefinition, number]>((block, index) => [block, index])
    .filter(
      ([block]) =>
        block.roles === undefined ||
        block.roles.length === 0 ||
        block.roles.some((r) => checkAppRole(security, r, userRole, teams)),
    );
}

export function BlockList({
  appStorage,
  blocks,
  data,
  ee,
  extraCreators,
  flowActions,
  page,
  prefix,
  prefixIndex,
  remap,
  showDialog,
  showShareDialog,
}: BlockListProps): ReactElement {
  const { definition, revision } = useAppDefinition();
  const { isLoggedIn, role, teams } = useUser();
  const redirect = useLocationString();

  const blockList = useMemo(
    () => filterBlocks(definition.security, blocks, role, teams),
    [blocks, definition, role, teams],
  );

  const blockStatus = useRef(blockList.map(() => false));
  const [pageReady, setPageReady] = useState<Promise<void>>();

  const [isLoading, setIsLoading] = useState(true);
  const resolvePageReady = useRef<Function>();

  const ready = useCallback(
    (block: BlockDefinition) => {
      blockStatus.current[blockList.findIndex(([b]) => b === block)] = true;
      if (blockStatus.current.every(Boolean)) {
        setIsLoading(false);
        resolvePageReady.current();
      }
    },
    [blockList],
  );

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [blockList]);

  if (!blockList.length) {
    if (!isLoggedIn) {
      return <Navigate to={`/Login?${new URLSearchParams({ redirect })}`} />;
    }

    return <Navigate to="/" />;
  }

  return (
    <>
      {isLoading ? <Loader /> : null}
      {blockList.map(([block, index]) => (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          appStorage={appStorage}
          block={block}
          data={data}
          ee={ee}
          extraCreators={extraCreators}
          flowActions={flowActions}
          key={`${prefix}.${index}-${revision}`}
          page={page}
          pageReady={pageReady}
          prefix={`${prefix}.${index}`}
          prefixIndex={`${prefixIndex}.${index}`}
          ready={ready}
          remap={remap}
          showDialog={showDialog}
          showShareDialog={showShareDialog}
        />
      ))}
    </>
  );
}