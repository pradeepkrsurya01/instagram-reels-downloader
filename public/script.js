async function download(){

let url = document.getElementById("url").value;

if(!url.trim()){
  document.getElementById("result").innerHTML="Please paste an Instagram URL";
  return;
}

try {
let response = await fetch("/download",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({url})
});

console.log("Response status:", response.status);
console.log("Response headers:", response.headers);

if(!response.ok){
  document.getElementById("result").innerHTML="Server error: " + response.status + " " + response.statusText;
  return;
}

let data = await response.json();
console.log("Response data:", data);

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

document.getElementById("result").innerHTML="Invalid URL: " + data.message;

}
} catch(error) {
  console.error("Fetch error:", error);
  document.getElementById("result").innerHTML="Error: " + error.message;
}

}
