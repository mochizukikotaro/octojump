'use strict';

// Click event
document.getElementById('Button').addEventListener(
                                    'click', function(){
  var input = document.getElementById('Input').value
  chrome.storage.sync.set({'code': input});
})

//
document.addEventListener("DOMContentLoaded", function(e) {
  //do work
  console.log('DOMContentLoaded');
  var code
  chrome.storage.sync.get('code', function(v){
    code = v.code
    setCode(code)
  });

  // Set code value to DOM
  var setCode = (code) => {
    document.getElementById('Code').innerText = code
  }

});
