import GoTrue from 'gotrue-js'

let domain = ''
let username = ''
let password = ''

let auth: GoTrue | undefined = undefined

export function init(cfg: {
  username: string
  password: string
  domain: string
}) {
  domain = cfg.domain
  username = cfg.username
  password = cfg.password
  auth = new GoTrue({
    APIUrl: `https://${domain}/.netlify/identity`,
    audience: '',
    setCookie: false,
  })
}

export default function getConfig() {
  return {
    domain,
    username,
    password,
    auth: auth as GoTrue | undefined,
  }
}
