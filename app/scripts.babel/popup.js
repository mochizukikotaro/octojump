'use strict';

// Repository full_name array
let full_names = []

let token = '' // この名前わかりづらいかも
const info     = document.getElementById('Info')
const loading  = document.getElementById('Loading')
const search   = document.getElementById('Search')
const input    = document.getElementById('Input')
const setBtn   = document.getElementById('SetBtn')
const checkBtn = document.getElementById('CheckBtn')
const checkBox = document.getElementById('CheckBox')
const ul       = document.getElementById('Ul')


// DOMContentLoaded
document.addEventListener('DOMContentLoaded', (e) => {

  // ここで データを入れてしまう作戦
  chrome.storage.sync.get('full_names', (v) => {
    full_names = v.full_names
    ul.innerHTML = ''
    for (const [i, repo] of full_names.entries()) {
      appendLink(i, repo, ul)
    }

    addEventForClick()
  })

  loadToken().then((token) => {
    // input の制御
    setSearchInput(token)
    // 地球のはじまり
    updateFullNames(token)
  })

})

// ここが地球のはじまり
const updateFullNames = (token) => {
  requestGithub(token).then((names)=>{
    setSearchInput(token)
    input.value = ''
    chrome.storage.sync.set({'full_names': names})

    // NOTE: この一行が token.js とことなる。
    full_names = names
    console.log('requestGithub が成功です');
    console.log(full_names);
    // TODO: // ここはちょっと冗長。。。。
    chrome.storage.sync.set({'token': token})
    loading.className = 'disable'
  }, () => {
    console.log('requestGithub が失敗です');
    loading.className = 'disable'
  })
}

////////////////////////////////////
// ここが一番重要で重い処理
// token セット時 storage に入れちゃう作戦
////////////////////////////////////
const requestGithub = (token) => {
  return new Promise((resolve, reject) => {
    let last_page = 1
    asyncGetRequestWithPage(token, 1)
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

const asyncGetRequestWithPage = (token, page) => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()
    const url = 'https://api.github.com/user/repos?per_page=100'
                + '&page=' + String(page)
    xhr.open('GET', url)
    xhr.setRequestHeader('Authorization', 'token ' + token);
    xhr.onload = () => resolve(xhr)
    xhr.send()
  })
}


// Keyup
let keyup_stack = []
search.addEventListener('keyup', function(){

  // When click Enter key
  if (event.keyCode === 13) { // 知見
    const focus = document.getElementById('focus')
    document.getElementById('focus').click();

  // Down
  } else if (event.keyCode === 40) {
    const focus = document.getElementById('focus')
    if (!focus.nextElementSibling) { return }
    focus.id = ''
    focus.nextElementSibling.id = 'focus'

  // Up
  } else if (event.keyCode === 38) {
    const focus = document.getElementById('focus')
    if (!focus.previousElementSibling) { return }
    focus.id = ''
    focus.previousElementSibling.id = 'focus'

  // Other key
  } else {
    keyup_stack.push(1)
    setTimeout(function(){
      keyup_stack.pop()
      if (keyup_stack.length === 0) {
        searchRepositories(this.value)
      }
    }.bind(this), 250)
  }

})

const searchRepositories = (word) => {
  var buf = word.replace(/\//, '.*\/.*')
                .replace(/\s/, '.*')
                .replace(/(.*)/, '.*$1.*')
  var reg = new RegExp(buf);
  const list = full_names.filter((d) => {
    return reg.test(d)
  })
  ul.innerHTML = ''
  for (const [i, repo] of list.entries()) {
    appendLink(i, repo, ul)
  }
  addEventForClick()
}

const appendLink = (i, repo, ul) => {
  const li = document.createElement('li')
  li.innerText = repo
  li.dataset.repo = repo // 知見
  if (i === 0) {
    li.id = 'focus' // 知見
  }

  ul.appendChild(li)
}

const addEventForClick = () => {
  const repos = document.querySelectorAll('[data-repo]')
  Array.from(repos).forEach(repo => {
    repo.addEventListener('click', function(event) {
      // event.preventDefault();
      console.log(this.dataset.repo);
      const full_name = this.dataset.repo

      // よくクリックされるリポジトリを上位表示するためクリック数を保存
      saveClickedReposHistory(full_name)

      // NOTE: 新しいタブが開く
      //chrome.tabs.create({ url: 'https://github.com/' + full_name + '/'})
    });
  });
}

const saveClickedReposHistory = (repo) => {
  const key_name = repo + '::JumpedCnt'
  const clicked_count = getClickedCnt(key_name)

  clicked_count.then((cnt) => {
    let obj = {}
    if(cnt === 'undefined') {
      obj[key_name] = 1
      chrome.storage.sync.set(obj)
    } else {
      obj[key_name] = cnt + 1
      chrome.storage.sync.set(obj)
    }
  })
}

const getClickedCnt = (key_name) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key_name, (v) => {
      key_name ? resolve(v[key_name]) : reject(v);
    })
  })
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


// Set Token
setBtn.addEventListener('click', () => {
  loading.className = ''
  const token = input.value
  // 地球のはじまり
  updateFullNames(token)
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
