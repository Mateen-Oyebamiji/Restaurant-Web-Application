
/** sends a post request to login the user */
function login(){
    let username= document.getElementById("username").value;
    let password=document.getElementById("password").value;
    let info = {username,password};
    //post(info);

    let req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        console.log(req);
        if( this.readyState==4 && req.status==200){
            alert("Successfully logged in\n Welcome to your account\n");
            window.location = "/";
            //alert("Successfully logged in\n Welcome to your account\n");
        }
        if(this.readyState==4 && req.status == 401){
            alert("Username or password is in correct, please try again");
        }
    };
    req.open("POST","/login");
    req.setRequestHeader("Content-Type","application/json");
    req.send(JSON.stringify(info));


}

 