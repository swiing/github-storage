import getConfig from '../init.js'

export async function read(
  path: string,
  { access_token }: { access_token: string }
) {
  const { domain } = getConfig()
  const url = `https://${domain}/.netlify/git/github/contents/${path}`

  // Github API to retrieve content
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
  return fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.code === 400) {
        // netlifyIdentity.refresh().then(function (token) {
        //   getData(path);
        // });
      } else {
        // base64 decode content
        data.content = atob(data.content)
        // by convention we assume stored data is in json format
        // otherwise, throw an error
        data.content = JSON.parse(data.content)
        return data
      }
    })
}
