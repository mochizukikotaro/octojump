// TODO:
// ====
// I wanna move token operation logic to this file
// from popup.js
// ====

'use strict'

let token = '' // この名前わかりづらいかも
const info     = document.getElementById('Info')
const search   = document.getElementById('Search')
const input    = document.getElementById('Input')
const setBtn   = document.getElementById('SetBtn')
const checkBtn = document.getElementById('CheckBtn')
const checkBox = document.getElementById('CheckBox')

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadToken().then((token) => {
    setSearchInput(token)
  })
})

// Set Token
setBtn.addEventListener('click', () => {
  const value = input.value
  chrome.storage.sync.set({'token': value});
  setSearchInput(value)
  input.value = ''
})

// Check Token
checkBtn.addEventListener('click', () => {
  loadToken().then((token) => {
    displayToken(token)
  })
})

const disableSearch = () => {
  info.innerText = 'Set your access token'
  search.className = 'disable'
}

const enableSearch = () => {
  info.innerHTML = ''
  search.className = ''
}

const displayToken = (token) => {
  const v = token || 'token is undefined'
  checkBox.innerText = v
}

const setSearchInput = (token) => {
  if ((typeof token === 'undefined') ||
              token.trim().length === 0) {
    disableSearch()
  } else {
    enableSearch()
  }
}

// Load token
const loadToken = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('token', (v) => {
      token = v.token
      resolve(token)
    })
  })
}
