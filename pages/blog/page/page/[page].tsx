import { GetStaticPaths, GetStaticProps } from 'next'
import { allPosts } from '.contentlayer/data'
import Blog, { getBlogProps } from '../index'

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: Array.from({ length: Math.max(1, Math.ceil(allPosts.length / 5)) }, (_, index) => ({
    params: { page: String(index + 1) },
  })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => getBlogProps(Number(params.page))

export default Blog
