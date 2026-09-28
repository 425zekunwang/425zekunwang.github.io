import type { CollectionEntry } from "astro:content";
import { BLOG_PAGE_SIZE } from "@config";
import type { Post } from "@interfaces/data";
import {
  getAllPosts,
  getPostsWithStats,
  sortPostsByDate,
  sortPostsByPinAndDate,
} from "./blogUtils";

async function getTaxonomyPaginationPaths({
  paginate,
  key,
}: {
  paginate: any;
  key: "tags" | "categories";
}) {
  const allPosts = await getAllPosts();
  const sortedPosts = sortPostsByDate(allPosts);
  const values = [
    ...new Set(
      sortedPosts.flatMap(
        (blog: CollectionEntry<"blog">) => blog.data[key] || [],
      ),
    ),
  ];
  const postsWithStats = await getPostsWithStats(sortedPosts);

  return values.flatMap((value) => {
    const filteredPosts = postsWithStats.filter((blog: Post) =>
      blog.data[key]?.includes(value),
    );
    return paginate(filteredPosts, {
      /*
       * 这里不要预先 encodeURIComponent：Astro 会拿 params 去生成输出目录，
       * 传入已编码的字符串会被二次编码，于是中文分类/标签会报
       * NoMatchingStaticPathFound（主题自带的示例全是英文分类，所以一直没暴露）。
       * 目录用原值生成，链接侧统一 encodeURIComponent —— 见 PostFilter.astro 与 tags.astro。
       */
      params: key === "tags" ? { tag: value } : { category: value },
      pageSize: BLOG_PAGE_SIZE,
    });
  });
}

/**
 * 获取主博客页面的分页数据
 * @param paginate 分页函数
 * @returns 分页路径数据
 */
export async function getMainBlogPaginationPaths({
  paginate,
}: {
  paginate: any;
}) {
  const allPosts = await getAllPosts();
  const sortedPosts = sortPostsByPinAndDate(allPosts);
  const postsWithStats = await getPostsWithStats(sortedPosts);

  return paginate(postsWithStats, { pageSize: BLOG_PAGE_SIZE });
}

/**
 * 获取特定标签的分页数据
 * @param paginate 分页函数
 * @returns 分页路径数据
 */
export async function getTagPaginationPaths({ paginate }: { paginate: any }) {
  return await getTaxonomyPaginationPaths({ paginate, key: "tags" });
}

/**
 * 获取特定分类的分页数据
 * @param paginate 分页函数
 * @returns 分页路径数据
 */
export async function getCategoryPaginationPaths({
  paginate,
}: {
  paginate: any;
}) {
  return await getTaxonomyPaginationPaths({ paginate, key: "categories" });
}
