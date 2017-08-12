'use strict';


// Click event
document.getElementById('Button').addEventListener(
                                    'click', function(){
  var input = document.getElementById('Input').value
  chrome.storage.sync.set({'token': input});
})


// DOMContentLoaded
document.addEventListener("DOMContentLoaded", function(e) {

  var token
  chrome.storage.sync.get('token', function(v){
    token = v.token
    setCode(token)
    getRepos(token)
  });

  // Set code value to DOM
  var setCode = (code) => {
    document.getElementById('Code').innerText = code
  }

  var getRepos = (token) => {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://api.github.com/user/repos?per_page=100')
    xhr.setRequestHeader('Authorization', 'token ' + token);
    xhr.onload = function(){

      // 知見
      const link = xhr.getResponseHeader("link")

      // 知見
      const last_page =  Number(link.replace(/^.*&page=(\d).*$/, '$1'))
      console.log(link);
      console.log(last_page);


      var ary = JSON.parse(xhr.responseText)
      console.log(ary.length);
      console.log(xhr.responseHeader);
      for (const v of ary) {
        //console.log(v.full_name);
      }
    }
    xhr.send()
  }

});
