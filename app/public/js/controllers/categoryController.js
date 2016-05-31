
function CategoryController()
{
// bind event listeners to button clicks //
	var that = this;

	$('.mainnav li').removeClass('active');
	$('#catBtn').addClass('active');

	$('#articleSearch').keypress(function(e){
		if(e.which == 13){//Enter key pressed
			var search = $('#articleSearch').val();
			window.location.href = '/search-article/'+search;
		}
	});

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
	$('#category-form-btn1').click(function(){ window.location.href = '/categories';});

}