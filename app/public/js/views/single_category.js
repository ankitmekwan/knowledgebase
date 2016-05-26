
$(document).ready(function(){
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

	$('article').readmore({collapsedHeight:40});

});