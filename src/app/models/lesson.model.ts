export interface Lesson {
  id?: number;        // id לא חובה, ייווצר אוטומטית בצד שרת
  title: string;
  content: string;
  courseId: number;
}
