import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.11.0';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.createTable('AppMember', {
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'App',
        key: 'id',
      },
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });

  await queryInterface.createT