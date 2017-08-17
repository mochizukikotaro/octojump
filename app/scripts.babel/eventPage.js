///////////////////////////////////
// TODO:
// このファイルのロジックはすべて popup.js と
// かぶっています。import / export でやりたかった...
// でもなんとか 綺麗にしていきたい気持ちです。
//
// popup.js 側の リクエストはそんなに頻繁にいらないので、
// 削除してしまって、リポジトリが追加したら、手動で
// リロードするなどはありか？...検討します
///////////////////////////////////

'use strict'

let full_names = []

chrome.storage.sync.get('token', (v) => {
  const token = v.token
  let last_page = 1
  asyncGetRequest(token).then((xhr) => {
    const link = xhr.getResponseHeader('link')
    last_page =  Number(link.replace(/^.*&page=(\d).*$/, '$1'))
    return last_page
  }).then((last_page) => {
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
      // このタイミングで 毎回 popup へのアクセスで更新しているが、
      // 気にしない :)
      full_names = names

      // NOTE: このタイミングでいけてほしいという
      // 強い気持ちがあります。
      chrome.storage.sync.set({'data': full_names})
    })
  })
})




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
