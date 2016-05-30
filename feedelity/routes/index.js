/*
 * GET home page.
 */

exports.index = function(req, res) {
    res.render('index', {user: req.user});
};


exports.login = function(req, res) {

    if (req.user) {
        res.redirect('/');
    } else {
        res.render('login');
    };
};

exports.partial = function(req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
};