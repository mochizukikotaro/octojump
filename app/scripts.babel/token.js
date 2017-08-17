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
  const token = input.value
  requestGithub(token).then((full_names)=>{
    setSearchInput(token)
    input.value = ''
    chrome.storage.sync.set({'full_names': full_names})
    console.log('requestGithub が成功');
    console.log(full_names);
    chrome.storage.sync.set({'token': token});
  }, () => {
    console.log('requestGithub が失敗');
  })

})


////////////////////////////////////
// ここが一番重要で重い処理
// token セット時 storage に入れちゃう作戦
////////////////////////////////////
const requestGithub = (token) => {
  return new Promise((resolve, reject) => {
    let last_page = 1
    asyncGetRequest(token)
      .then((xhr) => {
        const message = JSON.parse(xhr.responseText)['message']

        ////////////////////
        // token が正しくない場合！！！　これがやりたい
        if (typeof message !== undefined &&
            message === 'Bad credentials') {
          console.log(message);
          reject()
          return
        }
        ////////////////////


        const link = xhr.getResponseHeader('link')
        const last_page =  Number(link.replace(/^.*&page=(\d).*$/, '$1'))
        let promises = []
        let names = []
        for (let i=1; i<last_page+1; i++) {

          // It's not correct order...
          promises.push(asyncGetRequestWithPage(token, i).then((xhr) => {
            const ary = JSON.parse(xhr.responseText)
            for (const v of ary) {
              names.push(v.full_name)
            }
          }));
        } // end for
        Promise.all(promises).then(() => {
          full_names = names
          resolve(full_names)
        })
    })
  })
}

// Oh God, Promise :)
const asyncGetRequest = (token) => {
return new Promise((resolve, reject) => {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'https://api.github.com/user/repos?per_page=100')
  xhr.setRequestHeader('Authorization', 'token ' + token);
  xhr.onload = () => resolve(xhr)
  xhr.send()
})
}

const asyncGetRequestWithPage = (token, page) => {
return new Promise((resolve, reject) => {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'https://api.github.com/user/repos?per_page=100' + '&page=' + String(page))
  xhr.setRequestHeader('Authorization', 'token ' + token);
  xhr.onload = () => resolve(xhr)
  xhr.send()
})
}

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
