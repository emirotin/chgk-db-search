exports.up = (knex, Promise) => {
  return knex.schema.createTable("tournaments", table => {
    table.increments("id");
    table.timestamps(true, true);
    table.integer("dbId");
    table
      .integer("parentId")
      .references("tournaments.id")
      .nullable();
    table.integer("parentDbId").nullable();
    table.string("title");
    table.string("dbTextId").nullable();
    table.integer("number").nullable();
    table.boolean("outdated").nullable();
    table.timestamp("dbCreatedAt").nullable();
    table.timestamp("dbUpdatedAt").nullable();
    table.timestamp("lastSpideredAt").nullable();
    table.unique(["dbId"]);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable("tournaments");
};
