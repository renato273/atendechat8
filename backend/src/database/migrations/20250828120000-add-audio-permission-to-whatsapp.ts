import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "audioPermission", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "inherit"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "audioPermission");
  }
};


