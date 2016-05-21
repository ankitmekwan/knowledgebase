
$(document).ready(function(){

	var ac = new ArticleController();

	this.deleteArticle = function(articleId)
	{
		ac.deleteArticle(articleId);
	}

});
