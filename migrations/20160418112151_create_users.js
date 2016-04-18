exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', t => {
    t.increments()
    t.text('username').unique().notNullable()
    t.text('password')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
