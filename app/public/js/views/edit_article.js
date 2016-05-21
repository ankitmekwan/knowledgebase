
$(document).ready(function(){

	var ac = new ArticleController();
	var av = new ArticleValidator();

	$('#article-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return av.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			if (e.responseText == 'name-taken'){
			    av.showInvalidName();
			}
		}
	});
	$('#name-tf').focus();

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('Article Updated!');
	$('.modal-alert .modal-body p').html('Article has been updated.</br>Click OK to return to the list article.');
	$('.modal-alert button').click(function(){window.location.href = '/articles';});

// customize the article signup form //
	
	$('#article-form h2').text('Edit Article');
	$('#article-form-btn1').html('Cancel');
	$('#article-form-btn2').html('Submit');
	
});
