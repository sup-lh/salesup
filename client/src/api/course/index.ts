import { logger } from '@/lib/logger';
import { axiosForBackend } from '@/lib/http';
import type {
  AdminCourseListResponse,
  CourseListResponse,
  CourseLearningRequest,
  CreateCourseItemRequest,
  CreateCourseMaterialRequest,
  CreateCourseRequest,
  CreateQuizRequest,
  ExamSubmitRequest,
  ExamSubmitResponse,
  QuizBankResponse,
  UpdateCourseRequest,
} from '@shared/api.interface';
import { ensureNotForbidden } from '@client/src/utils/api-error';

/** 获取课程与考核中心五模块数据（growth_admin 可传 newcomerId 查任意新人） */
export async function getCourses(
  newcomerId?: string,
): Promise<CourseListResponse> {
  try {
    const response = await axiosForBackend({
      url: newcomerId ? `/api/courses/admin/${newcomerId}` : '/api/courses',
      method: 'GET',
    });
    return response.data as CourseListResponse;
  } catch (error) {
    logger.error('获取课程数据失败', JSON.stringify(error));
    throw error;
  }
}

/** 标记资料条目已学/未学 */
export async function markLearning(
  payload: CourseLearningRequest,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: '/api/course-learnings',
      method: 'POST',
      data: payload,
    });
    return response.data as { success: boolean };
  } catch (error) {
    logger.error('标记学习状态失败', JSON.stringify(error));
    throw error;
  }
}

/** 提交通关考核，返回判分结果 */
export async function submitExam(
  payload: ExamSubmitRequest,
): Promise<ExamSubmitResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/exam-results',
      method: 'POST',
      data: payload,
    });
    return response.data as ExamSubmitResponse;
  } catch (error) {
    logger.error('提交考核失败', JSON.stringify(error));
    throw error;
  }
}

/** 保存上传材料的元信息（文件本体已由 dataloom 上传） */
export async function createCourseMaterial(
  courseId: string,
  payload: CreateCourseMaterialRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/${courseId}/materials`,
      method: 'POST',
      data: payload,
    });
    return response.data as { id: string };
  } catch (error) {
    logger.error('保存材料元信息失败', JSON.stringify(error));
    throw error;
  }
}

/** 删除课程材料 */
export async function deleteCourseMaterial(
  materialId: string,
): Promise<void> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/materials/${materialId}`,
      method: 'DELETE',
    });
    if (response.status === 403) {
      throw new Error('无操作权限');
    }
  } catch (error) {
    logger.error('删除课程材料失败', JSON.stringify(error));
    throw error;
  }
}

/** 获取考题库（含答案，仅管理员） */
export async function getQuizBank(): Promise<QuizBankResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/quizzes',
      method: 'GET',
    });
    return response.data as QuizBankResponse;
  } catch (error) {
    logger.error('获取考题库失败', JSON.stringify(error));
    throw error;
  }
}

/** 新增考题（仅管理员） */
export async function createQuiz(
  payload: CreateQuizRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend({
      url: '/api/quizzes',
      method: 'POST',
      data: payload,
    });
    return response.data as { id: string };
  } catch (error) {
    logger.error('新增考题失败', JSON.stringify(error));
    throw error;
  }
}

/** 删除考题（仅管理员） */
export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    const response = await axiosForBackend({
      url: `/api/quizzes/${quizId}`,
      method: 'DELETE',
    });
    if (response.status === 403) {
      throw new Error('无操作权限');
    }
  } catch (error) {
    logger.error('删除考题失败', JSON.stringify(error));
    throw error;
  }
}

/** 获取管理端课程列表（含小节明细，供编辑回显） */
export async function fetchAdminCourses(): Promise<AdminCourseListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/courses/admin',
      method: 'GET',
    });
    ensureNotForbidden(response);
    return response.data as AdminCourseListResponse;
  } catch (error) {
    logger.error('获取管理端课程列表失败', JSON.stringify(error));
    throw error;
  }
}

/** 新建课程（含课程小节，仅管理员） */
export async function createAdminCourse(
  payload: CreateCourseRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend({
      url: '/api/courses/admin',
      method: 'POST',
      data: payload,
    });
    ensureNotForbidden(response);
    return response.data as { id: string };
  } catch (error) {
    logger.error('新建课程失败', JSON.stringify(error));
    throw error;
  }
}

/** 更新课程基础字段（仅提交明确提供的字段，仅管理员） */
export async function updateAdminCourse(
  courseId: string,
  payload: UpdateCourseRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/admin/${courseId}`,
      method: 'PATCH',
      data: payload,
    });
    ensureNotForbidden(response);
    return response.data as { id: string };
  } catch (error) {
    logger.error('更新课程失败', JSON.stringify(error));
    throw error;
  }
}

/** 删除课程（连带删除小节/资料/考题/学习与考试记录，仅管理员） */
export async function deleteAdminCourse(
  courseId: string,
): Promise<void> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/admin/${courseId}`,
      method: 'DELETE',
    });
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('删除课程失败', JSON.stringify(error));
    throw error;
  }
}

/** 新增课程小节（仅管理员） */
export async function createAdminCourseItem(
  courseId: string,
  payload: CreateCourseItemRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/admin/${courseId}/items`,
      method: 'POST',
      data: payload,
    });
    ensureNotForbidden(response);
    return response.data as { id: string };
  } catch (error) {
    logger.error('新增课程小节失败', JSON.stringify(error));
    throw error;
  }
}

/** 删除课程小节（仅管理员） */
export async function deleteAdminCourseItem(
  itemId: string,
): Promise<void> {
  try {
    const response = await axiosForBackend({
      url: `/api/courses/admin/items/${itemId}`,
      method: 'DELETE',
    });
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('删除课程小节失败', JSON.stringify(error));
    throw error;
  }
}
