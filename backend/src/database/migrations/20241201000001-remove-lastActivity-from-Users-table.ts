import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "lastActivity");
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "lastActivity", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: "Timestamp de la última actividad del usuario para el sistema de inactividad"
    });
  }
};
