
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');
var mongoose 	= require("mongoose");

/*
	ESTABLISH DATABASE CONNECTION
*/

var dbName = process.env.DB_NAME || 'node-login';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var dbURL = 'mongodb://'+dbHost+':'+dbPort+'/'+dbName;

mongoose.connect(dbURL);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
	console.log("Database connection succeeded.");
});

var Schema = mongoose.Schema;

var accountSchema = new Schema({
	name 	: { type : String, default : '', trim : true },
	email 	: { type : String, default : '', trim : true },
	user 	: { type : String, default : '', trim : true },
	pass 	: { type : String, default : ''},
	country : { type : String, default : '', trim : true },
	date 	: { type : Date, default : Date.now }
});

accountSchema.path('name').required(true, 'User name cannot be blank');
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
	title 	: { type : String, default : '', trim : true },
	article	: { type : String, default : '', trim : true },
	category: { type : Schema.ObjectId, ref : 'Category' },
	tags: { type: [], get: getTags, set: setTags },
	user	: { type : Schema.ObjectId, ref : 'Account' },
	date 	: { type : Date, default : Date.now }
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

var Account = mongoose.model('Account');
var Category = mongoose.model('Category');
var Article = mongoose.model('Article');

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	Account.findOne({email:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	Account.findOne({email:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
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
		if (o){
			callback('username-taken');
		}	else{
			Account.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){

						var account = new Account({
							name: newData.name,
							email: newData.email,
							user: newData.user,
							pass: hash,
							country: newData.country
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
		Account.findOneAndUpdate({_id:getObjectId(newData.id)}, {name: newData.name, country: newData.country}, function(err, user){
			if (err) callback(err, null);

			// we have the updated user returned to us
			console.log('User updated successfully!');
			callback(null, user);
		});
	} else {
		saltAndHash(newData.pass, function(hash){
			Account.findOneAndUpdate({_id:getObjectId(newData.id)}, {name: newData.name, country: newData.country, pass:hash}, function(err, user){
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
	saltAndHash(newPass, function(hash){
		Account.findOneAndUpdate({email:email}, {pass:hash}, function(err, user){
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
		console.log('User successfully deleted!');
		callback();
	});
}

exports.getAccountByEmail = function(email, callback)
{
	Account.findOne({email:email}, function(e, o){ callback(o); });
}

exports.getAccountByUserName = function(user, callback)
{
	Account.findOne({user:user}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	Account.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
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
		console.log('Category successfully deleted!');
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
		title	: newData.title,
		tags 	: newData.tags,
		category: getObjectId(newData.category_id),
		article : newData.article,
		user 	: newData.user
	});

	article.save(function(err) {
	  if (err) callback(err);
	  console.log('Article saved successfully!');
	  callback();
	});
}

exports.updateArticle = function(newData, callback)
{
	Article.findOneAndUpdate({_id:getObjectId(newData.id)}, {title:newData.title, tags:newData.tags, category:getObjectId(newData.category_id), article:newData.article}, function(err, user){
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
		console.log('Category successfully deleted!');
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

exports.getAllArticlesByCategory = function(categoryId, callback)
{
	Article.find({category: getObjectId(categoryId)}, {title:1},
		function(e, res) {
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
