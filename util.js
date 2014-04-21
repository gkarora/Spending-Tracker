$(document).on("pageshow", "#chart",function(){
    loadHeaders(1);
    displayChart();
});

$(document).on("pageshow", "#dataEntry",function(){
  $("input").empty();
  insertDefaultDate();
});

$(document).on("taphold", "li.expense",function(){
    //stop tap event from firing    
    $(this).off("tap");
    //add class for new mode
    $("li.expense").addClass("getSum");
    $(this).addClass('selected');
    $(".getSum").off("taphold");
    //change header
    loadHeaders(2);
    //bind tap function for when the delMode class exists
    setTimeout(function(){
        $(".getSum").on("tap", function(e){
            $(this).toggleClass('selected');           
            //check to exit delMode
            setSum();
            if (!($('.getSum').hasClass('selected'))){
                rmGetSum();
            }   
           return false;     
        });
    }, 500);
});

$(document).on("tap","#undo", function(){
    $(".getSum").removeClass("selected");
    rmGetSum();
});

$(document).on("tap", "li.expense", function(){
  if (!$(this).hasClass('getSum')){
    $(document).on("pageshow", "#receipt", function(){
      $(".info").empty();
      $("#user").empty();
      $("#memo").append(memo);
      $("#amount").append(amount);
      $("#user").append(user);
      $("#date").append(day);
      $("#del").data({'idr':idr});
    });        
    memo = $(this).find('h2').html();
    amount = $(this).find('p.amount').html();
    user = $(this).find('p.user').html()
    idr = $(this).data('idr');
    day = $(this).data('day');
    $.mobile.changePage("#receipt");

  }
});

$(document).on("tap", "#del", function(){
    idr = $(this).data("idr")
    $.ajax({
        url:"/datachart.html",
        type:"DELETE",
        data:{idr: idr},
        success: function() {    
                    $("#delConfirm").popup("close");
                    location.hash="";    
                    location.reload(true);
                },
        failure: function() {console.log("NO");},
    });


});

$(document).on("tap", "#cancel", function(){
    $("#delConfirm").popup("close");
});


function setSum(){
    selected = $("#spendingList").find(".selected .amount");
    sum = 0;
    for (i=0; i<selected.length; i++){
        selected[i] = parseFloat(selected[i].innerHTML.slice(1));
        sum+=selected[i];
    }
    $("#sum").text(sum);
}

function rmGetSum(){
    loadHeaders(1);
    $(".getSum").off("tap"); 
    $("li.expense").removeClass("getSum");  
}

function loadHeaders(num) {
    $("#headerDefault").remove()
    $.get("header.html", function(data){
        headers=data.split('<!--split-->');
        if (num==1){
            $("#headerSum").remove();
            $("#chart").prepend(headers[0]).trigger("pagecreate");
        }
        else if (num==2){
            $("#chart").prepend(headers[1]).trigger("pagecreate");
            setSum();
        }
    });
}

function displayChart(){
$("ul").empty();
$.get("/data.txt", function(data){
    lines = data.split("\n");
    prevDate="";
    $.each(lines, function(n, elem) {
      arr = elem.split(', ');
      if (arr[1] != undefined){
        idr = arr[0];		    
        day = arr[1];
        amount = arr[2];
        memo = arr[3];
        user = arr[4];
        if (day!= prevDate){
            prevDate=day;
            today=getToday();
            if (day==today[0]+'-'+today[1]+'-'+today[2])
                $("ul").append("<li data-role='list-divider'>Today</li>");
            else if (day==today[0]+'-'+today[1]+'-'+(today[2]-1))
                $("ul").append("<li data-role='list-divider'>Yesterday</li>");
            else {
                 darr = day.split('-');
                 spday = new Date (darr[0], parseInt(darr[1])-1, darr[2]);
                 $("ul").append("<li data-role='list-divider'>"
                    + spday.toDateString()+"</li>");
            }
        }
        $("ul").append("<li class='expense'><h2>"+memo+
            "</h2><p class='ui-li-aside ui-li-desc amount'>$"
            +amount+"</p><p class='ui-li-desc user'>"+user+"</p></li>");
        $('.expense').last().data({"idr":idr, "day":day});

      }
    });
        $("ul").listview('refresh');
 });
}

function getToday(){	
	date = new Date();
	d = date.getDate();
	m = date.getMonth()+1;
	y = date.getFullYear();

  if(m < 10) 
    m = "0" + m;
  if(d < 10) 
    d = "0" + d;
  
  return [y,m,d];
}

function insertDefaultDate(){
  today=getToday();
  $("#date").val(today[0]+'-'+today[1]+'-'+today[2]);
}
