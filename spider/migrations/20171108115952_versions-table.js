exports.up = function(knex, Promise) {
  return knex.schema.createTable("versions", table => {
    table.string("type").unique();
    table.string("value").nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("versions");
};
