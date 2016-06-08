
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');

var moment 		= require('moment');

module.exports = function(app) {

// main landing page //
	app.get('/', function(req, res) {
		res.render('landing', {  title: 'Create Your Easy Knowledge Base'});
	});
	
// main login page //
	app.get('/login', function(req, res) {
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined) {
			res.render('login', { title: 'Please Login To Your Account' });
		} else {
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o) {
				if (o != null) {
					req.session.user = o;
					res.redirect('/home');
				} else {
					res.render('login', { title: 'Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/login', function(req, res) {
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o) {
			if (!o) {
				res.status(400).send(e);
			} else {
				req.session.user = o;
				if (req.body['remember-me'] == 'true') {
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			res.render('home', {
				title : 'Home',
				udata : req.session.user
			});
		}
	});
	
	app.post('/home', function(req, res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else {
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				title	: req.body['title']
			}, function(e, o) {
				if (e) {
					res.status(400).send('error-updating-account');
				} else {
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined) {
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/logout', function(req, res) {
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e) { res.status(200).send('ok'); });
	})
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', { title: 'Signup' });
	});
	
	app.post('/signup', function(req, res) {
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			title : req.body['title']
		}, function(e) {
			if (e) {
				res.status(400).send(e);
			} else {
				res.status(200).send('ok');
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res) {
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o) {
			if (o) {
				EM.dispatchResetPasswordLink(o, function(e, m) {
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e) {
						res.status(200).send('ok');
					} else {
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			} else {
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e) {
			if (e != 'ok') {
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o) {
			if (o) {
				res.status(200).send('ok');
			} else {
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts) {
			res.render('print', { title : 'Account List', accts : accounts, moment: moment });
		})
	});
	
	app.post('/delete', function(req, res) {
		AM.deleteAccount(req.body.id, function(e, obj) {
			if (!e) {
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e) { res.status(200).send('ok'); });
			} else {
				res.status(400).send('record not found');
			}
		});
	});

// add edit view & delete categories //
	
	app.get('/categories', function(req, res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else {
			AM.getAllCategories(req.session.user, function(e, categories) {
				res.render('categories', { title : 'Manage categories', cats : categories, udata : req.session.user, moment: moment });
			});
		}
	});
	
	app.get('/add-category', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			res.render('add_category', {
				title : 'Add Category',
				udata : req.session.user
			});
		}
	});
	
	app.post('/add-category', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			AM.addNewCategory({
				name 	: req.body['name'],
				user 	: req.session.user
			}, function(e) {
				if (e) {
					res.status(400).send(e);
				} else {
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/delete-category', function(req, res) {
		AM.deleteCategory(req.body.id, function(e, obj) {
			if (!e) {
				res.status(200).send('ok');
			} else {
				res.status(400).send('record not found');
			}
		});
	});

// add edit view & delete articles //
	
	app.get('/articles', function(req, res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else {
			AM.getAllArticles(req.session.user._id, function(e, articles) {
				res.render('articles', { title : 'Manage Articles', arts : articles, udata : req.session.user, moment: moment });
			});
		}
	});
	
	app.get('/add-article', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			AM.getAllCategories(req.session.user, function(e, categories) {
				res.render('add_article', { title : 'Add Article', cats : categories, udata : req.session.user });
			});
		}
	});

	app.post('/add-article', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			AM.addNewArticle({
				title 			: req.body['title'],
				tags 			: req.body['tags'],
				category_id		: req.body['category'],
				article 		: req.body['article'],
				article_plain 	: req.body['article_plain'],
				user 			: req.session.user
			}, function(e) {
				if (e) {
					res.status(400).send(e);
				} else {
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/delete-article', function(req, res) {
		AM.deleteArticle(req.body.id, function(e, obj) {
			if (!e) {
				res.status(200).send('ok');
			} else {
				res.status(400).send('record not found');
			}
		});
	});

	app.get('/edit-article/:articleId', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			AM.getAllCategories(req.session.user, function(e, categories) {
				AM.findArticleById(req.params.articleId, function(e, article) {
					res.render('edit_article', { title : 'Edit Article', cats : categories, cdata: article, udata : req.session.user });
				});
			});
		}
	});
	
	app.post('/edit-article/:articleId', function(req, res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else {
			AM.updateArticle({
				id				: req.params.articleId,
				title 			: req.body['title'], 
				tags 			: req.body['tags'],
				category_id		: req.body['category'],
				article 		: req.body['article'],
				article_plain 	: req.body['article_plain'],
				user 			: req.session.user
			}, function(e, o) {
				if (e) {
					res.status(400).send('error-updating-article');
				} else {
					res.status(200).send('ok');
				}
			});
		}
	});

	app.get('/search-article/:search', function(req, res) {
		if (req.session.user == null) {
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else {
			AM.searchArticle(req.params.search, req.session.user, function(e, articles) {
				res.render('search_article', { title : 'Search Article', cdata: articles, search: req.params.search, udata : req.session.user });
			});
		}
	});

	app.get('/subdomain/:thesubdomain/', function(req, res) {
	  AM.getAccountByUserName(req.params.thesubdomain, function(o) {
			if (o) {
				AM.getArticleCategories(o, function(e, categories) {
					res.render('index', { title : 'Knowledge Base', cdata: categories});
				});
			} else {
				res.redirect('/404');
			}
		});
	});
 
	app.post('/subdomain/:thesubdomain/load-articles', function(req, res) {
		AM.getAllArticlesTitleByCategory(req.body.id, function(e, obj) {
			if (!e) {
				res.status(200).send(obj);
			}
		});
	});

	app.post('/subdomain/:thesubdomain/latest-articles', function(req, res) {
	  AM.getAccountByUserName(req.params.thesubdomain, function(o) {
			if (o) {
				AM.getLatestArticles(o, function(e, obj) {
					res.status(200).send(obj);
				});
			}
		});
	});
 
	app.get('/subdomain/:thesubdomain/article/:articleId', function(req, res) {
	  AM.getAccountByUserName(req.params.thesubdomain, function(o) {
			if (o) {
				AM.findArticleByIdWCategory(req.params.articleId, function(e, article) {
					res.render('single_index', { title : article.title, cdata: article, tags: article.tags.trim() != '' ? article.tags.split(',') : '', moment: moment });
				});
			} else {
				res.redirect('/404');
			}
		});
	});
 
	app.get('/subdomain/:thesubdomain/category/:categoryId', function(req, res) {
	  AM.getAccountByUserName(req.params.thesubdomain, function(o) {
			if (o) {
				AM.getAllArticlesByCategory(req.params.categoryId, function(e, articles) {
					AM.findCategoryNameById(req.params.categoryId, function(e, categoryName) {
						res.render('single_category', { title : categoryName, cdata: articles, categoryName: categoryName, moment: moment });
					});
				});
			} else {
				res.redirect('/404');
			}
		});
	});

	app.get('/subdomain/:thesubdomain/search/:search', function(req, res) {
	  AM.getAccountByUserName(req.params.thesubdomain, function(o) {
			if (o) {
				AM.searchArticleWCategory(req.params.search, o, function(e, articles) {
					res.render('index_search', { title : req.params.search, cdata: articles, search: req.params.search, moment: moment });
				});
			} else {
				res.redirect('/404');
			}
		});
	});

	app.get('/subdomain/:thesubdomain/add-article-like', function(req, res) {
		AM.addNewArticleLike({
			article_id	: req.body['article'],
			req 		: req.headers, 
			like 		: req.body['like']
		}, function(e) {
			if (e) {
				res.status(400).send(e);
			} else {
				res.status(200).send('ok');
			}
		});
	});

	app.get('/subdomain/:thesubdomain/404', function(req, res) { res.render('index_404', { title: 'Page Not Found'}); });
 
	app.get('/subdomain/:thesubdomain/contactus', function(req, res) { res.render('contactus', { title: 'Contact Us'}); });
 
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
