'use strict';

// Repository full_name array
let full_names = []

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

  chrome.storage.sync.get('full_names', (v) => {
    full_names = v.full_names
    if (typeof full_names === 'undefined') {
      return
    }
    updateList(full_names)
  })

  loadToken().then((token) => {
    displaySearch(token)
    updateFullNames(token)
  })

})

const updateFullNames = (token) => {

  // NOTE: nest...
  return new Promise((result, reject) => {

    requestGithub(token).then((names)=>{
      input.value = ''
      chrome.storage.sync.set({'full_names': names})
      full_names = names
      console.log('requestGithub が成功です');
      loading.className = 'disable'
      result(names)
    }, () => {
      console.log('requestGithub が失敗です');
      loading.className = 'disable'
      reject()
    })
  })
}

////////////////////////////////////
// Request GitHub to get repo full_names
////////////////////////////////////
const requestGithub = (token) => {
  return new Promise((resolve, reject) => {
    let last_page = 1
    asyncGetRequestWithPage(token, 1)
      .then((xhr) => {
        const message = JSON.parse(xhr.responseText)['message']

        // Bad credentials
        if (typeof message !== undefined &&
            message === 'Bad credentials') {
          console.log(message);
          reject()
          return
        }

        const link = xhr.getResponseHeader('link')
        const last_page =  Number(link.replace(/^.*&page=(\d).*$/, '$1'))
        let promises = []
        let names = []

        for (let i=1; i<last_page+1; i++) {
          promises.push(asyncGetRequestWithPage(token, i).then((xhr) => {
            const ary = JSON.parse(xhr.responseText)
            for (const v of ary) {
              names.push(v.full_name)
            }
          }));
        }

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
    xhr.setRequestHeader('Authorization', 'token ' + encodeURI(token));
    xhr.onload = () => resolve(xhr)
    xhr.send()
  })
}


// Keyup
let keyup_stack = []
search.addEventListener('keyup', function(){

  // When click Enter key
  if (event.keyCode === 13) {
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
  var reg = new RegExp(buf, 'i');

  findClickedRepos().then((repos) => {
    repos.sort((a,b) => {
      if (a.cnt < b.cnt) return 1
      if (a.cnt > b.cnt) return -1
      return 0
    })
    const repo_list = repos.map(v => v.name)
    const sorted_list = sortRepos(repo_list, full_names)

    const list = sorted_list.filter((d) => {
      return reg.test(d)
    })
    updateList(list)
  })
}

const appendLink = (i, repo) => {
  const li = document.createElement('li')
  li.innerText = repo
  li.dataset.repo = repo
  if (i === 0) {
    li.id = 'focus'
  }
  ul.appendChild(li)
}

const findClickedRepos = () => new Promise((resolve) => {
  let clicked_repos = []
  chrome.storage.sync.get(null, (v) => {
    for (const key in v) {
      if (key.match(/::JumpedCnt/gi)) {
        const repo = key.replace(/::JumpedCnt/gi, '')
        const clicked_repo = { 'name': repo, 'cnt': v[key] }
        clicked_repos.push(clicked_repo)
      }
    }

    resolve(clicked_repos)
  })
})

const sortRepos = (clickedRepos, allRepos) => {
  return Array.from(new Set(clickedRepos.concat(allRepos)))
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
      chrome.tabs.create({ url: 'https://github.com/' + full_name + '/'})
    });
  });
}

const saveClickedReposHistory = (repo) => {
  const key_name = repo + '::JumpedCnt'

  getClickedCnt(key_name).then((cnt) => {
    let obj = {}
    obj[key_name] = cnt === undefined ? 1 : cnt + 1
    chrome.storage.sync.set(obj)
  })
}

const getClickedCnt = (key_name) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (v) => { resolve(v[key_name]) })
  })
}

// Load token
const loadToken = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('token', (v) => {
      const token = v.token
      resolve(token)
    })
  })
}

// Set Token
setBtn.addEventListener('click', () => {
  loading.className = ''
  const new_token = input.value
  updateFullNames(new_token).then((full_names) => {
    chrome.storage.sync.set({'token': new_token})
    displaySearch(new_token)
    updateList(full_names)
  })
})

// Check Token
checkBtn.addEventListener('click', () => {
  loadToken().then((token) => {
    displayToken(token)
  })
})


const updateList = (names) => {
  ul.innerHTML = ''
  for (const [i, repo] of names.entries()) {
    appendLink(i, repo)
  }
  addEventForClick()
}

const displaySearch = (token) => {
  if ((typeof token === 'undefined') ||
              token.trim().length === 0) {
    disableSearch()
  } else {
    enableSearch()
  }
}

const disableSearch = () => {
  info.innerText = 'Set your access token'
  search.className = 'disable'
  checkBtn.className = 'disable'
}

const enableSearch = () => {
  info.innerHTML = ''
  search.className = ''
  checkBtn.className = ''
}

const displayToken = (token) => {
  const v = token || 'token is undefined'
  checkBox.innerText = v
}
