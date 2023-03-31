
/** Takes user information and sends a post request to register the user */
function register(){
    let username=document.getElementById("username").value;
    let password=document.getElementById("password").value;
    let info = {username,password};

    let req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        console.log(req);
        if( this.readyState==4 && req.status==200){
            alert("Successfully  registered\n Welcome to your account\n");
            window.location = "/profile";
            //alert("Successfully logged in\n Welcome to your account\n");
        }
        if(this.readyState==4 && req.status == 401){
            alert("There is already a user with this username");
        }
    };
    req.open("POST","/register");
    req.setRequestHeader("Content-Type","application/json");
    req.send(JSON.stringify(info));
}