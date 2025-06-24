// filepath: d:\CODING\Backend\SCATCH\middlewares\isAdmin.js
module.exports = function(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  req.flash("error", "Access denied.");
  res.redirect("/");
};

