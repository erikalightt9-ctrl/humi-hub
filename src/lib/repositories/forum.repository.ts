import { prisma } from "@/lib/prisma";

export async function getThreadsByCourse(courseId: string) {
  return prisma.forumThread.findMany({
    where: { courseId },
    include: {
      student: { select: { name: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getThreadWithPosts(threadId: string) {
  return prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      student: { select: { id: true, name: true } },
      posts: {
        where: { parentId: null },
        include: {
          student: { select: { id: true, name: true } },
          replies: {
            include: { student: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createThread(
  courseId: string,
  studentId: string,
  title: string,
  content: string
) {
  return prisma.forumThread.create({
    data: {
      courseId,
      studentId,
      title,
      posts: {
        create: { studentId, content },
      },
    },
    include: { posts: true },
  });
}

export async function createReply(
  threadId: string,
  studentId: string,
  content: string,
  parentId?: string
) {
  return prisma.forumPost.create({
    data: { threadId, studentId, content, parentId },
  });
}
