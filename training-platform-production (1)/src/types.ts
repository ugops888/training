export type PageId = 'direct' | 'franchise' | 'student' | 'training';

export interface Student {
  id: string;
  empNo: string;
  name: string;
  store: string;
  position: string;
  channel: '直營' | '加盟';
  hireDate: string;
  leaveDate: string | null;
  status: '在職' | '離職';
  avatarColor: string;
}

export interface StudentCourseRecord {
  id: string;
  studentId: string;
  courseName: string;
  category: string;
  enrollDate: string;
  completeDate: string | null;
  status: '已完成' | '進行中' | '未開始' | '未通過';
  score: number | null;
  satisfaction: number | null;
}

export interface StudentExamRecord {
  id: string;
  studentId: string;
  examName: string;
  examDate: string;
  score: number;
  passed: boolean;
  attempt: number;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: 'users' | 'star' | 'check' | 'clock' | 'book' | 'award';
}

export interface Course {
  id: string;
  name: string;
  category: string;
  channel: 'direct' | 'franchise' | 'both';
  enrolled: number;
  completed: number;
  satisfaction: number;
  schedule: string;
  status: 'ongoing' | 'upcoming' | 'done';
}

export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  trainer: string;
  location: string;
  attendees: number;
  capacity: number;
}
