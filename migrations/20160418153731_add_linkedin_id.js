exports.up = function(knex, Promise) {
  return knex.schema.table('users', t => {
    t.text("linkedin_id");
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', t=> {
    t.dropColumn('linkedin_id')
  })
};
