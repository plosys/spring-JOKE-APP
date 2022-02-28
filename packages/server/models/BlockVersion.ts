
import { ActionType, EventType } from '@appsemble/types';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { type Schema } from 'jsonschema';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import { BlockAsset, BlockMessages, Organization } from './index.js';

@Table({ tableName: 'BlockVersion', updatedAt: false })
export class BlockVersion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique('blockVersionComposite')
  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column
  OrganizationId: string;

  @Unique('blockVersionComposite')
  @Column
  name: string;

  @Unique('blockVersionComposite')
  @Column
  version: string;

  @Column(DataType.STRING)
  layout?: 'float' | 'grow' | 'hidden' | 'static' | null;

  @Column
  icon: Buffer;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  longDescription: string;

  @Column(DataType.JSON)
  parameters: Schema;

  @Column(DataType.JSON)
  actions?: Record<string, ActionType>;

  @Column(DataType.JSON)
  events: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  wildcardActions: boolean;

  @Default('public')
  @AllowNull(false)
  @Column(DataType.STRING)
  visibility: 'public' | 'unlisted';

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  examples: string[];

  @BelongsTo(() => Organization)
  Organization: Awaited<Organization>;

  @HasMany(() => BlockAsset)
  BlockAssets?: BlockAsset[];

  @HasMany(() => BlockMessages)
  BlockMessages: BlockMessages[];

  @CreatedAt
  created: Date;
}