import { pick } from '@contentlayer/client'
// import Subscribe from 'components/subscribe'
import Input from 'components/input'
// Components
import Page from 'components/page'
import PageHeader from 'components/pageheader'
import PostList from 'components/postlist'
import { Section } from 'components/section'
import Badge from 'components/badge'
// Utils
import * as gtag from 'lib/gtag'
import debounce from 'lodash.debounce'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { useCallback, useEffect, useState } from 'react'
import { Search } from 'react-feather'
import PostListSwitch from 'components/postswitch'
import type { Post } from '.contentlayer/types'
import { allPosts } from '.contentlayer/data'
import styles from './index.module.scss'

const PAGE_SIZE = 5

type BlogProps = {
  posts: Post[]
  tagList: string[]
  initialPage: number
}

const Blog = ({ posts, tagList, initialPage }: BlogProps): JSX.Element => {
  const router = useRouter()
  const [currentSearch, setCurrentSearch] = useState('')
  const [hideCoverMode, setHideCoverMode] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const trackSearch = useCallback(
    debounce((value: string) => gtag.search(value), 500),
    [],
  )
  const seoTitle = 'Blog | Nicky Lao'
  const seoDesc = '关于大前端的技术文章，包含且不限于 React、Angular、React Native 等。'
  const filteredPosts = [...posts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(({ title, summary, tags }) => {
      const searchString = `${title.toLowerCase()} ${summary.toLowerCase()} ${tags?.join(' ')}`
      return searchString.includes(currentSearch.toLowerCase())
    })

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const routePage = router.isReady ? Number(router.query.page || initialPage) : initialPage
  const currentPage = Number.isInteger(routePage) && routePage > 0 ? Math.min(routePage, totalPages) : 1
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pageHref = (n: number) => ({
    pathname: n === 1 ? '/blog' : `/blog/page/${n}`,
    query: currentSearch ? { q: currentSearch } : {},
  })

  useEffect(() => {
    if (router.isReady) setCurrentSearch(typeof router.query.q === 'string' ? router.query.q : '')
  }, [router.isReady, router.query.q])

  const handleInputChange = e => {
    const searchString = e.target.value
    if (searchString !== '') {
      trackSearch(searchString) // Save what people are interested in reading
    }
    setCurrentSearch(searchString)
    const query = { ...router.query }
    if (router.pathname.includes('[page]')) query.page = '1'
    if (searchString) query.q = searchString
    else delete query.q
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Page>
      <NextSeo
        title={seoTitle}
        description={seoDesc}
        openGraph={{
          title: seoTitle,
          url: `https://giscafer.com/blog/`,
          description: seoDesc,
          site_name: 'giscafer | Nicky Lao',
        }}
        twitter={{
          cardType: 'summary_large_image',
        }}
      />
      <PageHeader title="Blog" description={seoDesc}>
        <Section>
          <div className={styles.inputWrapper}>
            <Input className={styles.input} value={currentSearch} onChange={handleInputChange} placeholder="搜索文章…" type="search" />
            <Search className={styles.inputIcon} />
          </div>
          <div className={styles.tagWrapper}>
            <Section.Title>Tags</Section.Title>
            <Section.Content>
              <div className={styles.tagList}>
                {tagList.sort().map(tag => (
                  <Link key={tag} href={`/blog/tag/${tag}`}>
                    <Badge className="cursor-pointer">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            </Section.Content>
          </div>
        </Section>
      </PageHeader>
      <PostListSwitch
        checked={hideCoverMode}
        onChange={v => {
          setHideCoverMode(v)
        }}
      />
      <PostList posts={pagedPosts} hideImage={!hideCoverMode} />
      {totalPages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, margin: '32px 0' }}>
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)}>
              <a>Prev</a>
            </Link>
          ) : (
            <span aria-disabled="true">Prev</span>
          )}
          <span>
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)}>
              <a>Next</a>
            </Link>
          ) : (
            <span aria-disabled="true">Next</span>
          )}
        </nav>
      )}
      <button
        type="button"
        aria-label="回到顶部"
        className={`${styles.backToTop} ${showBackToTop ? styles.backToTopVisible : ''}`}
        onClick={handleBackToTop}
      >
        ↑
      </button>
    </Page>
  )
}

export const getBlogProps = (initialPage = 1) => {
  const posts = allPosts.map(post => pick(post, ['slug', 'title', 'summary', 'tags', 'publishedAt', 'image', 'readingTime']))
  const tags = new Set(allPosts.reduce((acc, cur) => acc.concat(cur.tags), []))
  const tagList: string[] = [...tags]
  return {
    props: { posts, tagList, initialPage },
  }
}

export const getStaticProps: GetStaticProps = async () => getBlogProps()

export default Blog
