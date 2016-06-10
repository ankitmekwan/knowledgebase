
$(document).ready(function(){

    var sc = new SearchController();

	$('#searchButton').click(function(){
        var search = $('#articleSearch').val();
        window.location.href = '/search-article/'+search;
    });

    $('#articleSearch').keypress(function(e){
        if(e.which == 13){//Enter key pressed
            $('#searchButton').click();//Trigger search button click event
        }
    });

});