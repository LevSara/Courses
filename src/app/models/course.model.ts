import { Lesson } from "./lesson.model";

export interface Course {
    id: number;
    title: string;
    description: string;
    teacherId: number;
    teacherName?: string;
    lessons?: Lesson[];
  }