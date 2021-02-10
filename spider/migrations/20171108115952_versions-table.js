exports.up = function(knex) {
  return knex.schema.createTable("versions", table => {
    table.string("type").unique();
    table.string("value").nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("versions");
};
