$(document).ready(function(){

$('#game').click(function() {



  if(_win == 1){

    //Getting the variable's value from a link
    var loginBox = $(this).attr('class');

    //Fade in the Popup
    $(loginBox).fadeIn(300);

    //Set the center alignment padding + border see css style
    var popMargTop = ($(loginBox).height() + 24) / 2;
    var popMargLeft = ($(loginBox).width() + 24) / 2;

    $(loginBox).css({
      'margin-top' : -popMargTop,
      'margin-left' : -popMargLeft
    });

    $('#mask').fadeIn(10);


    return false;
  }
});
});
