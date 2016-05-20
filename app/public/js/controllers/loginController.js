
function LoginController()
{
// bind event listeners to button clicks //
	$('#retrieve-password-submit').click(function(){ $('#get-credentials-form').submit();});
	$('#login #forgot-password').click(function(){ 
		$('#cancel').html('Cancel');
		$('#retrieve-password-submit').show();
		$('#get-credentials').modal('show');
	});

// automatically toggle focus between the email modal window and the login form //
	$('#get-credentials').on('shown.bs.modal', function(){ $('#email-tf').focus(); });
	$('#get-credentials').on('hidden.bs.modal', function(){ $('#user-tf').focus(); });
}