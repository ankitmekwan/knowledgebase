
$(document).ready(function(){

	var cc = new CategoryController();

	this.deleteCategory = function(categoryId)
	{
		cc.deleteCategory(categoryId);
	}

});
