import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { CourseService } from './course.service';
import type {
  CourseLearningRequest,
  CreateCourseMaterialRequest,
  CreateCourseItemRequest,
  CreateCourseRequest,
  CreateQuizRequest,
  ExamSubmitRequest,
  UpdateCourseRequest,
} from '@shared/api.interface';

@Controller('api')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Can('read', 'Course')
  @Get('courses')
  async getCourses(@Req() req: Request) {
    return this.courseService.getCourses(req.userContext?.userId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Get('courses/admin')
  async listAdminCourses() {
    return this.courseService.listAdminCourses();
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('courses/admin')
  async createCourse(@Body() dto: CreateCourseRequest) {
    return this.courseService.createCourse(dto);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch('courses/admin/:courseId')
  async updateCourse(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseRequest,
  ) {
    const operatorId: string = req.userContext?.userId ?? '';
    return this.courseService.updateCourse(courseId, dto, operatorId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete('courses/admin/:courseId')
  async deleteCourse(@Param('courseId') courseId: string) {
    await this.courseService.deleteCourse(courseId);
    return { success: true };
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('courses/admin/:courseId/items')
  async createCourseItem(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseItemRequest,
  ) {
    return this.courseService.createCourseItem(courseId, dto);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete('courses/admin/items/:itemId')
  async deleteCourseItem(@Param('itemId') itemId: string) {
    await this.courseService.deleteCourseItem(itemId);
    return { success: true };
  }

  @Can('manage', 'Newcomer')
  @Get('courses/admin/:newcomerId')
  async getCoursesByNewcomerId(
    @Req() req: Request,
    @Param('newcomerId') newcomerId: string,
  ) {
    return this.courseService.getCourses(
      req.userContext?.userId,
      newcomerId,
    );
  }

  @Can('create', 'CourseLearning')
  @NeedLogin()
  @Post('course-learnings')
  async markLearning(@Req() req: Request, @Body() body: CourseLearningRequest) {
    const { userId } = req.userContext;
    return this.courseService.markLearning(userId, body.itemId, body.learned);
  }

  @Can('create', 'ExamResult')
  @NeedLogin()
  @Post('exam-results')
  async submitExam(@Req() req: Request, @Body() body: ExamSubmitRequest) {
    const { userId } = req.userContext;
    return this.courseService.submitExam(userId, body.courseId, body.answers);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('courses/:courseId/materials')
  async createMaterial(
    @Param('courseId') courseId: string,
    @Body() body: CreateCourseMaterialRequest,
  ) {
    return this.courseService.createMaterial(courseId, body);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete('courses/materials/:materialId')
  async deleteMaterial(@Param('materialId') materialId: string) {
    await this.courseService.deleteMaterial(materialId);
  }

  @Can('manage', 'Newcomer')
  @Get('quizzes')
  async getQuizBank() {
    return this.courseService.getQuizBank();
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('quizzes')
  async createQuiz(@Body() body: CreateQuizRequest) {
    return this.courseService.createQuiz(body);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete('quizzes/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string) {
    await this.courseService.deleteQuiz(quizId);
  }
}
