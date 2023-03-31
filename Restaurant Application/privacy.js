
/** sends updated user settings to the server by using a put request */
function save(){
    let On= document.getElementById("on").checked
    let Off= document.getElementById("off").checked
    let info= {res,On}
    //console.log(`On:${On}\nOff:${Off}`);
    //console.log(res);

    let req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        console.log(req);
        if(this.readyState==4 && req.status==201){
            alert("Your settings have been saved");
        }
    };
    req.open("PUT","/users/"+res._id);
    req.setRequestHeader("Content-Type","application/json");
    req.send(JSON.stringify(info));
}