import { AppsembleError } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.12.4';

/**
 * Summary:
 * - Removes BlockDefinition
 * - Adds "OrganizationId" column with a foreign key constraint to BlockVersion and BlockAsset
 * - Adds "description" to BlockVersion
 * - Changes PK of BlockVersion to be [name, version, OrganizationId]
 * - Removes FK checks on OrganizationBlockStyle and AppBlockStyle
 * - Renames "BlockDefinitionId" in OrganizationBlockStyle and AppBlockStyle to "block"
 * - Removes the paranoid "deleted" column and "updated" columns in BlockVersion and BlockAsset
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  const blockNames = await db.query<{ name: string }>('SELECT DISTINCT name FROM "BlockVersion"', {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const blocks = blockNames.map(({ name: blockName }) => {
    const [organization, name] = blockName.split('/');
    return { organization: organization.slice(1), name };
  });

  await queryInterface.addColumn('BlockVersion', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Organization',
      key: 'id',
    },
  });

  await queryInterface.removeColumn('BlockVersion', 'deleted');
  await queryInterface.removeColumn('BlockVersion', 'updated');
  await queryInterface.removeColumn('BlockAsset', 'deleted');
  await queryInterface.removeColumn('BlockAsset', 'updated');

  await queryInterface.addColumn('BlockAsset', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Organization',
     