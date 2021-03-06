
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');
var mongoose 	= require("mongoose");

/*
	ESTABLISH DATABASE CONNECTION
*/

var connection_string = 'mongodb://127.0.0.1:27017/knowledgebase';
if(process.env.MONGODB_URI){
  connection_string = process.env.MONGODB_URI;
}

mongoose.connect(connection_string);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
	console.log("Database connection succeeded.");
});

var Schema = mongoose.Schema;

var accountSchema = new Schema({
	name 	: { type : String, default : '', trim : true },
	title 	: { type : String, default : '', trim : true },
	email 	: { type : String, default : '', trim : true },
	user 	: { type : String, default : '', trim : true },
	pass 	: { type : String, default : ''},
	date 	: { type : Date, default : Date.now }
});

accountSchema.path('name').required(true, 'User name cannot be blank');
accountSchema.path('title').required(true, 'Title cannot be blank');
accountSchema.path('email').required(true, 'User email cannot be blank');
accountSchema.path('user').required(true, 'User username cannot be blank');
accountSchema.path('pass').required(true, 'User password cannot be blank');

accountSchema.pre('remove', function (next) {
  next();
});

accountSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // if created_at doesn't exist, add to that field
  if (!this.date)
	this.date = currentDate;

  next();
});

mongoose.model('Account', accountSchema);

var categorySchema = new Schema({
	name 	: { type : String, default : '', trim : true },
	user	: { type : Schema.ObjectId, ref : 'User' },
	date 	: { type : Date, default : Date.now }
});

categorySchema.path('name').required(true, 'Category name cannot be blank');

categorySchema.pre('remove', function (next) {
  next();
});

categorySchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // if created_at doesn't exist, add to that field
  if (!this.date)
	this.date = currentDate;

  next();
});

mongoose.model('Category', categorySchema);

var getTags = tags => tags.join(',');
var setTags = tags => tags.split(',');

var ArticleSchema = new Schema({
	title 			: { type : String, default : '', trim : true },
	article			: { type : String, default : '', trim : true },
	article_plain	: { type : String, default : '', trim : true },
	category 		: { type : Schema.ObjectId, ref : 'Category' },
	tags 			: { type: [], get: getTags, set: setTags },
	user			: { type : Schema.ObjectId, ref : 'Account' },
	date 			: { type : Date, default : Date.now }
});

ArticleSchema.path('title').required(true, 'Article title cannot be blank');

ArticleSchema.pre('remove', function (next) {
  next();
});

ArticleSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // if created_at doesn't exist, add to that field
  if (!this.date)
	this.date = currentDate;

  next();
});

mongoose.model('Article', ArticleSchema);

var ArticleLikeSchema = new Schema({
	article: { type : Schema.ObjectId, ref : 'Article' },
	req: { type: [] },
	like: { type : Boolean},
	date 	: { type : Date, default : Date.now }
});

ArticleLikeSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // if created_at doesn't exist, add to that field
  if (!this.date)
	this.date = currentDate;

  next();
});

mongoose.model('ArticleLike', ArticleLikeSchema);

var contactUsSchema = new Schema({
	name 	: { type : String, default : '', trim : true },
	email 	: { type : String, default : '', trim : true },
	user	: { type : Schema.ObjectId, ref : 'Account' },
	message	: { type : String, default : ''},
	date 	: { type : Date, default : Date.now }
});

contactUsSchema.path('name').required(true, 'User name cannot be blank');
contactUsSchema.path('email').required(true, 'User email cannot be blank');

contactUsSchema.pre('remove', function (next) {
  next();
});

contactUsSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // if created_at doesn't exist, add to that field
  if (!this.date)
	this.date = currentDate;

  next();
});

mongoose.model('ContactUs', contactUsSchema);

var Account = mongoose.model('Account');
var Category = mongoose.model('Category');
var Article = mongoose.model('Article');
var ArticleLike = mongoose.model('ArticleLike');
var ContactUs = mongoose.model('ContactUs');

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	Account.findOne({email:user}, function(e, o) {
		if (o) {
			o.pass == pass ? callback(o) : callback(null);
		} else {
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	Account.findOne({email:user}, function(e, o) {
		if (o == null) {
			callback('user-not-found');
		} else {
			validatePassword(pass, o.pass, function(err, res) {
				if (res) {
					callback(null, o);
				} else {
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
	Account.findOne({user:newData.user}, function(e, o) {
		if (o) {
			callback('username-taken');
		} else {
			Account.findOne({email:newData.email}, function(e, o) {
				if (o) {
					callback('email-taken');
				} else {
					saltAndHash(newData.pass, function(hash) {

						var account = new Account({
							name: newData.name,
							title: newData.title,
							email: newData.email,
							user: newData.user,
							pass: hash
						});

						account.save(function(err) {
						  if (err) callback(err);
						  console.log('User saved successfully!');
						  callback();
						});
					});
				}
			});
		}
	});
}

exports.updateAccount = function(newData, callback)
{
	if (newData.pass == '') {
		Account.findOneAndUpdate({_id:getObjectId(newData.id)}, {name: newData.name, title: newData.title}, function(err, user) {
			if (err) callback(err, null);

			// we have the updated user returned to us
			console.log('User updated successfully!');
			callback(null, user);
		});
	} else {
		saltAndHash(newData.pass, function(hash) {
			Account.findOneAndUpdate({_id:getObjectId(newData.id)}, {name: newData.name, title: newData.title, pass:hash}, function(err, user) {
				if (err) callback(err, null);

				// we have the updated user returned to us
				console.log('User updated successfully!');
				callback(null, user);
			});
		});
	}
}

exports.updatePassword = function(email, newPass, callback)
{
	saltAndHash(newPass, function(hash) {
		Account.findOneAndUpdate({email:email}, {pass:hash}, function(err, user) {
			if (err) callback(err, null);

				// we have the updated user returned to us
				console.log('User password updated successfully!');
				callback(null, user);
		});
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	Account.findOneAndRemove({ _id: getObjectId(id) }, function(err, user) {
		if (err) throw err;
		console.log('User deleted successfully!');
		callback();
	});
}

exports.getAccountByEmail = function(email, callback)
{
	Account.findOne({email:email}, function(e, o) { callback(o); });
}

exports.getAccountByUserName = function(user, callback)
{
	Account.findOne({user:user}, function(e, o) { callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	Account.find({ $and: [{email:email, pass:passHash}] }, function(e, o) {
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	Account.find(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.delAllRecords = function(callback)
{
	Account.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

var findById = function(id, callback)
{
	Account.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	Account.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}

/* category insertion, update & deletion methods */

exports.addNewCategory = function(newData, callback)
{
	var category = new Category({
		name: newData.name,
		user: newData.user
	});

	category.save(function(err) {
	  if (err) callback(err);
	  console.log('Category saved successfully!');
	  callback();
	});
}

exports.deleteCategory = function(id, callback)
{
	Category.findOneAndRemove({ _id: getObjectId(id) }, function(err, user) {
		if (err) throw err;
		console.log('Category deleted successfully!');
		callback();
	});
}

exports.getAllCategories = function(user, callback)
{
	Category.find({"user": user}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

/* article insertion, update & deletion methods */

exports.addNewArticle = function(newData, callback)
{
	var article = new Article({
		title			: newData.title,
		tags 			: newData.tags,
		category 		: getObjectId(newData.category_id),
		article 		: newData.article,
		article_plain 	: newData.article_plain,
		user 			: newData.user
	});

	article.save(function(err) {
	  if (err) callback(err);
	  console.log('Article saved successfully!');
	  callback();
	});
}

exports.updateArticle = function(newData, callback)
{
	Article.findOneAndUpdate({_id:getObjectId(newData.id)}, {title:newData.title, tags:newData.tags, category:getObjectId(newData.category_id), article:newData.article, article_plain:newData.article_plain}, function(err, user) {
		if (err) callback(err, null);

			// we have the updated user returned to us
			console.log('Article updated successfully!');
			callback(null, user);
	});
}

exports.deleteArticle = function(id, callback)
{
	Article.findOneAndRemove({ _id: getObjectId(id) }, function(err, user) {
		if (err) throw err;
		console.log('Article deleted successfully!');
		callback();
	});
}

exports.getAllArticles = function(user, callback)
{
	Article.find({user: user}, 
		function(e, res) {
			if (e) callback(e)
			else callback(null, res)
	});
}

exports.getAllArticlesTitleByCategory = function(categoryId, callback)
{
	Article.find({category: getObjectId(categoryId)}, {title:1})
	.limit(5)
	.exec(function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.getLatestArticles = function(user, callback)
{
	var a = Article.find({user: user}, {title:1}).sort({'date': -1}).limit(5);
	a.exec(function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.findArticleById = function(id, callback)
{
	Article.findOne({_id: getObjectId(id)},
		function(e, res) {
			if (e) callback(e)
			else callback(null, res)
	});
}

exports.searchArticle = function(search, user, callback) {
	Article.find({user: user, $text: {$search: search}},
		function(e, res) {
			if (e) callback(e)
			else callback(null, res)
	});
}

exports.getArticleCategories = function(user, callback) {
	Article.aggregate(
		{$match: {user : user._id}},
		{$group: {_id: "$category", total:{$sum: 1}}},
		function(e, results) {
			Category.populate( results, { "path": "_id" }, function(err,res) {
				if (err) callback(err);
				callback(null, res);
			});
		}
	);
}

exports.findArticleByIdWCategory = function(id, callback)
{
	var a = Article.findOne({_id: getObjectId(id)});
	a.exec(function(e, results) {
		Category.populate( results, { "path": "category" }, function(err,res) {
			if (err) callback(err);
			callback(null, res);
		});
	});
}

exports.getAllArticlesByCategory = function(categoryId, callback)
{
	Article.find({category: getObjectId(categoryId)},
		function(e, res) {
			if (e) callback(e)
			else callback(null, res)
	});
}

exports.findCategoryNameById = function(id, callback)
{
	Category.findOne({_id: getObjectId(id)}, {name:1},
		function(e, res) {
			if (e) callback(e)
			else callback(null, res)
	});
}

exports.searchArticleWCategory = function(search, user, callback) {
	var a = Article.find({user: user, $text: {$search: search}});
	a.exec(function(e, results) {
		Category.populate( results, { "path": "category" }, function(err,res) {
			if (err) callback(err);
			callback(null, res);
		});
	});
}

/* article like insertion & deletion methods */

exports.addNewArticleLike = function(newData, callback)
{
	var articleLike = new ArticleLike({
		article: getObjectId(newData.article_id),
		req: newData.req,
		like : newData.like
	});

	articleLike.save(function(err) {
	  if (err) callback(err);
	  console.log('Article Like saved successfully!');
	  callback();
	});
}

/* conatct us insertion & retrive methods */

exports.addNewContactUs = function(newData, callback)
{
	var contactUs = new ContactUs({
		name 	: newData.name,
		email 	: newData.email,
		message : newData.message,
		user 	: newData.user
	});

	contactUs.save(function(err) {
	  if (err) callback(err);
	  console.log('Contact us saved successfully!');
	  callback();
	});
}

exports.getAllContactUs = function(user, callback)
{
	ContactUs.find({"user": user}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}
