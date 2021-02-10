exports.up = (knex) => {
  return knex.schema
    .createTable("tournaments", (table) => {
      table.increments("id");
      table.timestamps(true, true);

      table.integer("dbId");
      table.integer("parentId").references("tournaments.id").nullable();
      table.integer("parentDbId").nullable();
      table.string("dbTextId").nullable();
      table.integer("number").nullable();

      table.string("title");

      table.boolean("obsolete").nullable();
      table.timestamp("dbCreatedAt").nullable();
      table.timestamp("dbUpdatedAt").nullable();
      table.timestamp("lastSpideredAt").nullable();

      table.unique(["dbId"]);
    })
    .createTable("questions", (table) => {
      table.increments("id");
      table.timestamps(true, true);

      table.integer("dbId");
      table.integer("tournamentId").references("tournaments.id");
      table.integer("tournamentDbId").nullable();
      table.string("dbTextId").nullable();
      table.integer("number").nullable();

      table.string("question");
      table.string("answer");
      table.string("altAnswers");
      table.string("comments");
      table.string("authors");
      table.string("sources");

      table.boolean("obsolete").nullable();

      table.unique(["dbId"]);
    });
};

exports.down = (knex) => {
  return knex.schema.dropTable("questions").dropTable("tournaments");
};
