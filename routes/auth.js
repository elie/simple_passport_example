const express = require("express");
const router = express.Router()
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const knex = require("../db/knex")
const bcrypt = require("bcrypt")
const helpers = require("../helpers/authHelpers")

// Mixing too many things...good opportunity to refactor and make more modular
passport.use(new LocalStrategy({
  usernameField: 'user[username]',
  passwordField: 'user[password]',
  passReqToCallback: true
}, function (req,username, password, done){
  // SERVER IS HANGING
  // if i do first i get undefined or {}
  // if i do NOT do first i get [] or [{}]
  knex('users').where("username", username).first().then(user => {
    if(!user){
      // SEND A FLASH MESSAGE SAYING INVALID USERNAME
      return done(null,false)
    }
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if(!isMatch){
        // SEND A FLASH MESSAGE SAYING INVALID PASSWORD
        return done(null,false)
      }
      else {
        // SEND A FLASH MESSAGE SAYING SUCCESSFULLY LOGGED IN!
        return done(null,user)
      }
    })
  }).catch(err => {
    return done(err,false)
  })
}))

passport.serializeUser((user,done) =>{
  // req.session.passport.user = user.id
  done(null,user.id)
})

passport.deserializeUser((id,done) => {
  knex('users').where("id", id).first().then(user => {
    done(null, user);
    // req.user = user
  }).catch(err => {
    console.log("DESERIALIZE FAILED", err)
    done(err,false)
  })
})

router.get('/login', helpers.preventLoginSignup, function(req,res){
  // res.locals.name = "Elie"
  res.render("auth/login", {message: req.flash('error')})
});

router.post('/login',
  passport.authenticate('local',
    {
      successRedirect: '/users',
      failureRedirect: '/auth/login',
      failureFlash: "Invalid credentials",
      successFlash: "Welcome back!",
    }
  ));

router.get('/logout', function(req,res){
  req.logout();
  res.redirect('/auth/login')
});


module.exports = router;



