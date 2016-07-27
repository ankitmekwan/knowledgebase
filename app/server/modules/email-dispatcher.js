
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect(
{
	host 	    : process.env.EMAIL_HOST || 'smtp.gmail.com',
	user 	    : process.env.EMAIL_USER || 'bunty5322@gmail.com',
	password    : process.env.EMAIL_PASS || 'abel@123',
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'knowledge-base <do-not-reply@knowledge-base.com>',
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.composeEmail = function(o)
{
	var link = 'http://knowledge-base.site/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "Your username is <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Click here to reset your password</a><br><br>";
		html += "Cheers,<br>";
	return  [{data:html, alternative:true}];
}