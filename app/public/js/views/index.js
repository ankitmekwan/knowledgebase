
$(document).ready(function(){

	$('#searchButton').click(function(){
		var search = $('#articleSearch').val();
		window.location.href = '/search/'+search;
	});

	$('#articleSearch').keypress(function(e){
		if(e.which == 13){//Enter key pressed
			$('#searchButton').click();//Trigger search button click event
		}
	});

	$('.fat-heading-abb').each(function(){
		var cat_id = $(this).attr('id');
		 $.ajax({
			type: "POST",
			url: "/load-articles",
			data: {id: cat_id},
			cache: false,
			success: function( obj ){
				var str = '<ul>';
				$.each(obj, function (index, value) {
					str += '<li>';
					str += '<a href="/article/' + value._id + '">';
					str += '<i class="fa fa-file-text-o"></i>';
					str += ' ' + value.title + ' ';
					str += '</a>';
					str += '</li>';
				});
				str += '</ul>';
				$('#'+cat_id+'artList').html(str);

				$('#'+cat_id+'artList').readmore({collapsedHeight:60});
			}
		});
	});

	$.ajax({
		type: "POST",
		url: "/latest-articles",
		cache: false,
		success: function( obj ){
			var str = '<ul>';
			$.each(obj, function (index, value) {
				str += '<li>';
				str += '<a href="/article/' + value._id + '">';
				str += '<i class="fa fa-file-text-o"></i>';
				str += ' ' + value.title + ' ';
				str += '</a>';
				str += '</li>';
			});
			str += '</ul>';
			$('#latestAtrList').html(str);
		}
	});


});