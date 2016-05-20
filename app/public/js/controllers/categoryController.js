
function CategoryController()
{
// bind event listeners to button clicks //
	var that = this;

// handle user logout //
	$('#btn-logout').click(function(){ that.attemptLogout(); });

	this.attemptLogout = function()
	{
		var that = this;
		$.ajax({
			url: "/logout",
			type: "POST",
			data: {logout : true},
			success: function(data){
	 			window.location.href = '/';
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
	}

	this.deleteCategory = function(categoryId)
	{
		var that = this;
		$.ajax({
			url: '/delete-category',
			type: 'POST',
			data: { id: categoryId},
			success: function(data){
	 			that.showLockedAlert('Category has been deleted.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
	}

	this.showLockedAlert = function(msg){
		$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
		$('.modal-alert .modal-header h4').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function(){window.location.href = '/categories';});
	}

// redirect to homepage when cancel button is clicked //
	$('#category-grid-btn1').click(function(){ window.location.href = '/new-category';});

	$('#category-grid h2').text('Manage Categories');

}