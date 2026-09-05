import type { DefaultTheme, SiteData } from 'vitepress'
import type { Ref } from 'vue'
import { withBase } from 'vitepress'

type SidebarItem = DefaultTheme.SidebarItem
export function containsActiveLink(
  path: string,
  hash: string,
  items: SidebarItem | SidebarItem[],
  skipHashCheck = false,
  site: Ref<SiteData>,
): boolean {
  if (Array.isArray(items)) {
    return items.some(item => containsActiveLink(path, hash, item, skipHashCheck, site))
  }
  if (items.link && isActive(path, hash, items.link, false, skipHashCheck, site)) {
    return true
  }
  if (items.items) {
    return containsActiveLink(path, hash, items.items, skipHashCheck, site)
  }
  return false
}
const HASH_WITHOUT_FRAGMENT_RE = /#.*?(?=:~:|$)/
export function isActive(
  currentPath: string,
  currentHash: string,
  matchPath: string,
  asRegex: boolean = false,
  skipHashCheck: boolean = false,
  site: Ref<SiteData>,
): boolean {
  currentPath = normalizeLink(`/${currentPath}`, site)

  if (asRegex) {
    return new RegExp(matchPath).test(currentPath)
  }

  if (normalizeLink(matchPath, site) !== currentPath) {
    return false
  }

  if (skipHashCheck) {
    return true
  }

  const hashMatch = matchPath.match(HASH_WITHOUT_FRAGMENT_RE)

  if (hashMatch) {
    return currentHash === hashMatch[0]
  }

  return true
}

export const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i
export function isExternal(path: string): boolean {
  return EXTERNAL_URL_RE.test(path)
}
export function normalizeLink(url: string, site: Ref<SiteData>): string {
  const { pathname, search, hash, protocol } = new URL(url, 'http://a.com')

  if (
    isExternal(url)
    || url.startsWith('#')
    || !protocol.startsWith('http')
    || !treatAsHtml(pathname)
  ) {
    return url
  }

  let normalizedPath
    = pathname.endsWith('/') || pathname.endsWith('.html')
      ? url
      : url.replace(
          // eslint-disable-next-line regexp/optimal-quantifier-concatenation
          /(?:(^\.+)\/)?.*$/,
          `$1${pathname.replace(
            /(\.md)?$/,
            site.value.cleanUrls ? '' : '.html',
          )}${search}${hash}`,
        )

  if (isRelativeBase(site.value.base) && !site.value.cleanUrls) {
    const pathPart = normalizedPath.replace(/[?#].*$/, '')
    if (pathPart.endsWith('/')) {
      normalizedPath
        = `${pathPart}index.html${normalizedPath.slice(pathPart.length)}`
    }
  }

  return withBase(normalizedPath)
}
export function isRelativeBase(base: string): boolean {
  return base === './'
}
const KNOWN_EXTENSIONS = new Set()
export function treatAsHtml(filename: string): boolean {
  if (KNOWN_EXTENSIONS.size === 0) {
    const extraExts
      // eslint-disable-next-line node/prefer-global/process
      = (globalThis as any).process?.env?.VITE_EXTRA_EXTENSIONS
        || (import.meta as any).env?.VITE_EXTRA_EXTENSIONS
        || ''

    // md, html? are intentionally omitted
    ;(
      `3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,crl,css,csv,dll,`
      + `doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,`
      + `man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,`
      + `opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,`
      + `tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,`
      + `yaml,yml,zip${
        extraExts && typeof extraExts === 'string' ? `,${extraExts}` : ''}`
    )
      .split(',')
      .forEach(ext => KNOWN_EXTENSIONS.add(ext))
  }

  const ext = filename.split('.').pop()

  return ext == null || !KNOWN_EXTENSIONS.has(ext.toLowerCase())
}
export function isLinkExternal(
  href?: string,
  target?: string,
  external?: boolean,
): boolean {
  if (external !== undefined) {
    return external
  }

  return (!!href && isExternal(href)) || target === '_blank'
}

export function ensureStartingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function getSidebar(
  _sidebar: DefaultTheme.Sidebar | undefined,
  path: string,
): SidebarItem[] {
  if (Array.isArray(_sidebar))
    return addBase(_sidebar)
  if (_sidebar == null)
    return []

  path = ensureStartingSlash(path)

  const dir = Object.keys(_sidebar)
    .sort((a, b) => {
      return b.split('/').length - a.split('/').length
    })
    .find((dir) => {
      // make sure the multi sidebar key starts with slash too
      return path.startsWith(ensureStartingSlash(dir))
    })

  const sidebar = dir ? (_sidebar[dir] ?? []) : []
  return Array.isArray(sidebar)
    ? addBase(sidebar)
    : addBase(sidebar.items, sidebar.base)
}

/**
 * Get or generate sidebar group from the given sidebar items.
 */
export function getSidebarGroups(sidebar: SidebarItem[]): SidebarItem[] {
  const groups: SidebarItem[] = []

  let lastGroupIndex: number = 0

  for (const item of sidebar) {
    if (item.items) {
      lastGroupIndex = groups.push(item)
      continue
    }

    let group = groups[lastGroupIndex]

    if (!group) {
      group = { items: [] }
      groups.push(group)
    }

    group.items?.push(item)
  }

  return groups
}
function addBase(items: SidebarItem[], _base?: string): SidebarItem[] {
  return [...items].map((_item) => {
    const item = { ..._item }
    const base = item.base || _base
    if (base && item.link && !isExternal(item.link))
      item.link = base + item.link.replace(/^\//, base.endsWith('/') ? '' : '/')
    if (item.items)
      item.items = addBase(item.items, base)
    return item
  })
}
