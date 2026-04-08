async function download(){

let url = document.getElementById("url").value;

let response = await fetch("/download",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({url})
});

let data = await response.json();

if(data.status==="success"){

document.getElementById("result").innerHTML=
`
<video controls src="${data.video}"></video>
<br>
<a href="${data.video}" download>
<button>Download Video</button>
</a>
`;

}else{

document.getElementById("result").innerHTML="Invalid URL";

}

}
