/** 课程资料条目 */
export interface CourseItem {
  id: string;
  title: string;
  learned: boolean;
}

/** 考核题目 */
export interface CourseQuiz {
  id: string;
  question: string;
  options: string[];
}

/** 课程培训材料 */
export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

/** 上传材料保存元信息请求 */
export interface CreateCourseMaterialRequest {
  title: string;
  fileUrl: string;
}

/** 管理端考题（含答案） */
export interface AdminCourseQuiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
  sort: number;
}

/** 管理端模块考题组 */
export interface AdminQuizCourse {
  id: string;
  title: string;
  quizzes: AdminCourseQuiz[];
}

/** 考题库列表响应 */
export interface QuizBankResponse {
  items: AdminQuizCourse[];
}

/** 新增考题请求 */
export interface CreateQuizRequest {
  courseId: string;
  question: string;
  options: string[];
  answer: string;
}

/** 课程模块（含学习进度与最新通关结果） */
export interface CourseModule {
  id: string;
  title: string;
  keyPoints: string;
  requirement: string;
  progress: number;
  passed: boolean;
  passedAt: string | null;
  items: CourseItem[];
  quizzes: CourseQuiz[];
  materials: CourseMaterial[];
}

/** 课程中心响应 */
export interface CourseListResponse {
  items: CourseModule[];
}

/** 标记资料学习请求 */
export interface CourseLearningRequest {
  itemId: string;
  learned: boolean;
}

/** 考核提交请求 */
export interface ExamSubmitRequest {
  courseId: string;
  answers: Array<{ quizId: string; option: string }>;
}

/** 考核提交响应 */
export interface ExamSubmitResponse {
  passed: boolean;
  score: number;
}

/** 管理端课程小节 */
export interface AdminCourseItem {
  id: string;
  title: string;
  sort: number;
}

/** 管理端课程列表行（含小节明细，供编辑回显） */
export interface AdminCourseSummary {
  id: string;
  title: string;
  keyPoints: string;
  requirement: string;
  sort: number;
  items: AdminCourseItem[];
  quizCount: number;
  materialCount: number;
}

/** 管理端课程列表响应 */
export interface AdminCourseListResponse {
  items: AdminCourseSummary[];
}

/** 新建课程请求（含课程小节） */
export interface CreateCourseRequest {
  title: string;
  keyPoints: string;
  requirement: string;
  sort?: number;
  items: Array<{ title: string }>;
}

/** 更新课程请求（仅提交明确提供的字段） */
export interface UpdateCourseRequest {
  title?: string;
  keyPoints?: string;
  requirement?: string;
  sort?: number;
}

/** 新增课程小节请求 */
export interface CreateCourseItemRequest {
  title: string;
}
