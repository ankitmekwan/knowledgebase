
function ArticleController()
{
// bind event listeners to button clicks //
	var that = this;

	$('.mainnav li').removeClass('active');
	$('#artBtn').addClass('active');

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

	this.deleteArticle = function(articleId)
	{
		var that = this;
		$.ajax({
			url: '/delete-article',
			type: 'POST',
			data: { id: articleId},
			success: function(data){
				that.showLockedAlert('Article has been deleted.');
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
		$('.modal-alert button').click(function(){window.location.href = '/articles';});
	}

// redirect to homepage when cancel button is clicked //
	$('#article-form-btn1').click(function(){ window.location.href = '/articles';});

}