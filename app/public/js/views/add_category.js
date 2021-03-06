
$(document).ready(function(){

	var cc = new CategoryController();
	var cv = new CategoryValidator();

	$('#category-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			return cv.validateForm();
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') $('.modal-alert').modal('show');
		},
		error : function(e){
			console.log(e);
		}
	});
	$('#name-tf').focus();

	$('.modal-alert').modal({ show:false, keyboard : false, backdrop : 'static' });
	$('.modal-alert .modal-header h4').text('Category Created!');
	$('.modal-alert .modal-body p').html('New category has been created.</br>Click OK to return to the list category.');
	$('.modal-alert button').click(function(){window.location.href = '/categories';});

});
