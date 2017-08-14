// TODO:
// ====
// I wanna move token operation logic to this file
// from popup.js
// ====

'use strict'

const checkToken = document.getElementById('CheckToken')

let token = ''

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('token', (v) => {
    token = v.token
  })
})

checkToken.addEventListener('click', () => {
  console.log(token);
  setCode(token)
})

// Set code value to DOM
var setCode = (code) => {
  document.getElementById('Code').innerText = code
}
