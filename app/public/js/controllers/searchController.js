
function SearchController()
{
// bind event listeners to button clicks //
	var that = this;

	$('.mainnav li').removeClass('active');

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

}
