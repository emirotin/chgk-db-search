exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table("tournaments", table => {
      table.string("type").nullable();
    }),
    knex.schema.table("questions", table => {
      table.string("type").nullable();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table("tournaments", table => {
      table.dropColumn("type");
    }),
    knex.schema.table("questions", table => {
      table.dropColumn("type");
    })
  ]);
};
