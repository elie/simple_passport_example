const express = require("express");
const router = express.Router()
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const knex = require("../db/knex")
const bcrypt = require("bcrypt")
const helpers = require("../helpers/authHelpers")
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_KEY,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: "http://localhost:3000/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_basicprofile'],
}, function(accessToken, refreshToken, profile, done) {
    knex('users').where("linkedin_id", profile.id).first().then(user => {
      // FIND
      if(user){
        // SERIALIZE RIGHT AWAY!
        return done(null, user);
      }
      // OR CREATE
      else {
        knex('users').insert({
          linkedin_id: profile.id,
          username: profile.displayName
        },"*").then(user => {
          return done(null, user[0]);
        })
      }
    }).catch(err => {
      return done(err,null)
    })

}));

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
  console.log("THIS IS WHAT JUST GOT SERIALIZED!", user)
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

router.get('/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }));

router.get('/linkedin/callback', passport.authenticate('linkedin', {
  successRedirect: '/users',
  failureRedirect: '/auth/login',
  failureFlash: "Failed to log in with Linkedin",
  successFlash: "Welcome back!"
}));

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



